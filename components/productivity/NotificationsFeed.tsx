'use client'

import { Bell, AlertTriangle, CalendarClock, MessageSquare, Check } from 'lucide-react'
import { useSession } from 'next-auth/react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { UserRole } from '@/lib/rbac'
import { useNotifications, type AppNotification } from '@/hooks/useNotifications'

export function NotificationsFeed({ userRole, userId }: { userRole?: UserRole; userId?: string }) {
  const { data: session } = useSession()
  const user = session?.user
  const currentUserRole = userRole || (user?.role as UserRole)
  const currentUserId = userId || user?.id

  const { notifications, unread, isLoading, markAllRead } = useNotifications()

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
                  {item.metadata ? <p className="text-xs text-muted-foreground truncate">{item.metadata}</p> : null}
                </div>
                {!item.read && <Badge variant="secondary" className="text-[11px]">New</Badge>}
              </div>
            ))}
          </div>
        )}
        <p className="mt-4 text-[11px] text-muted-foreground">
          Role: {currentUserRole || 'unknown'} • User: {currentUserId || 'anonymous'}
        </p>
      </CardContent>
    </Card>
  )
}
