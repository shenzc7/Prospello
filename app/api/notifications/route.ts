import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { Prisma } from '@prisma/client'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Schema for marking notifications as read
const markReadSchema = z.object({
  ids: z.array(z.string()).optional(),
  all: z.boolean().optional(),
})

const isSchemaMismatch = (error: unknown) =>
  error instanceof Prisma.PrismaClientKnownRequestError &&
  (error.code === 'P2021' || error.code === 'P2022')

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const notifications = await prisma.notification.findMany({
      where: {
        userId: session.user.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // slightly larger window for dashboard feed
    })

    const unreadCount = notifications.filter((n) => !n.read).length

    return NextResponse.json({ notifications, unread: unreadCount })
  } catch (error) {
    if (isSchemaMismatch(error)) {
      console.warn(
        'Notifications schema mismatch detected (missing table/column). Returning empty list until migration runs.',
        error
      )
      return NextResponse.json({ notifications: [], unread: 0 })
    }

    console.error('Error fetching notifications:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return new NextResponse('Unauthorized', { status: 401 })
  }

  try {
    const body = await req.json()
    const { ids, all } = markReadSchema.parse(body)

    if (all) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          read: false,
        },
        data: {
          read: true,
        },
      })
    } else if (ids && ids.length > 0) {
      await prisma.notification.updateMany({
        where: {
          userId: session.user.id,
          id: { in: ids },
          read: false,
        },
        data: {
          read: true,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse('Invalid request data', { status: 400 })
    }

    if (isSchemaMismatch(error)) {
      console.warn(
        'Notifications schema mismatch detected (missing table/column). Mark-as-read skipped until migration runs.',
        error
      )
      return new NextResponse(
        'Notifications storage not migrated yet. Please run prisma migrate to add the read column.',
        { status: 503 }
      )
    }

    console.error('Error updating notifications:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}
