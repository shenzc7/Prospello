import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { createKeyResultRequestSchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { Role } from '@prisma/client'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id: objectiveId } = await params

    // Check if objective exists and user has access
    const objective = await prisma.objective.findUnique({
      where: { id: objectiveId },
      select: { ownerId: true },
    })

    if (!objective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    // Check permissions - only owner can modify key results unless manager/admin
    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const validation = createKeyResultRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const { keyResults } = validation.data

    // Create key results in a transaction to ensure data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Delete existing key results for this objective
      await tx.keyResult.deleteMany({
        where: { objectiveId },
      })

      // Create new key results
      const createdKeyResults = await tx.keyResult.createManyAndReturn({
        data: keyResults.map((kr) => ({
          objectiveId,
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
          createdAt: true,
          updatedAt: true,
        },
      })

      return createdKeyResults
    })

    return createSuccessResponse({
      keyResults: result,
      message: 'Key results updated successfully'
    }, 201)
  } catch (error) {
    console.error('Error creating key results:', error)
    return createErrorResponse(error)
  }
}
