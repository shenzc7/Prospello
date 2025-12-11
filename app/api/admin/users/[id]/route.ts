export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/rbac'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'

const updateUserSchema = z.object({
  role: z.nativeEnum(Role)
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
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

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: parsed.data.role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse({ user: updatedUser })
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

    if (!isAdmin(session.user.role)) {
      return createErrorResponse(errors.forbidden())
    }

    const { id } = await params

    // Prevent self-deletion
    if (id === session.user.id) {
      return createErrorResponse(errors.badRequest('Cannot delete your own account'))
    }

    await prisma.user.delete({
      where: { id },
    })

    return createSuccessResponse({ message: 'User deleted successfully' })
  } catch (error) {
    console.error('Error deleting user:', error)
    return createErrorResponse(error)
  }
}
