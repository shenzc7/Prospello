import { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { listUsersQuerySchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    // Check admin role
    if (!isAdmin(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const validation = listUsersQuerySchema.safeParse({
      search: searchParams.get('search') || undefined,
      limit: searchParams.get('limit') ?? undefined,
      offset: searchParams.get('offset') ?? undefined,
    })

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const { search, limit, offset } = validation.data

    // Build where clause for search
    const where = search
      ? {
        OR: [
          { email: { contains: search, mode: 'insensitive' } },
          { name: { contains: search, mode: 'insensitive' } },
        ],
      }
      : {}

    // Fetch users with pagination
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return createSuccessResponse({
      users,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching users:', error)
    return createErrorResponse(error)
  }
}

import { hash } from 'bcryptjs'
import { z } from 'zod'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).default('EMPLOYEE'),
  password: z.string().min(8).optional(), // Optional: will generate temp password if not provided
})

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    if (!isAdmin(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { email, name, role, password } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return createErrorResponse(errors.badRequest('User with this email already exists'))
    }

    // Generate password hash (use provided or generate temp)
    const tempPassword = password || Math.random().toString(36).slice(-12)
    const passwordHash = await hash(tempPassword, 12)

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    })

    return createSuccessResponse({
      user: newUser,
      tempPassword: password ? undefined : tempPassword // Only return if auto-generated
    }, 201)
  } catch (error) {
    console.error('Error creating user:', error)
    return createErrorResponse(error)
  }
}
