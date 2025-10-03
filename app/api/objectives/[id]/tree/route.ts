import { NextResponse } from 'next/server'
import { createSuccessResponse, createErrorResponse, errors } from '@/lib/apiError'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isManagerOrHigher } from '@/lib/rbac'
import { calculateKRProgress, calculateObjectiveProgress } from '@/lib/utils'

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return createErrorResponse(errors.unauthorized())
    }

    const { id } = await params

    // First check if the objective exists and user has access
    const objective = await prisma.objective.findUnique({
      where: { id },
      select: { ownerId: true },
    })

    if (!objective) {
      return createErrorResponse(errors.notFound('Resource'))
    }

    // Check permissions - users can only view tree for their own objectives unless they're managers/admins
    if (objective.ownerId !== session.user.id && !isManagerOrHigher(session.user.role as any)) {
      return createErrorResponse(errors.forbidden())
    }

    // Get parent objective with full details
    const parent = await prisma.objective.findFirst({
      where: {
        children: {
          some: { id },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        keyResults: {
          select: {
            id: true,
            title: true,
            weight: true,
            target: true,
            current: true,
            unit: true,
          },
        },
      },
    })

    // Get children objectives with full details
    const children = await prisma.objective.findMany({
      where: {
        parentId: id,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
        keyResults: {
          select: {
            id: true,
            title: true,
            weight: true,
            target: true,
            current: true,
            unit: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    // Calculate progress for parent
    let parentWithProgress = null
    if (parent) {
      const parentKeyResultsWithProgress = parent.keyResults.map((kr) => ({
        ...kr,
        progress: calculateKRProgress(kr.current, kr.target),
      }))
      parentWithProgress = {
        ...parent,
        progress: calculateObjectiveProgress(parentKeyResultsWithProgress),
        keyResults: parentKeyResultsWithProgress,
      }
    }

    // Calculate progress for children
    const childrenWithProgress = children.map((child) => {
      const childKeyResultsWithProgress = child.keyResults.map((kr) => ({
        ...kr,
        progress: calculateKRProgress(kr.current, kr.target),
      }))
      return {
        ...child,
        progress: calculateObjectiveProgress(childKeyResultsWithProgress),
        keyResults: childKeyResultsWithProgress,
      }
    })

    return createSuccessResponse({
      tree: {
        parent: parentWithProgress,
        children: childrenWithProgress,
      },
    })
  } catch (error) {
    console.error('Error fetching objective tree:', error)
    return createErrorResponse(error)
  }
}
