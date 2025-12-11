import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const body = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) return createErrorResponse(parsed.error)

    const user = await prisma.user.update({
      where: { id: session.user.id as string },
      data: { name: parsed.data.name },
      select: { id: true, name: true, email: true, role: true },
    })

    return createSuccessResponse({ user })
  } catch (error) {
    console.error('PATCH /api/settings/profile failed', error)
    return createErrorResponse(error)
  }
}
