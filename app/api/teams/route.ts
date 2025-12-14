import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { Role } from '@prisma/client'

const createTeamSchema = z.object({
  name: z.string().min(2),
  memberIds: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    if (!isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || undefined

    const teams = await prisma.team.findMany({
      where: search
        ? {
          orgId,
          name: { contains: search, mode: 'insensitive' },
        }
        : { orgId },
      orderBy: { name: 'asc' },
      include: {
        members: {
          include: {
            user: { select: { id: true, name: true, email: true, role: true } },
          },
        },
      },
    })

    return createSuccessResponse({
      teams: teams.map((team) => ({
        id: team.id,
        name: team.name,
        members: team.members.map((member) => member.user),
      })),
    })
  } catch (error) {
    return createErrorResponse(error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    if (!isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const parsed = createTeamSchema.safeParse(body)
    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    // Validate member IDs belong to the same organization
    if (parsed.data.memberIds?.length) {
      const memberOrgs = await prisma.user.findMany({
        where: { id: { in: parsed.data.memberIds } },
        select: { id: true, orgId: true },
      })
      const invalidMember = memberOrgs.find((m) => m.orgId !== orgId)
      if (invalidMember) {
        return createErrorResponse(errors.forbidden('Members must belong to your organization'))
      }
    }

    const team = await prisma.team.create({
      data: {
        name: parsed.data.name,
        orgId,
        members: parsed.data.memberIds?.length
          ? {
            createMany: {
              data: parsed.data.memberIds.map((userId) => ({ userId })),
              skipDuplicates: true,
            },
          }
          : undefined,
      },
      include: {
        members: {
          include: { user: { select: { id: true, email: true, name: true, role: true } } },
        },
      },
    })

    return createSuccessResponse({
      team: {
        id: team.id,
        name: team.name,
        members: team.members.map((member) => member.user),
      },
    }, 201)
  } catch (error) {
    console.error('POST /api/teams failed', error)
    return createErrorResponse(error)
  }
}






