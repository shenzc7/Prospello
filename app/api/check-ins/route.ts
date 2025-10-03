import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { Prisma } from '@prisma/client'
import { createCheckInRequestSchema, listCheckInsQuerySchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'

function startOfISOWeek(d: Date) {
  const date = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
  const day = date.getUTCDay() || 7
  if (day !== 1) date.setUTCDate(date.getUTCDate() - (day - 1))
  date.setUTCHours(0, 0, 0, 0)
  return date
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const { searchParams } = new URL(request.url)
    const queryData = {
      keyResultId: searchParams.get('keyResultId') || '',
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      userId: searchParams.get('userId') || undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    }
    const parsed = listCheckInsQuerySchema.safeParse(queryData)
    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }
    const { keyResultId, from, to, userId, limit, offset } = parsed.data

    // Authorize: only owner by default; managers/admins may view others
    const kr = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      select: { objective: { select: { ownerId: true } } },
    })
    if (!kr) return createErrorResponse(errors.notFound('Key result'))
    const isOwner = kr.objective.ownerId === session.user.id
    if (!isOwner && !isManagerOrHigher(session.user.role)) {
      return createErrorResponse(errors.forbidden())
    }

    const where: Prisma.CheckInWhereInput = { keyResultId }
    if (from || to) {
      where.weekStart = {}
      if (from) where.weekStart.gte = new Date(from)
      if (to) where.weekStart.lte = new Date(to)
    }
    if (userId) where.userId = userId
    else if (!isManagerOrHigher(session.user.role)) where.userId = session.user.id

    const [items, total] = await Promise.all([
      prisma.checkIn.findMany({
        where,
        orderBy: { weekStart: 'desc' },
        skip: offset,
        take: limit,
        select: { id: true, keyResultId: true, value: true, status: true, comment: true, weekStart: true, userId: true },
      }),
      prisma.checkIn.count({ where }),
    ])

    return createSuccessResponse({
      checkIns: items,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (err) {
    console.error('GET /api/check-ins failed', err)
    return createErrorResponse(err)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const body = await request.json().catch(() => null)
    const parsed = createCheckInRequestSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }
    const { keyResultId, value, status, comment } = parsed.data
    const weekStart = parsed.data.weekStart ? new Date(parsed.data.weekStart) : startOfISOWeek(new Date())

    // Authorize: only KR owner (objective owner) or manager/admin
    const kr = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      select: { objective: { select: { ownerId: true } } },
    })
    if (!kr) return createErrorResponse(errors.notFound('Key result'))
    const isOwner = kr.objective.ownerId === session.user.id
    if (!isOwner && !isManagerOrHigher(session.user.role)) {
      return createErrorResponse(errors.forbidden())
    }

    const checkIn = await prisma.$transaction(async (tx) => {
      const upserted = await tx.checkIn.upsert({
        where: {
          keyResultId_userId_weekStart: {
            keyResultId,
            userId: session.user.id,
            weekStart,
          },
        },
        update: { value, status, comment: comment ?? null },
        create: { keyResultId, userId: session.user.id, weekStart, value, status, comment: comment ?? null },
        select: { id: true, keyResultId: true, value: true, status: true, comment: true, weekStart: true, userId: true },
      })

      // Update KR current to reflect latest value
      await tx.keyResult.update({ where: { id: keyResultId }, data: { current: value } })
      return upserted
    })

    return createSuccessResponse({ checkIn }, 201)
  } catch (err: unknown) {
    console.error('POST /api/check-ins failed', err)
    return createErrorResponse(err)
  }
}
