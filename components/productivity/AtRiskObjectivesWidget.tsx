'use client'

import { AlertTriangle, TrendingDown, Users } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { useObjectives } from '@/hooks/useObjectives'
import { cn } from '@/lib/ui'
import { UserRole } from '@/lib/rbac'

interface AtRiskObjectivesWidgetProps {
  userRole?: UserRole
  userId?: string
}

export function AtRiskObjectivesWidget({ userRole, userId }: AtRiskObjectivesWidgetProps = {}) {
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

  const atRiskObjectives = objectives
    .filter(obj => obj.status === 'AT_RISK')
    .sort((a, b) => a.progress - b.progress) // Sort by lowest progress first

  const needsAttentionCount = objectives.filter(obj =>
    obj.status === 'AT_RISK' || obj.progress < 25
  ).length

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 okr-status-at-risk" />
          At Risk Objectives
        </CardTitle>
        <CardDescription>
          Objectives that need immediate attention
          {needsAttentionCount > 0 && (
            <Badge variant="secondary" className="ml-2">
              {needsAttentionCount} need attention
            </Badge>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {atRiskObjectives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-2">
              <TrendingDown className="h-6 w-6 okr-status-done" />
            </div>
            <p className="text-sm text-muted-foreground">
              All objectives are on track! 🎉
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {atRiskObjectives.slice(0, 4).map((objective) => (
              <div key={objective.id} className="flex items-center justify-between p-3 rounded-lg border border-warning/20 bg-warning/5 dark:border-warning/30 dark:bg-warning/10">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm truncate">{objective.title}</h4>
                    <ObjectiveStatusBadge status={objective.status} />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    {objective.team && (
                      <span className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {objective.team.name}
                      </span>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {objective.cycle}
                    </Badge>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className={cn(
                    "text-sm font-medium",
                    objective.progress < 25 ? "progress-low" : "progress-medium"
                  )}>
                    {objective.progress}%
                  </div>
                  <Progress
                    value={objective.progress}
                    className={cn(
                      "w-16 h-1 mt-1",
                      objective.progress < 25 && "[&>div]:bg-destructive"
                    )}
                  />
                </div>
              </div>
            ))}

            {atRiskObjectives.length > 4 && (
              <div className="text-center pt-2">
                <Button variant="outline" size="sm">
                  View {atRiskObjectives.length - 4} more
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
