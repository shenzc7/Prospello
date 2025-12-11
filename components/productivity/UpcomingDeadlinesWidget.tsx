'use client'

import { format, addDays, isWithinInterval } from 'date-fns'
import { Calendar, AlertTriangle } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { useObjectives } from '@/hooks/useObjectives'
import { UserRole } from '@/lib/rbac'

interface UpcomingDeadlinesWidgetProps {
  userRole?: UserRole
  userId?: string
}

export function UpcomingDeadlinesWidget({ userRole, userId }: UpcomingDeadlinesWidgetProps = {}) {
  const { data: session } = useSession()
  const user = session?.user
  const currentUserRole = userRole || user?.role as UserRole
  const currentUserId = userId || user?.id

  // Build query params based on user role
  const queryParams = useMemo(() => {
    if (!currentUserId) return {}

    switch (currentUserRole) {
      case 'ADMIN':
        return {}
      case 'MANAGER':
        return {}
      case 'EMPLOYEE':
        return { ownerId: currentUserId }
      default:
        return { ownerId: currentUserId }
    }
  }, [currentUserId, currentUserRole])

  const { data: objectivesData } = useObjectives(queryParams)
  const allObjectives = useMemo(() => objectivesData?.objectives ?? [], [objectivesData?.objectives])

  // Filter objectives based on user role
  const objectives = useMemo(() => {
    if (!currentUserId) return allObjectives

    switch (currentUserRole) {
      case 'ADMIN':
        return allObjectives
      case 'MANAGER':
        return allObjectives.filter(obj =>
          obj.owner.id === currentUserId ||
          obj.team?.name?.includes('Team')
        )
      case 'EMPLOYEE':
        return allObjectives.filter(obj => obj.owner.id === currentUserId)
      default:
        return allObjectives.filter(obj => obj.owner.id === currentUserId)
    }
  }, [allObjectives, currentUserId, currentUserRole])

  const today = new Date()
  const nextWeek = addDays(today, 7)
  const nextTwoWeeks = addDays(today, 14)

  const upcomingDeadlines = objectives
    .filter(obj => {
      const endDate = new Date(obj.endAt)
      return isWithinInterval(endDate, { start: today, end: nextTwoWeeks })
    })
    .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime())
    .slice(0, 5)

  const overdueObjectives = objectives.filter(obj => new Date(obj.endAt) < today)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Upcoming Deadlines
        </CardTitle>
        <CardDescription>
          Objectives due in the next 2 weeks
          {overdueObjectives.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {overdueObjectives.length} overdue
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {upcomingDeadlines.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming deadlines in the next 2 weeks
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingDeadlines.map((objective) => {
              const endDate = new Date(objective.endAt)
              const isOverdue = endDate < today
              const isDueSoon = endDate <= nextWeek
              const daysUntilDue = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

              return (
                <div key={objective.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium text-sm truncate">{objective.title}</h4>
                      <ObjectiveStatusBadge status={objective.status} />
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>Due {format(endDate, 'MMM d')}</span>
                      {isOverdue && (
                        <Badge variant="destructive" className="text-xs">
                          <AlertTriangle className="h-3 w-3 mr-1" />
                          Overdue
                        </Badge>
                      )}
                      {isDueSoon && !isOverdue && (
                        <Badge variant="secondary" className="text-xs">
                          {daysUntilDue === 0 ? 'Today' : `${daysUntilDue} days`}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="text-sm font-medium">{objective.progress}%</div>
                    <Progress value={objective.progress} className="w-16 h-1 mt-1" />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
