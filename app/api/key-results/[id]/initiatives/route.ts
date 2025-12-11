import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { createInitiativeRequestSchema } from '@/lib/schemas'
import { Role } from '@prisma/client'

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }
    const orgId = session.user.orgId
    if (!orgId) {
      return createErrorResponse(errors.forbidden('Organization not set for user'))
    }

    const { id: keyResultId } = await params

    // Check if key result exists and user has access through objective ownership
    const keyResult = await prisma.keyResult.findUnique({
      where: { id: keyResultId },
      select: {
        objective: {
          select: { ownerId: true, owner: { select: { orgId: true } } },
        },
      },
    })

    if (!keyResult) {
      return createErrorResponse(errors.notFound('Resource'))
    }

    // Check permissions - only objective owner can create initiatives unless manager/admin
    if (keyResult.objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as Role)) {
      return createErrorResponse(errors.forbidden())
    }
    if (keyResult.objective.owner?.orgId !== orgId) {
      return createErrorResponse(errors.forbidden('Key result is in a different organization'))
    }

    const body = await request.json().catch(() => null)
    const validation = createInitiativeRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const { title, status } = validation.data

    // Create the initiative
    const initiative = await prisma.initiative.create({
      data: {
        keyResultId,
        title,
        status,
      },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse({ initiative }, 201)
  } catch (error) {
    console.error('Error creating initiative:', error)
    return createErrorResponse(error)
  }
}
