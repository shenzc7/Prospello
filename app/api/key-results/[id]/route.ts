import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { updateKeyResultRequestSchema } from '@/lib/schemas'

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = await params

    // Check if key result exists and get objective ownership info
    const keyResult = await prisma.keyResult.findUnique({
      where: { id },
      select: {
        objective: {
          select: { ownerId: true },
        },
      },
    })

    if (!keyResult) {
      return createErrorResponse(errors.notFound('Resource'))
    }

    // Check permissions - only objective owner can modify key results unless manager/admin
    if (keyResult.objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const validation = updateKeyResultRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const updateData = validation.data

    // If updating weights, we need to validate that all key results for the objective still sum to 100
    if (updateData.weight !== undefined) {
      const objectiveId = await prisma.keyResult.findUnique({
        where: { id },
        select: { objectiveId: true },
      })

      if (objectiveId) {
        const allKeyResults = await prisma.keyResult.findMany({
          where: { objectiveId: objectiveId.objectiveId },
          select: { id: true, weight: true },
        })

        const totalWeight = allKeyResults.reduce((sum: number, kr: { id: string; weight: number }) => {
          if (kr.id === id) {
            return sum + (updateData.weight ?? 0)
          }
          return sum + kr.weight
        }, 0)

        if (totalWeight !== 100) {
          return createErrorResponse(errors.validation('Key result weights must sum to 100 for the objective'))
        }
      }
    }

    // Update the key result
    const updatedKeyResult = await prisma.keyResult.update({
      where: { id },
      data: updateData,
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

    return createSuccessResponse({ keyResult: updatedKeyResult })
  } catch (error) {
    console.error('Error updating key result:', error)
    return createErrorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = await params

    // Check if key result exists and get objective ownership info
    const keyResult = await prisma.keyResult.findUnique({
      where: { id },
      select: {
        objective: {
          select: { ownerId: true },
        },
      },
    })

    if (!keyResult) {
      return createErrorResponse(errors.notFound('Resource'))
    }

    // Check permissions - only objective owner can delete key results unless manager/admin
    if (keyResult.objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    // Delete the key result
    await prisma.keyResult.delete({
      where: { id },
    })

    return createSuccessResponse({ message: 'Key result deleted successfully' })
  } catch (error) {
    console.error('Error deleting key result:', error)
    return createErrorResponse(error)
  }
}
