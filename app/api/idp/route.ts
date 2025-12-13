import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { isAdmin } from '@/lib/rbac'

const providerSchema = z.object({
  provider: z.enum(['google', 'slack', 'azure-ad', 'oidc']),
  clientId: z.string().min(1),
  clientSecret: z.string().min(1),
  issuer: z.string().url().optional(),
  tenantId: z.string().optional(),
})

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }
    if (!isAdmin(session.user.role)) {
      return createErrorResponse(errors.forbidden())
    }

    const providers = await prisma.identityProviderConfig.findMany({
      where: { orgId },
      select: {
        id: true,
        provider: true,
        clientId: true,
        issuer: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse({ providers })
  } catch (error) {
    console.error('GET /api/idp failed', error)
    return createErrorResponse(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }
    if (!isAdmin(session.user.role)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await req.json().catch(() => null)
    const parsed = providerSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { provider, clientId, clientSecret, issuer, tenantId } = parsed.data

    const record = await prisma.identityProviderConfig.upsert({
      where: { orgId_provider: { orgId, provider } },
      create: { orgId, provider, clientId, clientSecret, issuer, tenantId },
      update: { clientId, clientSecret, issuer, tenantId },
      select: {
        id: true,
        provider: true,
        clientId: true,
        issuer: true,
        tenantId: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse({ provider: record }, 201)
  } catch (error) {
    console.error('POST /api/idp failed', error)
    return createErrorResponse(error)
  }
}
