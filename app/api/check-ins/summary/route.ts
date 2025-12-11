import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma, Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import {
  buildAlignmentTree,
  buildHeroSummary,
  buildProgressHeatmap,
  buildTeamHeatmap,
  buildWeeklySummary,
  type CheckInSummary,
  type SummaryKeyResult,
} from '@/lib/checkin-summary'
import { calcProgressFromProgress } from '@/lib/okr'
import { calculateKRProgress, calculateObjectiveScore } from '@/lib/utils'

function objectiveScopeForUser(user: { id: string; role: Role; orgId?: string | null }): Prisma.ObjectiveWhereInput {
  if (user.role === Role.ADMIN) return {}
  if (user.role === Role.MANAGER && user.orgId) {
    return { owner: { orgId: user.orgId } }
  }
  return { ownerId: user.id }
}

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const scope = objectiveScopeForUser({
      id: session.user.id as string,
      role: session.user.role as Role,
      orgId: (session.user as any).orgId ?? null,
    })

    const objectives = await prisma.objective.findMany({
      where: scope,
      select: {
        id: true,
        title: true,
        status: true,
        goalType: true,
        score: true,
        parentId: true,
        owner: { select: { id: true, name: true, email: true, orgId: true } },
        team: { select: { id: true, name: true } },
        keyResults: {
          select: {
            id: true,
            title: true,
            weight: true,
            target: true,
            current: true,
            checkIns: {
              orderBy: { weekStart: 'desc' },
              take: 6,
              select: { id: true, value: true, status: true, comment: true, weekStart: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const objectivesWithProgress = objectives.map((objective) => {
      const keyResults = objective.keyResults.map((kr) => ({
        ...kr,
        progress: calculateKRProgress(kr.current, kr.target),
      }))
      const progress = calcProgressFromProgress(keyResults.map((kr) => ({ progress: kr.progress, weight: kr.weight })))
      return {
        ...objective,
        keyResults,
        progress,
        score: typeof objective.score === 'number' ? objective.score : calculateObjectiveScore(progress),
      }
    })

    const keyResultInputs: SummaryKeyResult[] = objectivesWithProgress.flatMap((objective) =>
      objective.keyResults.map((kr) => ({
        id: kr.id,
        title: kr.title,
        target: kr.target,
        current: kr.current,
        weight: kr.weight,
        objectiveTitle: objective.title,
        ownerName: objective.owner.name || objective.owner.email,
        ownerEmail: objective.owner.email,
        checkIns: kr.checkIns.map((ci) => ({
          weekStart: ci.weekStart,
          value: ci.value,
          status: ci.status,
          comment: ci.comment,
        })),
      }))
    )

    const heatmap = buildProgressHeatmap(keyResultInputs)
    const weeklySummary = buildWeeklySummary(heatmap)
    const teamHeatmap = buildTeamHeatmap(
      objectivesWithProgress.map((objective) => ({
        teamId: objective.team?.id ?? null,
        teamName: objective.team?.name ?? null,
        ownerEmail: objective.owner.email,
        progress: objective.progress,
      }))
    )
    const alignment = buildAlignmentTree(
      objectivesWithProgress.map((objective) => ({
        id: objective.id,
        title: objective.title,
        progress: objective.progress,
        ownerName: objective.owner.name,
        ownerEmail: objective.owner.email,
        parentId: objective.parentId,
        teamName: objective.team?.name ?? null,
        goalType: objective.goalType,
      }))
    )
    const hero = buildHeroSummary(objectivesWithProgress)

    const recentCheckIns = await prisma.checkIn.findMany({
      where: { keyResult: { objective: scope } },
      orderBy: { weekStart: 'desc' },
      take: 15,
      select: {
        id: true,
        value: true,
        status: true,
        comment: true,
        weekStart: true,
        keyResultId: true,
        keyResult: {
          select: {
            title: true,
            objective: {
              select: {
                title: true,
                owner: { select: { name: true, email: true } },
              },
            },
          },
        },
      },
    })

    const payload: CheckInSummary = {
      hero,
      weeklySummary,
      heatmap,
      teamHeatmap,
      alignment,
      recentCheckIns: recentCheckIns.map((checkIn) => ({
        id: checkIn.id,
        keyResultId: checkIn.keyResultId,
        keyResultTitle: checkIn.keyResult.title,
        objectiveTitle: checkIn.keyResult.objective.title,
        ownerName: checkIn.keyResult.objective.owner.name || checkIn.keyResult.objective.owner.email,
        ownerEmail: checkIn.keyResult.objective.owner.email,
        status: checkIn.status,
        value: checkIn.value,
        comment: checkIn.comment,
        weekStart: checkIn.weekStart,
      })),
    }

    return createSuccessResponse(payload)
  } catch (err) {
    console.error('GET /api/check-ins/summary failed', err)
    return createErrorResponse(err)
  }
}
