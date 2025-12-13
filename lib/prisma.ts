import { PrismaClient } from '@prisma/client'
import { ensureBackgroundScheduler } from '@/lib/scheduler'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

const SKIP_SCHEDULER =
  process.env.SKIP_SCHEDULER_FOR_BUILD === 'true' ||
  process.env.NEXT_PHASE === 'phase-production-build'

if (!SKIP_SCHEDULER) {
  // Delay to avoid running during module evaluation in sensitive environments
  setImmediate(() => {
    try {
      ensureBackgroundScheduler(prisma)
    } catch (err) {
      console.warn('scheduler initialization skipped', err)
    }
  })
}
