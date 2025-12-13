'use client'

import { Bell, AlertTriangle, CalendarClock, MessageSquare, Check } from 'lucide-react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { useNotifications, type AppNotification } from '@/hooks/useNotifications'

type NotificationMetadata = {
  objectiveId?: string
  keyResultId?: string
  checkInId?: string
}

function parseMetadata(metadata: string | null): NotificationMetadata | null {
  if (!metadata) return null
  try {
    const parsed = JSON.parse(metadata) as unknown
    if (!parsed || typeof parsed !== 'object') return null
    return parsed as NotificationMetadata
  } catch {
    return null
  }
}

function resolveNotificationLink(metadata: NotificationMetadata | null): { href: string; label: string } | null {
  if (metadata?.objectiveId) {
    return { href: `/okrs/${metadata.objectiveId}`, label: 'Open' }
  }
  if (metadata?.keyResultId) {
    return { href: `/initiatives?keyResultId=${encodeURIComponent(metadata.keyResultId)}`, label: 'Open' }
  }
  return null
}

export function NotificationsFeed({ userId }: { userRole?: unknown; userId?: string }) {
  const { notifications, unread, isLoading, markAllRead } = useNotifications(userId)

  const iconFor = (type: AppNotification['type']) => {
    if (type === 'CHECKIN_DUE' || type === 'REMINDER') return <CalendarClock className="h-4 w-4 text-amber-600" />
    if (type === 'ALERT' || type === 'AT_RISK') return <AlertTriangle className="h-4 w-4 text-red-600" />
    return <MessageSquare className="h-4 w-4 text-blue-600" />
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between gap-3">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notifications & Reminders
          </CardTitle>
          <CardDescription>Deadlines, at-risk objectives, and comments</CardDescription>
        </div>
        {unread > 0 && (
          <Button size="sm" variant="outline" onClick={() => markAllRead()}>
            <Check className="h-4 w-4 mr-1" /> Mark all read ({unread})
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading reminders…</div>
        ) : notifications.length === 0 ? (
          <div className="text-sm text-muted-foreground">No alerts right now.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((item) => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border p-3 bg-muted/20">
                <div className="mt-0.5">{iconFor(item.type as AppNotification['type'])}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{item.message}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    {(() => {
                      const meta = parseMetadata(item.metadata)
                      const link = resolveNotificationLink(meta)
                      if (!link) return null
                      return (
                        <Link href={link.href} className="font-medium text-primary hover:underline">
                          {link.label}
                        </Link>
                      )
                    })()}
                    <span aria-label={new Date(item.createdAt).toLocaleString()}>
                      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                    </span>
                  </div>
                </div>
                {!item.read && <Badge variant="secondary" className="text-[11px]">New</Badge>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
