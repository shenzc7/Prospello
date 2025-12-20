'use client'

import Link from 'next/link'
import { BellDot, Settings2 } from 'lucide-react'

import { NotificationsFeed } from '@/components/productivity/NotificationsFeed'
import { UpcomingDeadlinesWidget } from '@/components/productivity/UpcomingDeadlinesWidget'
import { AtRiskObjectivesWidget } from '@/components/productivity/AtRiskObjectivesWidget'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'
import type { UserRole } from '@/lib/rbac'

export default function AlertsPage() {
  const { data: session } = useSession()
  const userId = session?.user?.id
  const userRole = session?.user?.role as UserRole

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <BellDot className="h-7 w-7 text-primary" />
            Alerts
          </h1>
          <p className="text-muted-foreground">
            See notifications, at-risk objectives, and upcoming deadlines.
          </p>
        </div>
        <Button asChild variant="outline" className="gap-2">
          <Link href="/settings?tab=notifications">
            <Settings2 className="h-4 w-4" />
            Alert preferences
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <NotificationsFeed userRole={userRole} userId={userId} />
        </div>
        <div className="space-y-4">
          <UpcomingDeadlinesWidget userRole={userRole} userId={userId} />
          <AtRiskObjectivesWidget userRole={userRole} userId={userId} />
        </div>
      </div>
    </div>
  )
}















