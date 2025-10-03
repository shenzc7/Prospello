import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { calcProgress, calcProgressFromProgress, getTrafficLightStatus } from '@/lib/okr'
import { getFiscalQuarter } from '@/lib/india'
import { calculateKRProgress } from '@/lib/utils'
import { updateObjectiveRequestSchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'

type Params = {
  params: {
    id: string
  }
}

export async function GET(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = params

    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        team: {
          select: { id: true, name: true },
        },
        parent: {
          select: { id: true, title: true, cycle: true },
        },
        children: {
          select: { id: true, title: true },
        },
        keyResults: {
          include: {
            initiatives: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    })

    if (!objective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    // Check permissions - users can only view their own objectives unless they're managers/admins
    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    const keyResultsWithProgress = objective.keyResults.map((kr) => ({
      ...kr,
      progress: calculateKRProgress(kr.current, kr.target),
    }))

    const objectiveWithProgress = {
      ...objective,
      keyResults: keyResultsWithProgress,
      progress: calcProgressFromProgress(
        keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
      ),
    }

    return createSuccessResponse({ objective: objectiveWithProgress })
  } catch (error) {
    console.error('Error fetching objective:', error)
    return createErrorResponse(error)
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = params

    // First check if objective exists and get ownership info
    const existingObjective = await prisma.objective.findUnique({
      where: { id },
      select: { ownerId: true, cycle: true },
    })

    if (!existingObjective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    // Check permissions - only owner can edit unless manager/admin
    if (existingObjective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const validation = updateObjectiveRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const updateData = validation.data

    // Validate parent objective if being updated
    if (updateData.parentObjectiveId) {
      const parentObjective = await prisma.objective.findUnique({
        where: { id: updateData.parentObjectiveId },
        select: { cycle: true, ownerId: true },
      })

      if (!parentObjective) {
        return createErrorResponse(errors.notFound('Parent objective'))
      }

      // Parent must be in same cycle
      const targetCycle = updateData.cycle || existingObjective.cycle
      if (parentObjective.cycle !== targetCycle) {
        return createErrorResponse(errors.validation('Parent objective must be in the same cycle'))
      }

      // Check permission to align to parent
      if (parentObjective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
        return createErrorResponse(errors.forbidden('Cannot align to objectives you do not own'))
      }
    }

    // Prevent self-reference
    if (updateData.parentObjectiveId === id) {
      return createErrorResponse(errors.validation('Cannot set objective as its own parent'))
    }

    // Prepare update data
    const data: any = {}
    if (updateData.title) data.title = updateData.title
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.cycle) data.cycle = updateData.cycle
    if (updateData.startAt) {
      const startDate = new Date(updateData.startAt)
      data.startAt = startDate
      data.fiscalQuarter = getFiscalQuarter(startDate)
    }
    if (updateData.endAt) data.endAt = new Date(updateData.endAt)
    if (updateData.parentObjectiveId !== undefined) data.parentId = updateData.parentObjectiveId || null

    // Handle key results update if provided
    if (updateData.keyResults) {
      await prisma.$transaction(async (tx) => {
        // Delete existing key results
        await tx.keyResult.deleteMany({
          where: { objectiveId: id },
        })

        // Create new key results
        await tx.keyResult.createMany({
          data: updateData.keyResults!.map((kr: any) => ({
            objectiveId: id,
            title: kr.title,
            weight: kr.weight,
            target: kr.target,
            current: kr.current,
            unit: kr.unit,
          })),
        })
      })
    }

    // Update objective data (always do this, whether key results were updated or not)
    if (Object.keys(data).length > 0) {
      await prisma.objective.update({
        where: { id },
        data,
      })
    }

    // Fetch updated objective with all relations
    const updatedObjective = await prisma.objective.findUnique({
      where: { id },
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
        keyResults: {
          include: {
            initiatives: {
              select: {
                id: true,
                title: true,
                status: true,
                createdAt: true,
              },
              orderBy: { createdAt: 'desc' },
            },
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

    const objectiveWithProgress = {
      ...updatedObjective,
      keyResults: keyResultsWithProgress,
      progress: calcProgressFromProgress(
        keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
      ),
    }

    return createSuccessResponse({ objective: objectiveWithProgress })
  } catch (error) {
    console.error('Error updating objective:', error)
    return createErrorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = params

    // Check if objective exists and get ownership info
    const objective = await prisma.objective.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!objective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    // Check permissions - only owner can delete unless manager/admin
    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    // Delete objective (cascade will handle key results and initiatives)
    await prisma.objective.delete({
      where: { id },
    })

    return createSuccessResponse({ message: 'Objective deleted successfully' })
  } catch (error) {
    console.error('Error deleting objective:', error)
    return createErrorResponse(error)
  }
}
