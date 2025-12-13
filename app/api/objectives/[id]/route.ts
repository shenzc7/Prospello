import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { calcProgressFromProgress } from '@/lib/okr'
import { getFiscalQuarter } from '@/lib/india'
import { calculateKRProgress, calculateObjectiveScore } from '@/lib/utils'
import { updateObjectiveRequestSchema, type UpdateObjectiveRequest } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { ProgressType, Role, GoalType } from '@prisma/client'

function isValidAlignment(child: GoalType, parent?: GoalType | null): boolean {
  if (!parent) {
    return child === 'COMPANY'
  }
  if (child === 'DEPARTMENT') return parent === 'COMPANY'
  if (child === 'TEAM') return parent === 'DEPARTMENT'
  if (child === 'INDIVIDUAL') return parent === 'TEAM'
  return false
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const { id } = await params

    const objective = await prisma.objective.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, orgId: true },
        },
        team: {
          select: { id: true, name: true, orgId: true },
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
    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }
    if (objective.owner?.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('Objective is in a different organization'))
    }

    const keyResultsWithProgress = objective.keyResults.map((kr) => ({
      ...kr,
      progress: calculateKRProgress(kr.current, kr.target),
    }))

    const progress = objective.progressType === ProgressType.MANUAL
      ? Math.round(objective.progress ?? 0)
      : calcProgressFromProgress(
        keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
      )

    const objectiveWithProgress = {
      ...objective,
      keyResults: keyResultsWithProgress,
      progress,
    }

    return createSuccessResponse({ objective: objectiveWithProgress })
  } catch (error) {
    console.error('Error fetching objective:', error)
    return createErrorResponse(error)
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const { id } = await params

    // First check if objective exists and get ownership info
    const existingObjective = await prisma.objective.findUnique({
      where: { id },
      select: { ownerId: true, cycle: true, goalType: true, parentId: true, owner: { select: { orgId: true } } },
    })

    if (!existingObjective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    // Check permissions - only owner can edit unless manager/admin
    if (existingObjective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }
    if (existingObjective.owner?.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('Objective is in a different organization'))
    }

    const body = await request.json().catch(() => null)
    const validation = updateObjectiveRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const updateData = validation.data

    const effectiveGoalType = (updateData.goalType as GoalType | undefined) ?? (existingObjective.goalType as GoalType)
    let currentParentGoalType: GoalType | null = null
    if (existingObjective.parentId) {
      const parent = await prisma.objective.findUnique({
        where: { id: existingObjective.parentId },
        select: { goalType: true },
      })
      currentParentGoalType = parent?.goalType ?? null
    }

    // Validate parent objective if being updated
    if (updateData.parentObjectiveId) {
      const parentObjective = await prisma.objective.findUnique({
        where: { id: updateData.parentObjectiveId },
        select: { cycle: true, goalType: true, ownerId: true, owner: { select: { orgId: true } } },
      })

      if (!parentObjective) {
        return createErrorResponse(errors.notFound('Parent objective'))
      }

      // Parent must be in same cycle
      const targetCycle = updateData.cycle || existingObjective.cycle
      if (parentObjective.cycle !== targetCycle) {
        return createErrorResponse(errors.validation('Parent objective must be in the same cycle'))
      }

      if (!isValidAlignment(effectiveGoalType, parentObjective.goalType)) {
        return createErrorResponse(errors.validation('Alignment must follow Company → Department → Team → Individual cascade'))
      }

      // Check permission to align to parent
      if (parentObjective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
        return createErrorResponse(errors.forbidden('Cannot align to objectives you do not own'))
      }
      if (parentObjective.owner?.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Parent objective is in a different organization'))
      }
    } else {
      // If no parent is provided in the update payload, ensure existing linkage still respects cascade.
      if (!existingObjective.parentId && effectiveGoalType !== 'COMPANY') {
        return createErrorResponse(errors.validation('Non-company objectives must align to a parent objective of the correct type'))
      }
      if (existingObjective.parentId && !isValidAlignment(effectiveGoalType, currentParentGoalType)) {
        return createErrorResponse(errors.validation('Alignment must follow Company → Department → Team → Individual cascade'))
      }
    }

    // Prevent self-reference
    if (updateData.parentObjectiveId === id) {
      return createErrorResponse(errors.validation('Cannot set objective as its own parent'))
    }

    // Prepare update data
    const data: Partial<{
      title: string
      description?: string | null
      cycle: string
      startAt: Date
      endAt: Date
      ownerId: string
      teamId: string | null
      parentId: string | null
      fiscalQuarter: number
      goalType: GoalType
      priority: number
      weight: number
    }> = {}
    if (updateData.title) data.title = updateData.title
    if (updateData.description !== undefined) data.description = updateData.description
    if (updateData.cycle) data.cycle = updateData.cycle
    if (updateData.goalType) data.goalType = updateData.goalType as GoalType
    if (updateData.priority !== undefined) data.priority = updateData.priority
    if (updateData.weight !== undefined) data.weight = updateData.weight
    if (updateData.ownerId) {
      if (!isManagerOrHigher(session.user.role as Role)) {
        return createErrorResponse(errors.forbidden('Only managers or admins can reassign owners'))
      }
      data.ownerId = updateData.ownerId
      const newOwner = await prisma.user.findUnique({
        where: { id: updateData.ownerId },
        select: { orgId: true },
      })
      if (!newOwner || newOwner.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Owner must belong to your organization'))
      }
    }
    if (updateData.teamId !== undefined) {
      if (updateData.teamId) {
        const team = await prisma.team.findUnique({
          where: { id: updateData.teamId },
          select: { orgId: true },
        })
        if (!team || team.orgId !== orgId) {
          return createErrorResponse(errors.forbidden('Team must belong to your organization'))
        }
      }
      data.teamId = updateData.teamId || null
    }
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
          data: updateData.keyResults!.map((kr: UpdateObjectiveRequest['keyResults'][number]) => ({
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
          select: { id: true, name: true, email: true, orgId: true },
        },
        team: {
          select: { id: true, name: true, orgId: true },
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

    const progress = updatedObjective.progressType === ProgressType.MANUAL
      ? Math.round(updatedObjective.progress ?? 0)
      : calcProgressFromProgress(
        keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
      )

    const objectiveWithProgress = {
      ...updatedObjective,
      keyResults: keyResultsWithProgress,
      progress,
    }

    await prisma.objective.update({
      where: { id },
      data: { progress, score: calculateObjectiveScore(progress) },
    })

    return createSuccessResponse({ objective: objectiveWithProgress })
  } catch (error) {
    console.error('Error updating objective:', error)
    return createErrorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const { id } = await params

    // Check if objective exists and get ownership info
    const objective = await prisma.objective.findUnique({
      where: { id },
      select: { ownerId: true, owner: { select: { orgId: true } } },
    })

    if (!objective) {
      return createErrorResponse(errors.notFound('Objective'))
    }

    // Check permissions - only owner can delete unless manager/admin
    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }
    if (objective.owner?.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('Objective is in a different organization'))
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
