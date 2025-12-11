import { prisma } from '@/lib/prisma'

export type NotificationType = 'CHECKIN_DUE' | 'COMMENT' | 'MENTION' | 'SYSTEM' | 'REMINDER'

export const DEFAULT_NOTIFICATION_SETTINGS = {
  emailCheckInReminders: true,
  emailWeeklyDigest: true,
  emailObjectiveUpdates: false,
  pushCheckInReminders: true,
  pushObjectiveComments: true,
  pushDeadlineAlerts: true,
  smsCheckInReminders: false,
  whatsappCheckInReminders: false,
  quietHoursEnabled: false,
  quietHoursStart: '21:00',
  quietHoursEnd: '08:00',
}

export type NotificationSettings = typeof DEFAULT_NOTIFICATION_SETTINGS

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

async function postWebhook(url: string, text: string) {
  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    })
  } catch (error) {
    console.error('Failed to send webhook notification', error)
  }
}

export async function broadcastReminder(message: string) {
  if (process.env.SLACK_WEBHOOK_URL) {
    await postWebhook(process.env.SLACK_WEBHOOK_URL, message)
  }
  if (process.env.TEAMS_WEBHOOK_URL) {
    await postWebhook(process.env.TEAMS_WEBHOOK_URL, message)
  }
}
