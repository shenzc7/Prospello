import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { updateInitiativeRequestSchema } from '@/lib/schemas'

type Params = {
  params: {
    id: string
  }
}

export async function PATCH(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = params

    // Check if initiative exists and get objective ownership info through key result
    const initiative = await prisma.initiative.findUnique({
      where: { id },
      select: {
        keyResult: {
          select: {
            objective: {
              select: { ownerId: true },
            },
          },
        },
      },
    })

    if (!initiative) {
      return createErrorResponse(errors.notFound('Resource'))
    }

    // Check permissions - only objective owner can modify initiatives unless manager/admin
    if (initiative.keyResult.objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    const body = await request.json().catch(() => null)
    const validation = updateInitiativeRequestSchema.safeParse(body)

    if (!validation.success) {
      return createErrorResponse(validation.error)
    }

    const updateData = validation.data

    // Update the initiative
    const updatedInitiative = await prisma.initiative.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    return createSuccessResponse({ initiative: updatedInitiative })
  } catch (error) {
    console.error('Error updating initiative:', error)
    return createErrorResponse(error)
  }
}

export async function DELETE(request: Request, { params }: Params) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = params

    // Check if initiative exists and get objective ownership info through key result
    const initiative = await prisma.initiative.findUnique({
      where: { id },
      select: {
        keyResult: {
          select: {
            objective: {
              select: { ownerId: true },
            },
          },
        },
      },
    })

    if (!initiative) {
      return createErrorResponse(errors.notFound('Resource'))
    }

    // Check permissions - only objective owner can delete initiatives unless manager/admin
    if (initiative.keyResult.objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    // Delete the initiative
    await prisma.initiative.delete({
      where: { id },
    })

    return createSuccessResponse({ message: 'Initiative deleted successfully' })
  } catch (error) {
    console.error('Error deleting initiative:', error)
    return createErrorResponse(error)
  }
}
