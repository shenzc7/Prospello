import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { isManagerOrHigher } from '@/lib/rbac'
import { generateInviteToken, parseRole } from '@/lib/invitations'
import { sendInvitationEmail } from '@/lib/mailer'

const createSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(Role).optional(),
  expiresInDays: z.number().int().min(1).max(90).optional(),
})

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function POST(request: NextRequest) {
  try {
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

    const body = await request.json().catch(() => null)
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { email, role = Role.EMPLOYEE, expiresInDays = 14 } = parsed.data

    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser && existingUser.orgId && existingUser.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('User already belongs to a different organization'))
    }

    const { token, tokenHash } = generateInviteToken()
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000)

    const [invite, org] = await Promise.all([
      prisma.invitation.create({
        data: {
          email,
          role: parseRole(role),
          orgId,
          invitedById: session.user.id as string,
          tokenHash,
          expiresAt,
        },
        select: {
          id: true,
          email: true,
          role: true,
          orgId: true,
          expiresAt: true,
          createdAt: true,
        },
      }),
      prisma.organization.findUnique({
        where: { id: orgId },
        select: { name: true },
      }),
    ])

    const inviteUrl = `${getBaseUrl()}/signup?invite=${token}&email=${encodeURIComponent(email)}`

    // Send invitation email (non-blocking)
    // If SMTP is not configured, this will log in dev and silently skip in prod
    sendInvitationEmail({
      inviteeEmail: email,
      inviterName: session.user.name || session.user.email || 'A team member',
      orgName: org?.name || 'OKRFlow',
      role: role,
      inviteUrl,
      expiresInDays,
    }).catch((err) => {
      console.error('Failed to send invitation email:', err)
    })

    return createSuccessResponse(
      {
        invitation: {
          ...invite,
          token,
          inviteUrl,
        },
      },
      201
    )
  } catch (error) {
    console.error('POST /api/invitations failed', error)
    return createErrorResponse(error)
  }
}
