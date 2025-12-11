import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { prisma } from '@/lib/prisma'
import { createNotification } from '@/lib/notifications'

const querySchema = z.object({
  objectiveId: z.string().optional(),
  keyResultId: z.string().optional(),
}).refine((val) => Boolean(val.objectiveId || val.keyResultId), {
  message: 'Provide an objectiveId or keyResultId to fetch comments',
})

const createSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty'),
  objectiveId: z.string().optional(),
  keyResultId: z.string().optional(),
}).refine((val) => Boolean(val.objectiveId || val.keyResultId), {
  message: 'Attach the comment to an objective or key result',
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const { searchParams } = new URL(request.url)
    const parsed = querySchema.safeParse({
      objectiveId: searchParams.get('objectiveId') || undefined,
      keyResultId: searchParams.get('keyResultId') || undefined,
    })

    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { objectiveId, keyResultId } = parsed.data
    if (objectiveId) {
      const objective = await prisma.objective.findUnique({
        where: { id: objectiveId },
        select: { owner: { select: { orgId: true } } },
      })
      if (!objective || objective.owner?.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Objective is in a different organization'))
      }
    }
    if (keyResultId) {
      const keyResult = await prisma.keyResult.findUnique({
        where: { id: keyResultId },
        select: { objective: { select: { owner: { select: { orgId: true } } } } },
      })
      if (!keyResult || keyResult.objective?.owner?.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Key result is in a different organization'))
      }
    }

    const where: {
      objectiveId?: string
      keyResultId?: string
      objective?: { owner: { orgId: string } }
      keyResult?: { objective: { owner: { orgId: string } } }
    } = {}
    if (objectiveId) {
      where.objectiveId = objectiveId
      where.objective = { owner: { orgId } }
    }
    if (keyResultId) {
      where.keyResultId = keyResultId
      where.keyResult = { objective: { owner: { orgId } } }
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    })

    return createSuccessResponse({ comments })
  } catch (error) {
    console.error('GET /api/comments failed', error)
    return createErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const body = await request.json().catch(() => null)
    const parsed = createSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { content, objectiveId, keyResultId } = parsed.data

    let targetObjectiveId: string | null = null
    let targetOwnerId: string | null = null
    let targetTitle = 'your objective'

    if (objectiveId) {
      const objective = await prisma.objective.findUnique({
        where: { id: objectiveId },
        select: { id: true, ownerId: true, title: true, owner: { select: { orgId: true } } },
      })
      if (!objective) return createErrorResponse(errors.notFound('Objective or Key Result'))
      if (objective.owner?.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Objective is in a different organization'))
      }
      targetObjectiveId = objective.id
      targetOwnerId = objective.ownerId
      targetTitle = objective.title || targetTitle
    } else if (keyResultId) {
      const keyResult = await prisma.keyResult.findUnique({
        where: { id: keyResultId },
        select: { title: true, objective: { select: { id: true, ownerId: true, title: true, owner: { select: { orgId: true } } } } },
      })
      if (!keyResult?.objective) return createErrorResponse(errors.notFound('Objective or Key Result'))
      if (keyResult.objective.owner?.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Key result is in a different organization'))
      }
      targetObjectiveId = keyResult.objective.id
      targetOwnerId = keyResult.objective.ownerId
      targetTitle = keyResult.objective.title || keyResult.title || targetTitle
    }

    const created = await prisma.comment.create({
      data: {
        content,
        objectiveId: targetObjectiveId,
        keyResultId: keyResultId || null,
        userId: session.user.id as string,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    if (targetOwnerId && targetOwnerId !== session.user.id) {
      await createNotification({
        userId: targetOwnerId,
        type: 'COMMENT',
        message: `${session.user.name || session.user.email} commented on ${targetTitle}`,
        metadata: {
          objectiveId: targetObjectiveId,
          keyResultId: keyResultId || null,
        },
      })
    }

    return createSuccessResponse({ comment: created }, 201)
  } catch (error) {
    console.error('POST /api/comments failed', error)
    return createErrorResponse(error)
  }
}
