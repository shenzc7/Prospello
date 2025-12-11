import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { calcProgressFromProgress } from '@/lib/okr'
import { getFiscalQuarter } from '@/lib/india'
import { calculateKRProgress, calculateObjectiveScore } from '@/lib/utils'
import { createObjectiveRequestSchema, listObjectivesQuerySchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { monitorDatabaseQuery } from '@/lib/performance'
import { Role, ObjectiveStatus } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { searchParams } = new URL(request.url)
    const validation = listObjectivesQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      cycle: searchParams.get('cycle') || undefined,
      ownerId: searchParams.get('ownerId') || undefined,
      teamId: searchParams.get('teamId') || undefined,
      fiscalQuarter: searchParams.get('fiscalQuarter') || undefined,
      status: searchParams.get('status') || undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    })

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const { search, cycle, ownerId, teamId, fiscalQuarter, status, limit, offset } = validation.data as {
      search?: string
      cycle?: string
      ownerId?: string
      teamId?: string
      fiscalQuarter?: number
      status?: ObjectiveStatus
      limit: number
      offset: number
    }

    // Build where clause
    const where: {
      ownerId?: string
      teamId?: string
      fiscalQuarter?: number
      cycle?: string
      status?: ObjectiveStatus
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' } } | { description?: { contains: string; mode: 'insensitive' } }>
    } = {}

    // If not admin/manager, only show own objectives
    if (session?.user && !isManagerOrHigher(session.user.role as Role)) {
      where.ownerId = session.user.id
    } else if (ownerId) {
      where.ownerId = ownerId
    }
    if (teamId) where.teamId = teamId
    if (typeof fiscalQuarter === 'number') where.fiscalQuarter = fiscalQuarter
    if (cycle) where.cycle = cycle
    if (status) where.status = status

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ]
    }

    // Optimize queries by reducing includes and using select with performance monitoring
    const objectives = await monitorDatabaseQuery(
      () => prisma.objective.findMany({
        where,
        select: {
          id: true,
          title: true,
          description: true,
          cycle: true,
          startAt: true,
          endAt: true,
          status: true,
          fiscalQuarter: true,
          score: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          teamId: true,
          parentId: true,
          goalType: true,
          owner: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
          parent: {
            select: { id: true, title: true },
          },
          keyResults: {
            select: {
              id: true,
              title: true,
              weight: true,
              target: true,
              current: true,
              unit: true,
            },
          },
          _count: {
            select: { children: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      'findMany objectives',
      'objectives'
    )

    // Get total count in a separate query for better performance
    const total = await monitorDatabaseQuery(
      () => prisma.objective.count({ where }),
      'count objectives',
      'objectives'
    ) as number

    // Calculate progress for each objective
    const objectivesWithProgress = (objectives as Array<{
      id: string
      title: string
      description: string | null
      cycle: string
      startAt: Date
      endAt: Date
      status: ObjectiveStatus
      fiscalQuarter: number
      score: number | null
      createdAt: Date
      updatedAt: Date
      ownerId: string
      teamId: string | null
      parentId: string | null
      owner: { id: string; name: string | null; email: string }
      team: { id: string; name: string } | null
      parent: { id: string; title: string } | null
      keyResults: Array<{
        id: string
        title: string
        weight: number
        target: number
        current: number
        unit: string | null
      }>
      _count: { children: number }
    }>).map((objective) => {
      const keyResultsWithProgress = objective.keyResults.map((kr) => ({
        ...kr,
        progress: calculateKRProgress(kr.current, kr.target),
      }))
      const progress = calcProgressFromProgress(
        keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
      )
      return {
        ...objective,
        keyResults: keyResultsWithProgress,
        progress,
        score: typeof objective.score === 'number' ? objective.score : calculateObjectiveScore(progress),
      }
    })

    const response = createSuccessResponse({
      objectives: objectivesWithProgress,
      pagination: {
        total,
        limit,
        offset,
        hasMore: (offset as number) + (limit as number) < total,
      },
    })

    // Add caching headers for better performance
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    response.headers.set('X-Content-Type-Options', 'nosniff')

    return response
  } catch (error) {
    return createErrorResponse(error, {
      operation: 'fetchObjectives',
      searchParams: Object.fromEntries(new URL(request.url).searchParams),
    })
  }
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return createErrorResponse(errors.unauthorized())
  }

  try {

    const body = await request.json().catch(() => null)
    const validation = createObjectiveRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const { title, description, cycle, goalType, startAt, endAt, parentObjectiveId, ownerId, teamId, keyResults } = validation.data

    // Role-based limits and validation
    const userRole = session.user.role as Role

    // Employee limits: max 5 objectives
    if (userRole === 'EMPLOYEE') {
      const userObjectiveCount = await prisma.objective.count({
        where: { ownerId: session.user.id }
      })

      if (userObjectiveCount >= 5) {
        return createErrorResponse(errors.validation('Employees can create a maximum of 5 objectives'))
      }
    }

    // Key Result limits based on role
    if (keyResults.length > 5) {
      return createErrorResponse(errors.validation('Maximum 5 Key Results allowed per objective'))
    }

    // Additional validation for non-admin users
    if (userRole === 'EMPLOYEE' && ownerId && ownerId !== session.user.id) {
      return createErrorResponse(errors.forbidden('Employees cannot assign objectives to other users'))
    }

    // Validate parent objective exists and belongs to same cycle
    if (parentObjectiveId) {
      const parentObjective = await prisma.objective.findUnique({
        where: { id: parentObjectiveId },
        select: { cycle: true, ownerId: true },
      })

      if (!parentObjective) {
        return createErrorResponse(errors.notFound('Parent objective'))
      }

      if (parentObjective.cycle !== cycle) {
        return createErrorResponse(errors.validation('Parent objective must be in the same cycle'))
      }

      // Check if user can align to this parent (own objective or if manager/admin)
      if (parentObjective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
        return createErrorResponse(errors.forbidden('Cannot align to objectives you do not own'))
      }
    }

    // Prevent self-reference
    if (parentObjectiveId === session.user.id) {
      return createErrorResponse(errors.validation('Cannot set objective as its own parent'))
    }

    // Resolve owner and optional team assignment
    const resolvedOwnerId = isManagerOrHigher(userRole as Role) && ownerId ? ownerId : session.user.id

    // Create objective with key results in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const startDate = new Date(startAt)
      const endDate = new Date(endAt)

      const objective = await tx.objective.create({
        data: {
          title,
          description,
          cycle,
          goalType: goalType as 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL',
          startAt: startDate,
          endAt: endDate,
          ownerId: resolvedOwnerId,
          teamId: teamId ?? null,
          parentId: parentObjectiveId || null,
          fiscalQuarter: getFiscalQuarter(startDate),
        },
        include: {
          owner: {
            select: { id: true, name: true, email: true },
          },
          team: {
            select: { id: true, name: true },
          },
          parent: {
            select: { id: true, title: true },
          },
        },
      })

      const createdKeyResults = await tx.keyResult.createManyAndReturn({
        data: keyResults.map((kr) => ({
          objectiveId: objective.id,
          title: kr.title,
          weight: kr.weight,
          target: kr.target,
          current: kr.current,
          unit: kr.unit,
        })),
        select: {
          id: true,
          title: true,
          weight: true,
          target: true,
          current: true,
          unit: true,
        },
      })

      const keyResultsWithProgress = createdKeyResults.map((kr) => ({
        ...kr,
        progress: calculateKRProgress(kr.current, kr.target),
      }))

      return {
        ...objective,
        keyResults: keyResultsWithProgress,
        progress: calcProgressFromProgress(
          keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
        ),
      }
    })

    return createSuccessResponse({ objective: result }, 201)
  } catch (error) {
    return createErrorResponse(error, {
      operation: 'createObjective',
      userId: session?.user?.id,
    })
  }
}
