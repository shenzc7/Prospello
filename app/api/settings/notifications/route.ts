import { NextRequest } from 'next/server'
import { getServerSession } from 'next-auth'
import { z } from 'zod'

import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createErrorResponse, createSuccessResponse, errors } from '@/lib/apiError'
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notifications'

const settingsSchema = z.object({
  emailCheckInReminders: z.boolean().optional(),
  emailWeeklyDigest: z.boolean().optional(),
  emailObjectiveUpdates: z.boolean().optional(),
  pushCheckInReminders: z.boolean().optional(),
  pushObjectiveComments: z.boolean().optional(),
  pushDeadlineAlerts: z.boolean().optional(),
  smsCheckInReminders: z.boolean().optional(),
  whatsappCheckInReminders: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: z.string().optional(),
  quietHoursEnd: z.string().optional(),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return createErrorResponse(errors.unauthorized())

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
    select: { notificationSettings: true },
  })

  const settings = {
    ...DEFAULT_NOTIFICATION_SETTINGS,
    ...(user?.notificationSettings as Record<string, boolean> | null ?? {}),
  }

  return createSuccessResponse({ settings })
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) return createErrorResponse(errors.unauthorized())

    const body = await request.json().catch(() => null)
    const parsed = settingsSchema.safeParse(body)
    if (!parsed.success) return createErrorResponse(parsed.error)

    const existing = await prisma.user.findUnique({
      where: { id: session.user.id as string },
      select: { notificationSettings: true },
    })

    const merged = {
      ...DEFAULT_NOTIFICATION_SETTINGS,
      ...(existing?.notificationSettings as Record<string, boolean> | null ?? {}),
      ...parsed.data,
    }

    await prisma.user.update({
      where: { id: session.user.id as string },
      data: { notificationSettings: merged },
    })

    return createSuccessResponse({ settings: merged })
  } catch (error) {
    console.error('PATCH /api/settings/notifications failed', error)
    return createErrorResponse(error)
  }
}
