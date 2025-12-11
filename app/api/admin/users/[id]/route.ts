export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/rbac'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { logger } from '@/lib/logger'

const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  teamIds: z.array(z.string()).optional(),
}).refine((data) => data.role || data.teamIds, { message: 'Provide a role or teamIds to update' })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const body = await request.json().catch(() => null)
    const parsed = updateUserSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { id } = await params
    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { orgId: true },
    })
    if (!targetUser) {
      return createErrorResponse(errors.notFound('User'))
    }
    if (targetUser.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('User belongs to a different organization'))
    }
    const updates: { role?: Role } = {}
    if (parsed.data.role) {
      updates.role = parsed.data.role
    }

    if (Object.keys(updates).length) {
      await prisma.user.update({
        where: { id },
        data: updates,
      })
    }

    if (parsed.data.teamIds) {
      const teams = await prisma.team.findMany({
        where: { id: { in: parsed.data.teamIds } },
        select: { id: true, orgId: true },
      })
      const invalidTeam = teams.find((team) => team.orgId !== orgId)
      if (invalidTeam) {
        return createErrorResponse(errors.forbidden('Teams must belong to your organization'))
      }
      await prisma.teamMember.deleteMany({
        where: {
          userId: id,
          NOT: { teamId: { in: parsed.data.teamIds } },
        },
      })
      await prisma.teamMember.createMany({
        data: parsed.data.teamIds.map((teamId) => ({ teamId, userId: id })),
        skipDuplicates: true,
      })
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
        teamMemberships: { include: { team: { select: { id: true, name: true } } } },
      },
    })

    if (!updatedUser) {
      return createErrorResponse(errors.notFound('User'))
    }

    const { teamMemberships, ...rest } = updatedUser

    logger.info('Admin updated user', {
      adminId: session.user.id,
      userId: id,
      updates: parsed.data,
    })

    return createSuccessResponse({
      user: { ...rest, teams: teamMemberships?.map((tm) => tm.team) ?? [] },
    })
  } catch (error) {
    console.error('Error updating user role:', error)
    return createErrorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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

    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return createErrorResponse(errors.badRequest('Cannot delete your own account'))
    }

    const targetUser = await prisma.user.findUnique({
      where: { id },
      select: { orgId: true },
    })
    if (!targetUser) {
      return createErrorResponse(errors.notFound('User'))
    }
    if (targetUser.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('User belongs to a different organization'))
    }

    await prisma.user.delete({
      where: { id },
    })

    logger.info('Admin deleted user', {
      adminId: session.user.id,
      userId: id,
    })

    return createSuccessResponse({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return createErrorResponse(error)
  }
}
