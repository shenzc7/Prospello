import { NextRequest } from 'next/server'
import { hash } from 'bcryptjs'
import { z } from 'zod'
import { Role } from '@prisma/client'

import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rateLimit'

const registerSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1, 'Name is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  orgName: z.string().min(2).optional(),
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

    const { email, name, password, orgName } = parsed.data

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return createErrorResponse(errors.validation('An account with this email already exists'))
    }

    let orgId: string | undefined
    if (orgName) {
      const org = await prisma.organization.findFirst({ where: { name: orgName } }) ??
        await prisma.organization.create({ data: { name: orgName } })
      orgId = org.id
    }

    const passwordHash = await hash(password, 12)

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        role: Role.EMPLOYEE,
        orgId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        orgId: true,
      },
    })

    return createSuccessResponse({ user }, 201)
  } catch (error) {
    console.error('Error registering user', error)
    return createErrorResponse(error)
  }
}
