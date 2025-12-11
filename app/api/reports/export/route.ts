import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { errors, createErrorResponse } from '@/lib/apiError'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return createErrorResponse(errors.unauthorized())
  }
  if (!isManagerOrHigher(session.user.role as Role)) {
    return createErrorResponse(errors.forbidden())
  }

  const { searchParams } = new URL(request.url)
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  const objectives = await prisma.objective.findMany({
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      owner: { select: { name: true, email: true } },
      team: { select: { name: true } },
      keyResults: {
        select: { id: true, title: true, weight: true, target: true, current: true },
      },
    },
  })

  if (format === 'csv' || format === 'excel') {
    const headers = ['Objective', 'Owner', 'Team', 'Cycle', 'Status', 'Progress', 'KR Count']
    const rows = objectives.map((obj) => [
      `"${obj.title.replace(/"/g, '""')}"`,
      `"${obj.owner.name || obj.owner.email}"`,
      `"${obj.team?.name || ''}"`,
      `"${obj.cycle}"`,
      obj.status,
      `${obj.score ?? ''}`,
      `${obj.keyResults.length}`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="okr-report.csv"',
      },
    })
  }

  // Fallback: JSON summary
  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    total: objectives.length,
    objectives: objectives.map((obj) => ({
      title: obj.title,
      owner: obj.owner.name || obj.owner.email,
      team: obj.team?.name,
      cycle: obj.cycle,
      status: obj.status,
      progress: obj.score,
      keyResults: obj.keyResults.map((kr) => ({
        title: kr.title,
        weight: kr.weight,
        current: kr.current,
        target: kr.target,
      })),
    })),
  })
}
