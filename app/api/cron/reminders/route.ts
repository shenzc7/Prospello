import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { startOfWeek } from 'date-fns'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { createNotification, broadcastReminder } from '@/lib/notifications'

export async function POST(req: NextRequest) {
  try {
    const cronSecret = process.env.CRON_SECRET
    const providedSecret = req.headers.get('x-cron-secret')
    const isCronCall = cronSecret && providedSecret === cronSecret
    const session = isCronCall ? null : await getServerSession(authOptions)
    const hasRole = session?.user && isManagerOrHigher(session.user.role as Role)
    if (!isCronCall && !hasRole) {
      return new NextResponse('Unauthorized', { status: 401 })
    }
    if (session && !session.user?.orgId) {
      return new NextResponse('Organization not set for user', { status: 403 })
    }

    const url = new URL(req.url)
    const orgId = url.searchParams.get('orgId') || session?.user?.orgId
    if (!orgId) {
      return new NextResponse('Missing orgId for reminder run', { status: 400 })
    }

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

    if (reminders > 0) {
      await broadcastReminder(`OKRFlow: ${reminders} check-ins are due this week. Owners have been notified.`)
    }

    return NextResponse.json({ ok: true, reminders })
  } catch (error) {
    console.error('POST /api/cron/reminders failed', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
