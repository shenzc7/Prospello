import { prisma } from '@/lib/prisma'

export type NotificationType = 'CHECKIN_DUE' | 'COMMENT' | 'MENTION' | 'SYSTEM'

interface CreateNotificationParams {
  userId: string
  type: NotificationType
  message: string
  metadata?: Record<string, unknown>
}

export async function createNotification({
  userId,
  type,
  message,
  metadata,
}: CreateNotificationParams): Promise<void> {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    })
  } catch (error) {
    console.error('Failed to create notification', error)
    // We don't want to block the main flow if notification fails
  }
}
