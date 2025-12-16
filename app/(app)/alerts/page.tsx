'use client'

import Link from 'next/link'
import { BellDot, Settings2 } from 'lucide-react'

import { NotificationsFeed } from '@/components/productivity/NotificationsFeed'
import { UpcomingDeadlinesWidget } from '@/components/productivity/UpcomingDeadlinesWidget'
import { AtRiskObjectivesWidget } from '@/components/productivity/AtRiskObjectivesWidget'
import { Button } from '@/components/ui/button'
import { useDemo } from '@/components/demo/DemoContext'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import type { UserRole } from '@/lib/rbac'

export default function AlertsPage() {
  const { isEnabled: demoEnabled, role: demoRole } = useDemo()
  const { data: session } = useSession()

  const personaUserId = useMemo(() => {
    if (!demoEnabled) return session?.user?.id
    if (demoRole === 'EMPLOYEE') return 'user-employee'
    if (demoRole === 'MANAGER') return 'user-manager'
    return 'user-admin'
  }, [demoEnabled, demoRole, session?.user?.id])

  const demoUserRole: UserRole | undefined = demoEnabled ? (demoRole as UserRole) : undefined

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
          {demoEnabled && (
            <p className="text-xs text-primary">
              Demo mode: showing alerts for {demoRole.toLowerCase()} persona.
            </p>
          )}
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
          <NotificationsFeed userRole={demoUserRole} userId={personaUserId} />
        </div>
        <div className="space-y-4">
          <UpcomingDeadlinesWidget userRole={demoUserRole} userId={personaUserId} />
          <AtRiskObjectivesWidget userRole={demoUserRole} userId={personaUserId} />
        </div>
      </div>
    </div>
  )
}











