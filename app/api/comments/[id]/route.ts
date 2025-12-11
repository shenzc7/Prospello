import { getServerSession } from 'next-auth'
import { Role } from '@prisma/client'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { isManagerOrHigher } from '@/lib/rbac'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = await params

    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { userId: true, objective: { select: { ownerId: true } } },
    })

    if (!comment) {
      return createErrorResponse(errors.notFound('Comment'))
    }

    const isOwner = comment.userId === session.user.id
    const canModerate = isManagerOrHigher(session.user.role as Role) || comment.objective?.ownerId === session.user.id

    if (!isOwner && !canModerate) {
      return createErrorResponse(errors.forbidden())
    }

    await prisma.comment.delete({ where: { id } })
    return createSuccessResponse({ ok: true })
  } catch (error) {
    console.error('DELETE /api/comments/[id] failed', error)
    return createErrorResponse(error)
  }
}
