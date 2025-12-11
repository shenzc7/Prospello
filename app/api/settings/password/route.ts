import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'
import { compare, hash } from 'bcryptjs'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return createErrorResponse(parsed.error)

    const user = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return createErrorResponse(errors.forbidden('Password changes are only available for credential-based accounts.'))
    }

    const valid = await compare(parsed.data.currentPassword, user.passwordHash)
    if (!valid) {
      return createErrorResponse(errors.validation('Current password is incorrect'))
    }

    const newHash = await hash(parsed.data.newPassword, 12)
    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { passwordHash: newHash },
    })

    return createSuccessResponse({ ok: true })
  } catch (error) {
    console.error('PATCH /api/settings/password failed', error)
    return createErrorResponse(error)
  }
}
