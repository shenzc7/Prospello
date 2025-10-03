import { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isAdmin } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { listUsersQuerySchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    // Check admin role
    if (!isAdmin(session.user.role as any)) {
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
