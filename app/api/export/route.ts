import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { createErrorResponse, errors } from '@/lib/apiError'
import { buildExcel, buildPdf, getObjectivesForExport } from '@/lib/exporters'
import { prisma } from '@/lib/prisma'
import { mergeOrgSettings } from '@/lib/orgSettings'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const role = session.user.role as Role
    if (role === Role.EMPLOYEE) {
      return createErrorResponse(errors.forbidden('Exports are limited to managers and admins.'))
    }

    const body = await req.json().catch(() => ({} as { format?: string; scope?: string }))
    const format = (body.format || 'pdf').toLowerCase()
    const scope = (body.scope || 'company').toLowerCase()

    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true, settings: true },
    })
    const meta = {
      orgName: org?.name || 'Organization',
      settings: mergeOrgSettings(org?.settings),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    }

    const rows = await getObjectivesForExport(scope, session.user.id as string, role, orgId)

    if (format === 'xlsx' || format === 'excel') {
      const buffer = buildExcel(rows, meta)
      return new NextResponse(new Uint8Array(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="okr-report.xlsx"',
        },
      })
    }

    const pdfBuffer = buildPdf(rows, meta)
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="okr-report.pdf"',
      },
    })
  } catch (err) {
    console.error('POST /api/export failed', err)
    return createErrorResponse(err)
  }
}
