import { NextRequest } from 'next/server'
export const dynamic = 'force-dynamic'
import { getServerSession } from 'next-auth'
import { authOptions, ensureOrgAndRole } from '@/lib/auth'
import { isAdmin } from '@/lib/rbac'
import { prisma } from '@/lib/prisma'
import { listUsersQuerySchema } from '@/lib/schemas'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { logger } from '@/lib/logger'
import { Role } from '@prisma/client'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
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
        orgId,
        OR: [
          { email: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ],
      }
      : { orgId }

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
          teamMemberships: {
            include: { team: { select: { id: true, name: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
      }),
      prisma.user.count({ where }),
    ])

    return createSuccessResponse({
      users: users.map(({ teamMemberships, ...rest }) => ({
        ...rest,
        teams: teamMemberships?.map((tm) => tm.team) ?? [],
      })),
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
import { sendEmail } from '@/lib/mailer'

const createUserSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).optional(),
  role: z.nativeEnum(Role).default('EMPLOYEE'),
  password: z.string().min(8).optional(), // Optional: will generate temp password if not provided
  teamIds: z.array(z.string()).optional(),
  sendWelcomeEmail: z.boolean().optional().default(true), // Send welcome email with credentials
})

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
  )
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const ensuredOrgId = await ensureOrgAndRole(session.user.id, session.user.email ?? '', session.user.name ?? undefined)
    const orgId = ensuredOrgId ?? session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    if (!isAdmin(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const parsed = createUserSchema.safeParse(body)

    if (!parsed.success) {
      return createErrorResponse(parsed.error)
    }

    const { email, name, role, password, teamIds, sendWelcomeEmail } = parsed.data

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return createErrorResponse(errors.validation('User with this email already exists'))
    }

    // Validate team IDs belong to org
    if (teamIds?.length) {
      const teams = await prisma.team.findMany({
        where: { id: { in: teamIds } },
        select: { id: true, orgId: true },
      })
      const invalidTeam = teams.find((team) => team.orgId !== orgId)
      if (invalidTeam) {
        return createErrorResponse(errors.forbidden('Teams must belong to your organization'))
      }
    }

    // Generate password (use provided or generate secure temp password)
    const isAutoGenerated = !password
    const tempPassword = password || generateSecurePassword()
    const passwordHash = await hash(tempPassword, 12)

    // Get org info for email
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
      select: { id: true, name: true },
    })
    if (!org) {
      return createErrorResponse(errors.notFound('Organization not found'))
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        name: name || null,
        role,
        passwordHash,
        orgId: org.id,
        teamMemberships: teamIds?.length
          ? {
            createMany: {
              data: teamIds.map((teamId) => ({ teamId })),
              skipDuplicates: true,
            },
          }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        teamMemberships: { include: { team: { select: { id: true, name: true } } } },
      },
    })

    const { teamMemberships, ...restUser } = newUser

    // Send welcome email with credentials (non-blocking)
    if (sendWelcomeEmail && isAutoGenerated) {
      const loginUrl = `${getBaseUrl()}/login`
      const orgName = org.name || 'OKRFlow'
      const adminName = session.user.name || session.user.email || 'An administrator'

      sendEmail(
        email,
        `Welcome to ${orgName} on OKRFlow`,
        `Hi${name ? ` ${name}` : ''}!

${adminName} has created an account for you on ${orgName}'s OKRFlow workspace.

Here are your login credentials:

Email: ${email}
Temporary Password: ${tempPassword}

Please log in and change your password:
${loginUrl}

If you have any questions, contact your administrator.

Best,
The OKRFlow Team`
      ).catch((err) => {
        console.error('Failed to send welcome email:', err)
      })
    }

    logger.info('Admin created user', {
      adminId: session.user.id,
      userId: restUser.id,
      orgId,
      role,
    })

    return createSuccessResponse({
      user: {
        ...restUser,
        teams: teamMemberships?.map((tm) => tm.team) ?? [],
      },
      // Return temp password so admin can share it manually if email fails
      tempPassword: isAutoGenerated ? tempPassword : undefined,
      emailSent: sendWelcomeEmail && isAutoGenerated,
    }, 201)
  } catch (error) {
    console.error('Error creating user:', error)
    return createErrorResponse(error)
  }
}

/**
 * Generate a secure, readable temporary password
 * Format: 3 words + 2 digits (e.g., "apple-river-cloud-42")
 */
function generateSecurePassword(): string {
  const words = [
    'apple', 'river', 'cloud', 'tiger', 'ocean', 'maple', 'storm', 'eagle',
    'coral', 'frost', 'blaze', 'cedar', 'delta', 'ember', 'grove', 'haven',
    'ivory', 'jewel', 'karma', 'lunar', 'metro', 'noble', 'oasis', 'pearl',
    'quest', 'ridge', 'solar', 'terra', 'ultra', 'vivid', 'waves', 'xenon',
  ]
  const pick = () => words[Math.floor(Math.random() * words.length)]
  const digits = Math.floor(Math.random() * 90 + 10) // 10-99
  return `${pick()}-${pick()}-${pick()}-${digits}`
}
