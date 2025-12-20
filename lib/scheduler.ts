import { runReminderJob, runScoringJob } from '@/lib/jobs'
import type { PrismaClient } from '@prisma/client'

type SchedulerState = {
  started: boolean
  running?: boolean
  timer?: NodeJS.Timeout
}

type OrgSettings = Record<string, unknown>

const globalState = globalThis as unknown as { __okrScheduler?: SchedulerState }

const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build'
const isVercel = !!process.env.VERCEL
// Disable internal scheduler on Vercel - use Vercel Cron Jobs instead
// See: https://vercel.com/docs/cron-jobs
const ENABLE_SCHEDULER = !isBuildPhase && !isVercel && process.env.DISABLE_INTERNAL_SCHEDULER !== 'true'
const INTERVAL_MS = Number(process.env.SCHEDULER_INTERVAL_MS || 15 * 60 * 1000) // default 15 minutes
const REMINDER_CADENCE_MS = 24 * 60 * 60 * 1000 // daily
const SCORING_CADENCE_MS = 6 * 60 * 60 * 1000 // every 6 hours

function nowIso() {
  return new Date().toISOString()
}

async function runJobsOnce(prisma: PrismaClient, state: SchedulerState) {
  if (state.running) {
    return
  }
  state.running = true
  try {
    let orgs: Array<{ id: string; settings: OrgSettings | null }> = []
    try {
      orgs = await prisma.organization.findMany({ select: { id: true, settings: true } })
    } catch (err) {
      // During builds or pre-migration states, the column may not exist; bail quietly.
      console.warn('scheduler: organization fetch skipped (likely missing migrations or build phase)', err)
      return
    }
    const updates: Array<{ id: string; settings: OrgSettings }> = []

    for (const org of orgs) {
      const settings: OrgSettings = org.settings || {}
      const jobs = settings.jobs || {}
      const lastReminder = jobs.lastReminderRun ? new Date(jobs.lastReminderRun).getTime() : 0
      const lastScoring = jobs.lastScoringRun ? new Date(jobs.lastScoringRun).getTime() : 0
      const now = Date.now()
      let changed = false

      if (now - lastReminder > REMINDER_CADENCE_MS) {
        try {
          await runReminderJob(org.id)
          jobs.lastReminderRun = nowIso()
          changed = true
        } catch (err) {
          console.error('scheduler: reminder job failed', { orgId: org.id, err })
        }
      }

      if (now - lastScoring > SCORING_CADENCE_MS) {
        try {
          await runScoringJob(org.id)
          jobs.lastScoringRun = nowIso()
          changed = true
        } catch (err) {
          console.error('scheduler: scoring job failed', { orgId: org.id, err })
        }
      }

      if (changed) {
        updates.push({ id: org.id, settings: { ...settings, jobs } })
      }
    }

    if (updates.length) {
      await Promise.all(
        updates.map((update) =>
          prisma.organization.update({
            where: { id: update.id },
            data: { settings: update.settings },
          })
        )
      )
    }
  } finally {
    state.running = false
  }
}

function getState(): SchedulerState {
  if (!globalState.__okrScheduler) {
    globalState.__okrScheduler = { started: false, running: false }
  }
  return globalState.__okrScheduler
}

export function ensureBackgroundScheduler(prisma: PrismaClient) {
  if (!ENABLE_SCHEDULER) return
  if (globalState.__okrScheduler?.started) return
  const state = getState()
  state.started = true

  // Kick off immediately, then interval
  void runJobsOnce(prisma, state).catch((err) => {
    state.running = false
    console.error('scheduler run failed', err)
  })
  state.timer = setInterval(() => {
    void runJobsOnce(prisma, state).catch((err) => {
      state.running = false
      console.error('scheduler interval run failed', err)
    })
  }, INTERVAL_MS)
}















