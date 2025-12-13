import nodemailer from 'nodemailer'

// =============================================================================
// EMAIL CONFIGURATION
// =============================================================================
// To enable email sending, configure these environment variables in .env:
//
// SMTP_HOST=smtp.gmail.com          # Your SMTP server
// SMTP_PORT=587                      # Usually 587 (TLS) or 465 (SSL)
// SMTP_USER=your-email@gmail.com    # SMTP username
// SMTP_PASS=your-app-password       # SMTP password or app-specific password
// SMTP_FROM=OKRFlow <noreply@yourcompany.com>  # From address
//
// Popular SMTP providers:
// - Gmail: smtp.gmail.com:587 (requires app password)
// - SendGrid: smtp.sendgrid.net:587 (use "apikey" as user)
// - Mailgun: smtp.mailgun.org:587
// - AWS SES: email-smtp.{region}.amazonaws.com:587
// - Resend: smtp.resend.com:465
// =============================================================================

type MailConfig = {
  host: string
  port: number
  user: string
  pass: string
  from: string
}

type EmailOptions = {
  to: string
  subject: string
  text: string
  html?: string
}

type EmailResult = {
  success: boolean
  messageId?: string
  error?: string
  skipped?: boolean
}

/**
 * Check if email is configured
 */
export function isEmailConfigured(): boolean {
  return !!(
    process.env.SMTP_HOST &&
    process.env.SMTP_PORT &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASS &&
    process.env.SMTP_FROM
  )
}

/**
 * Get mail configuration from environment variables
 */
function getMailConfig(): MailConfig | null {
  const host = process.env.SMTP_HOST
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS
  const from = process.env.SMTP_FROM

  if (!host || !port || !user || !pass || !from) {
    return null
  }

  return { host, port, user, pass, from }
}

/**
 * Create nodemailer transporter
 */
function createTransporter(config: MailConfig) {
  return nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.port === 465,
    auth: {
      user: config.user,
      pass: config.pass,
    },
  })
}

/**
 * Send an email
 * 
 * @param to - Recipient email address
 * @param subject - Email subject
 * @param text - Plain text body
 * @param html - Optional HTML body
 * @returns Result object with success status
 * 
 * @example
 * // Basic usage
 * await sendEmail('user@example.com', 'Welcome!', 'Thanks for signing up.')
 * 
 * // With HTML
 * await sendEmail('user@example.com', 'Welcome!', 'Thanks for signing up.', '<h1>Welcome!</h1>')
 */
export async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html?: string
): Promise<EmailResult> {
  const config = getMailConfig()

  if (!config) {
    // Log in development, silent in production
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 Email delivery skipped (SMTP not configured)')
      console.log(`   To: ${to}`)
      console.log(`   Subject: ${subject}`)
      console.log(`   Body preview: ${text.substring(0, 100)}...`)
    }
    return { success: true, skipped: true }
  }

  try {
    const transporter = createTransporter(config)

    const result = await transporter.sendMail({
      from: config.from,
      to,
      subject,
      text,
      ...(html && { html }),
    })

    return { success: true, messageId: result.messageId }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Failed to send email:', errorMessage)
    return { success: false, error: errorMessage }
  }
}

/**
 * Send email with full options object
 */
export async function sendEmailWithOptions(options: EmailOptions): Promise<EmailResult> {
  return sendEmail(options.to, options.subject, options.text, options.html)
}

// =============================================================================
// EMAIL TEMPLATES
// =============================================================================
// Pre-built email templates for common use cases. Easy to customize!
// =============================================================================

export const emailTemplates = {
  /**
   * Invitation email template
   */
  invitation: (params: {
    inviteeEmail: string
    inviterName: string
    orgName: string
    role: string
    inviteUrl: string
    expiresInDays: number
  }) => ({
    to: params.inviteeEmail,
    subject: `You're invited to join ${params.orgName} on OKRFlow`,
    text: `Hi there!

${params.inviterName} has invited you to join ${params.orgName} on OKRFlow as ${params.role.toLowerCase()}.

Click the link below to create your account and get started:
${params.inviteUrl}

This invitation will expire in ${params.expiresInDays} days.

If you didn't expect this invitation, you can safely ignore this email.

Best,
The OKRFlow Team`,
    html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
    <h1 style="color: white; margin: 0; font-size: 24px;">You're Invited! 🎉</h1>
  </div>
  <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 12px 12px; border: 1px solid #e5e7eb; border-top: none;">
    <p style="font-size: 16px; margin-top: 0;">Hi there!</p>
    <p style="font-size: 16px;"><strong>${params.inviterName}</strong> has invited you to join <strong>${params.orgName}</strong> on OKRFlow as <strong>${params.role.toLowerCase()}</strong>.</p>
    <div style="text-align: center; margin: 30px 0;">
      <a href="${params.inviteUrl}" style="background: #10b981; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Accept Invitation</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">This invitation will expire in ${params.expiresInDays} days.</p>
    <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
    <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">If you didn't expect this invitation, you can safely ignore this email.</p>
  </div>
</body>
</html>`,
  }),

  /**
   * Check-in reminder email template
   */
  checkInReminder: (params: {
    userName: string
    userEmail: string
    objectiveTitle: string
    keyResultTitle: string
    dueDate: string
  }) => ({
    to: params.userEmail,
    subject: `Reminder: Update your OKR progress`,
    text: `Hi ${params.userName},

This is a friendly reminder to update your progress on:

Objective: ${params.objectiveTitle}
Key Result: ${params.keyResultTitle}

Please log in to OKRFlow and submit your weekly check-in before ${params.dueDate}.

Best,
The OKRFlow Team`,
  }),

  /**
   * Weekly digest email template
   */
  weeklyDigest: (params: {
    userName: string
    userEmail: string
    summaryText: string
  }) => ({
    to: params.userEmail,
    subject: `Your Weekly OKR Summary`,
    text: `Hi ${params.userName},

Here's your weekly OKR summary:

${params.summaryText}

Log in to OKRFlow to see more details.

Best,
The OKRFlow Team`,
  }),
}

/**
 * Send an invitation email using the template
 */
export async function sendInvitationEmail(params: {
  inviteeEmail: string
  inviterName: string
  orgName: string
  role: string
  inviteUrl: string
  expiresInDays: number
}): Promise<EmailResult> {
  const template = emailTemplates.invitation(params)
  return sendEmailWithOptions(template)
}

/**
 * Send a check-in reminder email using the template
 */
export async function sendCheckInReminderEmail(params: {
  userName: string
  userEmail: string
  objectiveTitle: string
  keyResultTitle: string
  dueDate: string
}): Promise<EmailResult> {
  const template = emailTemplates.checkInReminder(params)
  return sendEmailWithOptions(template)
}

