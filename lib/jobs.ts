import { prisma } from '@/lib/prisma'
import { calculateObjectiveScore, calculateTrafficLightStatus } from '@/lib/utils'
import { ProgressType, ObjectiveStatus } from '@prisma/client'
import { startOfWeek } from 'date-fns'
import { createNotification } from '@/lib/notifications'

export async function runScoringJob(orgId: string, cycle?: string) {
  const started = Date.now()
  const objectives = await prisma.objective.findMany({
    where: {
      ...(cycle ? { cycle } : {}),
      owner: { orgId },
    },
    include: { keyResults: true },
  })

  let updatedCount = 0
  for (const obj of objectives) {
    if (!obj.keyResults.length && obj.progressType === ProgressType.AUTOMATIC) continue

    const roundedProgress = obj.progressType === ProgressType.MANUAL
      ? Math.round(obj.progress ?? 0)
      : Math.round(
        obj.keyResults.reduce((sum, kr) => {
          const progressPercent = Math.min(Math.max((kr.current / kr.target) * 100, 0), 100)
          return sum + (progressPercent * (kr.weight / 100))
        }, 0)
      )

    const score = Number(calculateObjectiveScore(roundedProgress).toFixed(2))
    let status: ObjectiveStatus | undefined = obj.status
    const light = calculateTrafficLightStatus(roundedProgress)
    if (light === 'green') status = ObjectiveStatus.IN_PROGRESS
    if (light === 'yellow') status = ObjectiveStatus.AT_RISK
    if (light === 'red') status = ObjectiveStatus.AT_RISK
    if (roundedProgress >= 95) status = ObjectiveStatus.DONE

    await prisma.objective.update({
      where: { id: obj.id },
      data: {
        score,
        progress: obj.progressType === ProgressType.MANUAL ? obj.progress : roundedProgress,
        status,
      },
    })
    updatedCount++
  }

  return { updatedCount, ms: Date.now() - started }
}

export async function runReminderJob(orgId: string) {
  const started = Date.now()
  const start = startOfWeek(new Date(), { weekStartsOn: 1 })

  const keyResults = await prisma.keyResult.findMany({
    where: { objective: { owner: { orgId } } },
    include: {
      objective: {
        select: { id: true, title: true, ownerId: true, owner: { select: { name: true, email: true } } },
      },
      checkIns: {
        orderBy: { weekStart: 'desc' },
        take: 1,
        select: { weekStart: true },
      },
    },
  })

  let reminders = 0
  for (const kr of keyResults) {
    const latest = kr.checkIns[0]?.weekStart
    const needsReminder = !latest || latest < start

    if (needsReminder && kr.objective?.ownerId) {
      reminders++
      await createNotification({
        userId: kr.objective.ownerId,
        type: 'REMINDER',
        message: `Weekly check-in due for "${kr.objective.title}"`,
        metadata: { keyResultId: kr.id, objectiveId: kr.objective.id },
      })
    }
  }

  return { reminders, ms: Date.now() - started }
}





