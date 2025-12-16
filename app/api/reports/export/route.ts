import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { isManagerOrHigher } from '@/lib/rbac'
import { errors, createErrorResponse } from '@/lib/apiError'
import { Role } from '@prisma/client'
import { buildExcel, buildPdf, getObjectivesForExport } from '@/lib/exporters'
import { prisma } from '@/lib/prisma'
import { mergeOrgSettings } from '@/lib/orgSettings'

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return createErrorResponse(errors.unauthorized())
  }
  const orgId = session.user.orgId
  if (!orgId) {
    return createErrorResponse(errors.forbidden('Organization not set for user'))
  }
  if (!isManagerOrHigher(session.user.role as Role)) {
    return createErrorResponse(errors.forbidden())
  }

  const { searchParams } = new URL(request.url)
  const format = (searchParams.get('format') || 'csv').toLowerCase()

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { name: true, settings: true },
  })
  const meta = {
    orgName: org?.name || 'Organization',
    settings: mergeOrgSettings(org?.settings),
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  }

  const rows = await getObjectivesForExport('company', session.user.id as string, session.user.role as Role, orgId)

  if (format === 'pdf') {
    const buffer = buildPdf(rows, meta)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="okr-report.pdf"',
      },
    })
  }

  if (format === 'excel' || format === 'xlsx') {
    const buffer = buildExcel(rows, meta)
    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': 'attachment; filename="okr-report.xlsx"',
      },
    })
  }

  const headers = ['Objective', 'Owner', 'Team', 'Cycle', 'Status', 'Progress', 'KR Count']
  const csvRows = rows.map((obj) => [
    `"${obj.title.replace(/"/g, '""')}"`,
    `"${obj.owner}"`,
    `"${obj.team || ''}"`,
    `"${obj.cycle}"`,
    obj.status,
    `${obj.progress ?? ''}`,
    `${obj.keyResults.length}`,
  ])
  const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n')
  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': 'attachment; filename="okr-report.csv"',
    },
  })
}











