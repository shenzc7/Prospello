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















