import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { calculateKRProgress } from '@/lib/utils'
import { calcProgressFromProgress } from '@/lib/okr'

const updateSchema = z.object({
  name: z.string().min(2).optional(),
  memberIds: z.array(z.string()).optional(),
}).refine((data) => data.name || data.memberIds, { message: 'Provide a name or memberIds to update' })

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())
    if (!isManagerOrHigher(session.user.role as Role)) return createErrorResponse(errors.forbidden())

    const { id } = await params
    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        members: {
          include: { user: { select: { id: true, name: true, email: true, role: true } } },
        },
        objectives: {
          include: { keyResults: { select: { current: true, target: true, weight: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!team) return createErrorResponse(errors.notFound('Team'))

    const objectives = team.objectives.map((obj) => {
      const krs = obj.keyResults.map((kr) => ({
        ...kr,
        progress: calculateKRProgress(kr.current, kr.target),
      }))
      return {
        id: obj.id,
        title: obj.title,
        status: obj.status,
        progress: calcProgressFromProgress(krs.map((kr) => ({ progress: kr.progress, weight: kr.weight }))),
      }
    })

    return createSuccessResponse({
      team: {
        id: team.id,
        name: team.name,
        members: team.members.map((member) => member.user),
        objectives,
      },
    })
  } catch (error) {
    console.error('GET /api/teams/[id] failed', error)
    return createErrorResponse(error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())
    if (!isManagerOrHigher(session.user.role as Role)) return createErrorResponse(errors.forbidden())

    const { id } = await params
    const body = await request.json().catch(() => null)
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) return createErrorResponse(parsed.error)

    if (parsed.data.name) {
      await prisma.team.update({ where: { id }, data: { name: parsed.data.name } })
    }

    if (parsed.data.memberIds) {
      await prisma.teamMember.deleteMany({
        where: {
          teamId: id,
          NOT: { userId: { in: parsed.data.memberIds } },
        },
      })
      await prisma.teamMember.createMany({
        data: parsed.data.memberIds.map((userId) => ({ teamId: id, userId })),
        skipDuplicates: true,
      })
    }

    const updated = await prisma.team.findUnique({
      where: { id },
      include: {
        members: { include: { user: { select: { id: true, name: true, email: true, role: true } } } },
      },
    })

    if (!updated) return createErrorResponse(errors.notFound('Team'))

    return createSuccessResponse({
      team: {
        id: updated.id,
        name: updated.name,
        members: updated.members.map((m) => m.user),
      },
    })
  } catch (error) {
    console.error('PATCH /api/teams/[id] failed', error)
    return createErrorResponse(error)
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())
    if (!isManagerOrHigher(session.user.role as Role)) return createErrorResponse(errors.forbidden())

    const { id } = await params
    await prisma.team.delete({ where: { id } })
    return createSuccessResponse({ ok: true })
  } catch (error) {
    console.error('DELETE /api/teams/[id] failed', error)
    return createErrorResponse(error)
  }
}
