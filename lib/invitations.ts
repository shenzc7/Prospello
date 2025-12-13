import { randomBytes, createHash } from 'crypto'
import { prisma } from '@/lib/prisma'
import { Role } from '@prisma/client'

export function generateInviteToken() {
  const token = randomBytes(32).toString('hex')
  const tokenHash = hashToken(token)
  return { token, tokenHash }
}

export function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex')
}

export async function getValidInvitation(token: string) {
  const tokenHash = hashToken(token)
  const invitation = await prisma.invitation.findUnique({
    where: { tokenHash },
    select: {
      id: true,
      orgId: true,
      email: true,
      role: true,
      expiresAt: true,
      acceptedAt: true,
    },
  })

  if (!invitation) return null
  if (invitation.acceptedAt) return null
  if (invitation.expiresAt && invitation.expiresAt < new Date()) return null

  return invitation
}

export function parseRole(input?: string | Role | null): Role {
  if (!input) return Role.EMPLOYEE
  const upper = typeof input === 'string' ? input.toUpperCase() : input.toString().toUpperCase()
  if (upper === 'ADMIN') return Role.ADMIN
  if (upper === 'MANAGER') return Role.MANAGER
  return Role.EMPLOYEE
}
