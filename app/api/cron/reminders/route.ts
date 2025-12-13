import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { isManagerOrHigher } from '@/lib/rbac'
import { runReminderJob } from '@/lib/jobs'
import { prisma } from '@/lib/prisma'

// Vercel Cron uses GET requests with Authorization header
export async function GET(req: NextRequest) {
  // Verify Vercel Cron authorization
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  return handleCronJob(req, true)
}

export async function POST(req: NextRequest) {
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
  
  return handleCronJob(req, isCronCall, session?.user?.orgId)
}

async function handleCronJob(req: NextRequest, isCronCall: boolean, sessionOrgId?: string | null) {
  const started = Date.now()
  try {
    const url = new URL(req.url)
    const orgIdParam = url.searchParams.get('orgId')
    
    // Handle "all" orgs for Vercel Cron
    if (isCronCall && orgIdParam === 'all') {
      const orgs = await prisma.organization.findMany({ select: { id: true } })
      let totalReminders = 0
      
      for (const org of orgs) {
        const { reminders } = await runReminderJob(org.id)
        totalReminders += reminders
      }
      
      const ms = Date.now() - started
      console.log('cron:reminders complete (all orgs)', { orgCount: orgs.length, totalReminders, ms })
      return NextResponse.json({ ok: true, reminders: totalReminders, orgCount: orgs.length, ms })
    }
    
    // Single org execution
    const orgId = sessionOrgId || orgIdParam
    if (!orgId) {
      return new NextResponse('Missing orgId for reminder run', { status: 400 })
    }

    const { reminders, ms: jobMs } = await runReminderJob(orgId)

    const ms = Date.now() - started
    console.log('cron:reminders complete', { orgId, reminders, ms, jobMs })
    return NextResponse.json({ ok: true, reminders, ms })
  } catch (error) {
    console.error('cron/reminders failed', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
