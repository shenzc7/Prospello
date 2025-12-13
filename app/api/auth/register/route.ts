import { NextRequest } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { Role } from '@prisma/client'

import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'
import { generateUniqueOrgSlug } from '@/lib/org'
import { getValidInvitation, parseRole } from '@/lib/invitations'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(2, 'Organization name is required').optional(),
  inviteToken: z.string().min(10).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const clientId = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
    const rate = checkRateLimit(`register:${clientId}`, 10, 60_000)
    if (!rate.allowed) {
      return createErrorResponse(errors.rateLimit())
    }

    const body = await request.json().catch(() => null)
    const parsed = registerSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { email, name, password, orgName, inviteToken } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return createErrorResponse(errors.validation('An account with this email already exists'))
    }

    const passwordHash = await hash(password, 12)

    // Invitation acceptance flow
    if (inviteToken) {
      const invitation = await getValidInvitation(inviteToken)
      if (!invitation) {
        return createErrorResponse(errors.forbidden('Invalid or expired invitation token'))
      }
      if (invitation.email.toLowerCase() !== email.toLowerCase()) {
        return createErrorResponse(errors.forbidden('Invite email does not match the account email'))
      }

      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: parseRole(invitation.role),
          orgId: invitation.orgId,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          orgId: true,
        },
      })

      await prisma.invitation.update({
        where: { id: invitation.id },
        data: { acceptedAt: new Date() },
      })

      return createSuccessResponse({ user, organizationId: invitation.orgId }, 201)
    }

    // Default new org path
    if (!orgName) {
      return createErrorResponse(errors.validation('Organization name is required when no invitation is provided'))
    }

    const result = await prisma.$transaction(async (tx) => {
      const slug = await generateUniqueOrgSlug(orgName)
      const org = await tx.organization.create({
        data: { name: orgName, slug },
        select: { id: true, name: true, slug: true },
      })

      const user = await tx.user.create({
        data: {
          email,
          name,
          passwordHash,
          role: Role.ADMIN,
          orgId: org.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          orgId: true,
        },
      })

      return { user, org }
    })

    return createSuccessResponse({ user: result.user, organization: result.org }, 201)
  } catch (error) {
    console.error('Error registering user', error)
    return createErrorResponse(error)
  }
}
