import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { calcProgressFromProgress } from '@/lib/okr'
import { updateObjectiveStatusSchema } from '@/lib/schemas'
import { calculateKRProgress } from '@/lib/utils'

type Params = {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = params

    const objective = await prisma.objective.findUnique({
      where: { id },
      select: {
        id: true,
        ownerId: true,
      },
    })

    if (!objective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const validation = updateObjectiveStatusSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    await prisma.objective.update({
      where: { id },
      data: { status: validation.data.status },
    })

    const updatedObjective = await prisma.objective.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
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
      },
    })

    if (!updatedObjective) {
      throw new Error('Failed to fetch updated objective')
    }

    const keyResultsWithProgress = updatedObjective.keyResults.map((kr) => ({
      ...kr,
      progress: calculateKRProgress(kr.current, kr.target),
    }))

    return createSuccessResponse({
      objective: {
        ...updatedObjective,
        keyResults: keyResultsWithProgress,
        progress: calcProgressFromProgress(
          keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
        ),
      },
    })
  } catch (error) {
    console.error('Error updating objective status:', error)
    return createErrorResponse(error)
  }
}
