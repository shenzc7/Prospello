import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { Role } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    if (!isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined

    const teams = await prisma.team.findMany({
      where: search
        ? {
          name: { contains: search, mode: 'insensitive' },
        }
        : {},
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
      },
    })

    return createSuccessResponse({ teams })
  } catch (error) {
    return createErrorResponse(error)
  }
}
