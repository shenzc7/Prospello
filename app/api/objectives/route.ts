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
import { createNotification } from '@/lib/notifications'
import { Role, ObjectiveStatus, GoalType } from '@prisma/client'

function isValidAlignment(child: GoalType, parent?: GoalType | null): boolean {
  if (!parent) {
    return child === 'COMPANY'
  }
  if (child === 'DEPARTMENT') return parent === 'COMPANY'
  if (child === 'TEAM') return parent === 'DEPARTMENT'
  if (child === 'INDIVIDUAL') return parent === 'TEAM'
  return false
}

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
      owner?: { orgId: string }
      OR?: Array<{ title?: { contains: string; mode: 'insensitive' } } | { description?: { contains: string; mode: 'insensitive' } }>
    } = {}

    // Enforce tenant scoping
    where.owner = { orgId }

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
          priority: true,
          weight: true,
          status: true,
          fiscalQuarter: true,
          score: true,
          progress: true,
          progressType: true,
          createdAt: true,
          updatedAt: true,
          ownerId: true,
          teamId: true,
          parentId: true,
          goalType: true,
          owner: {
            select: { id: true, name: true, email: true, orgId: true },
          },
          team: {
            select: { id: true, name: true, orgId: true },
          },
          parent: {
            select: { id: true, title: true, goalType: true },
          },
          keyResults: {
            select: {
              id: true,
              title: true,
              weight: true,
              target: true,
              current: true,
              unit: true,
              _count: {
                select: { initiatives: true },
              },
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
      priority: number
      weight: number
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
      parent: { id: string; title: string; goalType: GoalType } | null
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
      const keyResultsWithProgress = objective.keyResults.map((kr) => {
        const { _count, ...rest } = kr as typeof kr & { _count?: { initiatives?: number } }
        const initiativeCount = _count?.initiatives ?? 0
        return {
          ...rest,
          progress: calculateKRProgress(kr.current, kr.target),
          initiativeCount,
        }
      })
      const progress = (objective as typeof objective & { progressType: string }).progressType === 'MANUAL'
        ? Math.round((objective as typeof objective & { progress: number | null }).progress ?? 0)
        : calcProgressFromProgress(
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
  const orgId = session.user.orgId
  if (!orgId) {
    return createErrorResponse(errors.forbidden('Organization not set for user'))
  }

  try {

    const body = await request.json().catch(() => null)
    const validation = createObjectiveRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const { title, description, cycle, goalType, startAt, endAt, parentObjectiveId, ownerId, teamId, keyResults, progressType, progress, priority, weight } = validation.data

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
        select: { cycle: true, goalType: true, ownerId: true, owner: { select: { orgId: true } } },
      })

      if (!parentObjective) {
        return createErrorResponse(errors.notFound('Parent objective'))
      }

      if (parentObjective.cycle !== cycle) {
        return createErrorResponse(errors.validation('Parent objective must be in the same cycle'))
      }

      if (!isValidAlignment(goalType as GoalType, parentObjective.goalType)) {
        return createErrorResponse(errors.validation('Alignment must follow Company → Department → Team → Individual cascade'))
      }

      // Check if user can align to this parent (own objective or if manager/admin)
      if (parentObjective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
        return createErrorResponse(errors.forbidden('Cannot align to objectives you do not own'))
      }
      if (parentObjective.owner?.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Parent objective is in a different organization'))
      }
    } else if (!isValidAlignment(goalType as GoalType, null)) {
      return createErrorResponse(errors.validation('Company objectives cannot have parents; other goal types must align to a parent'))
    }

    // Resolve owner and optional team assignment
    const resolvedOwnerId = isManagerOrHigher(userRole as Role) && ownerId ? ownerId : session.user.id
    const ownerRecord = await prisma.user.findUnique({
      where: { id: resolvedOwnerId },
      select: { orgId: true },
    })
    if (!ownerRecord || ownerRecord.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('Owner must belong to your organization'))
    }

    const resolvedTeamId: string | null = teamId ?? null
    if (resolvedTeamId) {
      const team = await prisma.team.findUnique({
        where: { id: resolvedTeamId },
        select: { orgId: true },
      })
      if (!team || team.orgId !== orgId) {
        return createErrorResponse(errors.forbidden('Team must belong to your organization'))
      }
    }

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
          priority: priority ?? 3,
          weight: weight ?? 0,
          startAt: startDate,
          endAt: endDate,
          ownerId: resolvedOwnerId,
          teamId: resolvedTeamId,
          parentId: parentObjectiveId || null,
          fiscalQuarter: getFiscalQuarter(startDate),
          progressType: progressType || 'AUTOMATIC',
          progress: progressType === 'MANUAL' ? progress ?? 0 : 0,
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

      const computedProgress = progressType === 'MANUAL'
        ? Math.round(progress ?? 0)
        : calcProgressFromProgress(
          keyResultsWithProgress.map((kr) => ({ progress: kr.progress, weight: kr.weight }))
        )

      await tx.objective.update({
        where: { id: objective.id },
        data: { progress: computedProgress, score: calculateObjectiveScore(computedProgress) },
      })

      return {
        ...objective,
        keyResults: keyResultsWithProgress,
        progress: computedProgress,
      }
    })

    // Notify assignee when someone else assigns them an objective
    if (result.ownerId !== session.user.id) {
      await createNotification({
        userId: result.ownerId,
        type: 'SYSTEM',
        message: `${session.user.name || session.user.email} assigned you an objective: ${result.title}`,
        metadata: { objectiveId: result.id },
      })
    }

    return createSuccessResponse({ objective: result }, 201)
  } catch (error) {
    return createErrorResponse(error, {
      operation: 'createObjective',
      userId: session?.user?.id,
    })
  }
}
