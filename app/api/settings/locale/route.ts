import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { defaultOrgLocaleSettings, mergeOrgSettings } from '@/lib/orgSettings'

const schema = z.object({
  fiscalYearStartMonth: z.number().int().min(1).max(12),
  weekStart: z.enum(['monday', 'sunday']),
  scoringScale: z.enum(['percent', 'fraction']),
  numberLocale: z.string().min(2).max(12),
  dateFormat: z.string().min(4).max(20),
  highContrastStatus: z.boolean().optional(),
  hierarchyLabels: z.object({
    company: z.string().min(1).max(40),
    department: z.string().min(1).max(40),
    team: z.string().min(1).max(40),
    individual: z.string().min(1).max(40),
  }),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return createErrorResponse(errors.unauthorized())
  const orgId = session.user.orgId as string | undefined
  if (!orgId) return createErrorResponse(errors.forbidden('Organization not set for user'))

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { settings: true },
  })

  const settings = mergeOrgSettings(org?.settings)
  return createSuccessResponse({ settings })
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return createErrorResponse(errors.unauthorized())
  const orgId = session.user.orgId as string | undefined
  if (!orgId) return createErrorResponse(errors.forbidden('Organization not set for user'))
  if (session.user.role !== 'ADMIN') {
    return createErrorResponse(errors.forbidden('Admin role required to update organization settings.'))
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) return createErrorResponse(parsed.error)

  const merged = { ...defaultOrgLocaleSettings, ...parsed.data }

  await prisma.organization.update({
    where: { id: orgId },
    data: { settings: merged },
  })

  return createSuccessResponse({ settings: merged })
}





