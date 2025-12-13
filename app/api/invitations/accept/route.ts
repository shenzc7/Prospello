import { NextRequest } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'

import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { prisma } from '@/lib/prisma'
import { getValidInvitation, parseRole } from '@/lib/invitations'

const acceptSchema = z.object({
  token: z.string().min(10),
  email: z.string().email(),
  name: z.string().min(1),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parsed = acceptSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { token, email, name, password } = parsed.data
    const invitation = await getValidInvitation(token)
    if (!invitation) {
      return createErrorResponse(errors.forbidden('Invalid or expired invitation token'))
    }
    if (invitation.email.toLowerCase() !== email.toLowerCase()) {
      return createErrorResponse(errors.forbidden('Invite email does not match the account email'))
    }

    const existingUser = await prisma.user.findUnique({ where: { email }, select: { id: true, orgId: true } })
    if (existingUser?.orgId && existingUser.orgId !== invitation.orgId) {
      return createErrorResponse(errors.forbidden('User already belongs to another organization'))
    }

    const passwordHash = await hash(password, 12)

    const user = existingUser
      ? await prisma.user.update({
        where: { email },
        data: {
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
      : await prisma.user.create({
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
  } catch (error) {
    console.error('POST /api/invitations/accept failed', error)
    return createErrorResponse(error)
  }
}
