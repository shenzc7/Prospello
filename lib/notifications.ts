import { prisma } from '@/lib/prisma'
import { sendEmail } from '@/lib/mailer'
import { DEFAULT_NOTIFICATION_SETTINGS, type NotificationSettings } from '@/lib/notificationSettings'

export type NotificationType = 'CHECKIN_DUE' | 'COMMENT' | 'MENTION' | 'SYSTEM' | 'REMINDER'

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
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, name: true, notificationSettings: true },
    })

    const settings = resolveSettings(user?.notificationSettings)
    const quiet = isWithinQuietHours(settings)

    await prisma.notification.create({
      data: {
        userId,
        type,
        message,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
      },
    })

    // Respect user preferences and quiet hours for delivery
    if (!quiet) {
      const subject = notificationSubject(type)
      if (shouldSendEmail(type, settings) && user?.email) {
        await sendEmail(user.email, subject, message)
      }
      if (shouldSendPush(type, settings)) {
        await deliverWebhook(message)
      }
    }
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

function shouldSendEmail(type: NotificationType, settings: NotificationSettings) {
  if (type === 'CHECKIN_DUE' || type === 'REMINDER') return settings.emailCheckInReminders
  if (type === 'COMMENT' || type === 'MENTION') return settings.emailObjectiveUpdates
  return settings.emailWeeklyDigest
}

function shouldSendPush(type: NotificationType, settings: NotificationSettings) {
  if (type === 'CHECKIN_DUE' || type === 'REMINDER') return settings.pushCheckInReminders
  if (type === 'COMMENT' || type === 'MENTION') return settings.pushObjectiveComments
  return settings.pushDeadlineAlerts
}

function parseTime(time: string) {
  const [h, m] = time.split(':').map((part) => Number(part))
  return { hours: h || 0, minutes: m || 0 }
}

function isWithinQuietHours(settings: NotificationSettings, now = new Date()): boolean {
  if (!settings.quietHoursEnabled) return false
  const { hours: startH, minutes: startM } = parseTime(settings.quietHoursStart)
  const { hours: endH, minutes: endM } = parseTime(settings.quietHoursEnd)

  const start = new Date(now)
  start.setHours(startH, startM, 0, 0)
  const end = new Date(now)
  end.setHours(endH, endM, 0, 0)

  if (start <= end) {
    return now >= start && now <= end
  }
  // Overnight window (e.g., 21:00 - 08:00)
  return now >= start || now <= end
}

function resolveSettings(stored?: unknown): NotificationSettings {
  return {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(stored && typeof stored === 'object' ? stored : {}),
  }
}

function notificationSubject(type: NotificationType) {
  if (type === 'CHECKIN_DUE' || type === 'REMINDER') return 'OKR Check-in Reminder'
  if (type === 'COMMENT') return 'New OKR Comment'
  if (type === 'MENTION') return 'You were mentioned on an OKR'
  return 'OKR Update'
}

async function deliverWebhook(message: string) {
  if (process.env.SLACK_WEBHOOK_URL) {
    await postWebhook(process.env.SLACK_WEBHOOK_URL, message)
  }
  if (process.env.TEAMS_WEBHOOK_URL) {
    await postWebhook(process.env.TEAMS_WEBHOOK_URL, message)
  }
}
