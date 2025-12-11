'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { format, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter } from 'date-fns'
import { useSession } from 'next-auth/react'
import { AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { EmptyState } from '@/components/ui/EmptyState'
import { useObjectives, type Objective } from '@/hooks/useObjectives'
import { UpcomingDeadlinesWidget } from '@/components/productivity/UpcomingDeadlinesWidget'
import { AtRiskObjectivesWidget } from '@/components/productivity/AtRiskObjectivesWidget'
import { TeamProgressWidget } from '@/components/productivity/TeamProgressWidget'
import { NotificationsFeed } from '@/components/productivity/NotificationsFeed'
import { HeatMap } from '@/components/analytics/HeatMap'
import { TimelineView } from '@/components/analytics/TimelineView'
import { cn } from '@/lib/ui'
import { UserRole } from '@/lib/rbac'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { useCheckInSummary } from '@/hooks/useCheckInSummary'
import type { HeroSummary, AlignmentNode, CheckInSummary } from '@/lib/checkin-summary'
import { AlignmentTree } from '@/components/analytics/AlignmentTree'
import { isFeatureEnabled } from '@/config/features'
import { useDemoMode } from '@/components/demo/DemoProvider'

type DashboardMetrics = {
  totalObjectives: number
  completedObjectives: number
  atRiskObjectives: number
  avgProgress: number
  completionRate: number
}

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  trend?: {
    value: number
    label: string
  }
  icon?: React.ReactNode
}

function MetricCard({ title, value, description, trend, icon }: MetricCardProps) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02]">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="h-4 w-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <div className="flex items-center pt-1">
            <span className={cn(
              "text-xs font-medium",
              trend.value > 0 ? "progress-high" : "progress-low"
            )}>
              {trend.value > 0 ? "+" : ""}{trend.value}% {trend.label}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface QuickActionProps {
  title: string
  description: string
  href: string
  icon?: React.ReactNode
}

function QuickAction({ title, description, href, icon }: QuickActionProps) {
  return (
    <Card className="shadow-card hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] hover:bg-muted/30">
      <CardContent className="p-4">
        <Link href={href} className="block">
          <div className="flex items-center gap-3">
            {icon && <div className="flex-shrink-0 text-primary">{icon}</div>}
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-sm">{title}</h3>
              <p className="text-xs text-muted-foreground mt-1">{description}</p>
            </div>
          </div>
        </Link>
      </CardContent>
    </Card>
  )
}

type RecentActivityProps = {
  userRole?: UserRole
  recentCheckIns?: CheckInSummary['recentCheckIns']
}

function RecentActivity({ userRole, recentCheckIns }: RecentActivityProps) {
  // Only show for managers and admins
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') return null

  const activities = recentCheckIns ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-sm text-muted-foreground">No recent check-ins yet. Team updates will appear here after weekly progress is logged.</div>
        ) : (
          activities.map((activity) => {
            const traffic = calculateTrafficLightStatus(activity.value)
            const trafficClasses = getTrafficLightClasses(traffic)
            const ownerInitials = activity.ownerName?.split(' ').map((n) => n[0]).join('') || '?'
            const statusLabel = activity.status === 'GREEN' ? 'On track' : activity.status === 'YELLOW' ? 'At risk' : 'Off track'

            return (
              <div key={activity.id} className="flex items-start gap-3 rounded-lg border p-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs">{ownerInitials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.ownerName}</span>{' '}
                    updated <span className="font-medium">{activity.keyResultTitle}</span> on{' '}
                    <span className="font-medium">{activity.objectiveTitle}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Status: {statusLabel} • Value: {activity.value}%
                  </p>
                </div>
                <span className={cn('text-[11px] px-2 py-1 rounded-full border', trafficClasses.bg, trafficClasses.border, trafficClasses.text)}>
                  {Math.round(activity.value)}%
                </span>
              </div>
            )
          })
        )}
      </CardContent>
    </Card>
  )
}

function TopObjectivesWidget({ objectives }: { objectives: Objective[] }) {
  const topObjectives = objectives.slice(0, 5) // Show top 5 objectives

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DONE': return <Badge className="bg-green-100 text-green-800">Done</Badge>
      case 'AT_RISK': return <Badge className="bg-red-100 text-red-800">At Risk</Badge>
      case 'IN_PROGRESS': return <Badge className="bg-yellow-100 text-yellow-800">In Progress</Badge>
      default: return <Badge variant="outline">Not Started</Badge>
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Objectives</CardTitle>
        <CardDescription>Key objectives requiring attention</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {topObjectives.map((objective) => (
            <div key={objective.id} className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{objective.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  {getStatusBadge(objective.status)}
                  <span className="text-xs text-muted-foreground">
                    {objective.progress}% complete
                  </span>
                </div>
              </div>
              <div className="ml-4">
                <div className="w-16 bg-muted rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${objective.progress}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function ObjectiveProgressList({ objectives }: { objectives: Objective[] }) {
  if (!objectives.length) return null

  const prioritizedObjectives = [...objectives]
    .sort((a, b) => b.progress - a.progress)
    .slice(0, 6)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Live Progress</CardTitle>
        <CardDescription>Real-time OKR progress from latest check-ins</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {prioritizedObjectives.map((objective) => {
          const traffic = calculateTrafficLightStatus(objective.progress)
          const trafficClasses = getTrafficLightClasses(traffic)
          const score = typeof objective.score === 'number'
            ? objective.score
            : (objective.progress ?? 0) / 100

          return (
            <div key={objective.id} className="space-y-2 rounded-lg border border-border/60 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight truncate">{objective.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ObjectiveStatusBadge status={objective.status} />
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium border",
                        trafficClasses.bg,
                        trafficClasses.border,
                        trafficClasses.text
                      )}
                    >
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {traffic.toUpperCase()}
                    </span>
                    <span>Score {score.toFixed(2)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{objective.progress}%</div>
                  <Progress value={objective.progress} className="w-20 h-1.5 mt-1" />
                </div>
              </div>

              <div className="space-y-2">
                {objective.keyResults.slice(0, 2).map((kr) => (
                  <div key={kr.id} className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span className="truncate">{kr.title}</span>
                    <div className="flex items-center gap-2 min-w-[120px]">
                      <Progress value={kr.progress} className="w-24 h-1" />
                      <span className="text-[11px] font-medium">{Math.round(kr.progress)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}


function HeroSection({ metrics, hero }: { metrics: DashboardMetrics | null; hero?: HeroSummary }) {
  const quarterStart = startOfQuarter(new Date())
  const quarterEnd = endOfQuarter(new Date())
  const now = new Date()
  const quarterProgress = ((now.getTime() - quarterStart.getTime()) / (quarterEnd.getTime() - quarterStart.getTime())) * 100
  const progressValue = hero?.avgProgress ?? metrics?.avgProgress ?? 0

  const getTrafficLightStatus = (progress: number) => {
    const status = calculateTrafficLightStatus(progress)
    switch (status) {
      case 'green':
        return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'On Track' }
      case 'yellow':
        return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle, label: 'At Risk' }
      case 'red':
        return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Off Track' }
      default:
        return { color: 'text-gray-600', bg: 'bg-gray-50', icon: Clock, label: 'No Progress' }
    }
  }

  const status = getTrafficLightStatus(progressValue || 0)
  const StatusIcon = status.icon

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            {/* Progress Ring */}
            <div className="relative">
              <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  className="text-muted-foreground/20"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  stroke="currentColor"
                  strokeWidth="8"
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 40}`}
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (progressValue || 0) / 100)}`}
                  className="text-primary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(progressValue || 0)}%</span>
              </div>
            </div>

            {/* Status and Info */}
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Company OKRs</h2>
              <div className="flex items-center gap-2">
                <StatusIcon className={`h-5 w-5 ${status.color}`} />
                <span className={`font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm text-muted-foreground">
                {(hero?.objectiveCount ?? metrics?.totalObjectives) || 0} active objectives
              </p>
            </div>
          </div>

          {/* Quarter Timeline */}
          <div className="flex-1 max-w-md ml-8">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Q4 2024</span>
                <span>{Math.round(quarterProgress)}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${quarterProgress}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {format(quarterStart, 'MMM d')} - {format(quarterEnd, 'MMM d')}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function PersonalOKRsWidget({
  objectives,
  userEmail,
  userRole,
}: {
  objectives: Objective[]
  userEmail?: string | null
  userRole?: UserRole
}) {
  const personalObjectives = objectives.filter((objective) =>
    userEmail ? (objective.owner.email === userEmail || objective.owner.name === userEmail) : false
  ).slice(0, 3)

  const showWidget = personalObjectives.length > 0 || userRole === 'EMPLOYEE'
  const dueCount = personalObjectives.filter((objective) => objective.progress < 100).length

  if (!showWidget) return null

  return (
    <Card className="card-spotlight border-primary/20 shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-semibold">Me</span>
          My OKRs
        </CardTitle>
        <CardDescription>Quick access to your objectives and weekly updates</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {personalObjectives.length === 0 ? (
          <div className="flex items-center justify-between rounded-xl border border-dashed border-border/70 bg-muted/40 px-3 py-3 text-sm">
            <p className="text-muted-foreground">No personal objectives yet.</p>
            <Button asChild size="sm">
              <Link href="/okrs/new">Create One</Link>
            </Button>
          </div>
        ) : (
          personalObjectives.map((objective) => (
            <div key={objective.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card/70 p-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{objective.title}</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <Progress value={objective.progress} className="h-1.5 flex-1" />
                  <span className="min-w-[3rem] text-right font-medium text-foreground">{Math.round(objective.progress)}%</span>
                </div>
              </div>
              <Button asChild variant="secondary" size="sm">
                <Link href={`/okrs/${objective.id}`}>Open</Link>
              </Button>
            </div>
          ))
        )}
        <div className="flex items-center justify-between rounded-lg border border-border/60 bg-primary/5 px-3 py-2 text-xs text-primary">
          <span>Weekly check-in reminder</span>
          <span className="font-semibold">{dueCount} due</span>
        </div>
      </CardContent>
    </Card>
  )
}

function ThisWeekCheckIns() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Weekly Check-ins
        </CardTitle>
        <CardDescription>
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="rounded-lg border border-dashed border-primary/30 bg-primary/5 px-3 py-2 text-sm text-primary">
          Ensure each key result has an update before Friday.
        </div>
        <Button asChild size="sm" variant="secondary" className="w-full">
          <Link href="/checkins">Open Check-in Console</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function AlignmentMap({ objectives, alignment }: { objectives: Objective[]; alignment?: AlignmentNode[] }) {
  const topObjectives = objectives.slice(0, 3)

  const goalType = (objective: Objective) => {
    if (!objective.parent && !objective.team) return 'Company'
    if (objective.team && !objective.parent) return 'Department'
    if (objective.team && objective.parent) return 'Team'
    return 'Individual'
  }

  if (alignment && alignment.length > 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Alignment Map
          </CardTitle>
          <CardDescription>Company → team → individual goal cascade</CardDescription>
        </CardHeader>
        <CardContent>
          <AlignmentTree nodes={alignment} />
        </CardContent>
      </Card>
    )
  }

  if (!topObjectives.length) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Alignment Map
        </CardTitle>
        <CardDescription>Company → team → individual goal cascade</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {topObjectives.map((objective) => {
          const traffic = calculateTrafficLightStatus(objective.progress)
          const trafficClasses = getTrafficLightClasses(traffic)
          return (
            <div key={objective.id} className="space-y-2 rounded-xl border border-border/70 bg-muted/40 p-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <p className="text-sm font-semibold leading-tight">{objective.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant="outline" className="text-[11px] uppercase tracking-wide">{goalType(objective)}</Badge>
                    {objective.team ? <Badge variant="secondary">{objective.team.name}</Badge> : null}
                    <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border', trafficClasses.bg, trafficClasses.border, trafficClasses.text)}>
                      <span className="h-2 w-2 rounded-full bg-current" />
                      {traffic.toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold">{Math.round(objective.progress)}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Owner:</span> {objective.owner.name ?? objective.owner.email}
                {objective.children?.length ? (
                  <>
                    <span className="h-px w-5 bg-border" />
                    <span>{objective.children.length} aligned</span>
                  </>
                ) : null}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: session } = useSession()
  const user = session?.user
  const { enabled: demoEnabled, role: demoRole } = useDemoMode()
  const userRole = (demoEnabled ? demoRole : user?.role) as UserRole
  const demoViewerEmail = demoEnabled
    ? demoRole === 'EMPLOYEE'
      ? 'eden@okrflow.demo'
      : demoRole === 'MANAGER'
        ? 'morgan@okrflow.demo'
        : undefined
    : undefined
  const { data: checkInSummary } = useCheckInSummary()
  const showProductivityExtras = isFeatureEnabled('productivityWidgets')
  const showNotificationFeed = isFeatureEnabled('notificationFeed')

  // Build query params based on user role
  const queryParams = useMemo(() => {
    if (demoEnabled) return {}
    if (!user) return {}

    switch (userRole) {
      case 'ADMIN':
        return {}
      case 'MANAGER':
        return {}
      case 'EMPLOYEE':
        return { ownerId: user.id }
      default:
        return { ownerId: user.id }
    }
  }, [demoEnabled, user, userRole])

  const { data: objectivesData, isLoading } = useObjectives(queryParams)

  // Filter objectives based on user role for display
  const filteredObjectives = useMemo(() => {
    if (!objectivesData?.objectives) return objectivesData?.objectives ?? []

    const objectives = objectivesData.objectives

    if (demoEnabled) {
      if (userRole === 'EMPLOYEE' && demoViewerEmail) {
        return objectives.filter((obj) => obj.owner.email === demoViewerEmail)
      }
      if (userRole === 'MANAGER' && demoViewerEmail) {
        return objectives.filter((obj) => obj.team?.id === 'team-gtm' || obj.owner.email === demoViewerEmail)
      }
      return objectives
    }

    if (!user) return objectives

    switch (userRole) {
      case 'ADMIN':
        return objectives
      case 'MANAGER':
        return objectives.filter(obj =>
          obj.owner.id === user.id ||
          obj.team?.name?.includes('Team')
        )
      case 'EMPLOYEE':
        return objectives.filter(obj => obj.owner.id === user.id)
      default:
        return objectives.filter(obj => obj.owner.id === user.id)
    }
  }, [demoEnabled, demoViewerEmail, objectivesData?.objectives, user, userRole])

  const computedTeamHeatmap = useMemo(() => {
    const map = new Map<string, {
      teamId: string
      teamName: string
      objectiveCount: number
      memberEmails: Set<string>
      totalProgress: number
    }>()

    filteredObjectives.forEach((objective) => {
      const teamId = objective.team?.id || `unassigned-${objective.owner.id}`
      const teamName = objective.team?.name || 'Unassigned'
      if (!map.has(teamId)) {
        map.set(teamId, {
          teamId,
          teamName,
          objectiveCount: 0,
          memberEmails: new Set(),
          totalProgress: 0,
        })
      }
      const node = map.get(teamId)!
      node.objectiveCount += 1
      node.totalProgress += objective.progress
      node.memberEmails.add(objective.owner.email)
    })

    return Array.from(map.values()).map((team) => {
      const progress = team.objectiveCount > 0 ? Math.round(team.totalProgress / team.objectiveCount) : 0
      return {
        teamId: team.teamId,
        teamName: team.teamName,
        progress,
        status: calculateTrafficLightStatus(progress),
        objectiveCount: team.objectiveCount,
        memberCount: team.memberEmails.size || 1,
      }
    })
  }, [filteredObjectives])
  const teamHeatmapData = checkInSummary?.teamHeatmap ?? computedTeamHeatmap

  const metrics = useMemo(() => {
    if (!filteredObjectives.length) return null

    const objectives = filteredObjectives
    const totalObjectives = objectives.length
    const completedObjectives = objectives.filter(obj => obj.status === 'DONE').length
    const atRiskObjectives = objectives.filter(obj => obj.status === 'AT_RISK').length
    const avgProgress = objectives.reduce((sum, obj) => sum + obj.progress, 0) / totalObjectives

    return {
      totalObjectives,
      completedObjectives,
      atRiskObjectives,
      avgProgress: Math.round(avgProgress),
      completionRate: Math.round((completedObjectives / totalObjectives) * 100)
    }
  }, [filteredObjectives])

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Role-based empty states and limits
  const getEmptyStateContent = () => {
    switch (userRole) {
      case 'ADMIN':
        return {
          title: "Welcome to OKR Builder Admin Dashboard",
          description: "Monitor company-wide OKRs, manage teams, and track overall progress.",
          action: (
            <Button asChild>
              <Link href="/admin/users">Manage Users</Link>
            </Button>
          )
        }
      case 'MANAGER':
        return {
          title: "Team Leadership Dashboard",
          description: "Oversee your team's OKRs, track progress, and guide your team to success.",
          action: (
            <Button asChild>
              <Link href="/okrs/new">Create Team Objective</Link>
            </Button>
          )
        }
      case 'EMPLOYEE':
        return {
          title: "Your Personal OKRs",
          description: "Track your individual goals and contribute to team success.",
          action: (
            <Button asChild>
              <Link href="/okrs/new">Create Objective</Link>
            </Button>
          )
        }
      default:
        return {
          title: "Welcome to OKR Builder",
          description: "Get started by creating your first objective.",
          action: (
            <Button asChild>
              <Link href="/okrs/new">Create Objective</Link>
            </Button>
          )
        }
    }
  }

  if (!metrics) {
    const emptyState = getEmptyStateContent()
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    )
  }

  // Role-based header and actions
  const getHeaderContent = () => {
    const baseActions = []

    // Add role-specific actions
    switch (userRole) {
      case 'ADMIN':
        baseActions.push(
          <Button variant="outline" asChild key="admin-users" className="shadow-card hover:shadow-card-hover">
            <Link href="/admin/users">Manage Users</Link>
          </Button>,
          <Button variant="outline" asChild key="reports" className="shadow-card hover:shadow-card-hover">
            <Link href="/reports">Reports</Link>
          </Button>
        )
        break
      case 'MANAGER':
        baseActions.push(
          <Button variant="outline" asChild key="team-okrs" className="shadow-card hover:shadow-card-hover">
            <Link href="/my-okrs">Team OKRs</Link>
          </Button>
        )
        break
      case 'EMPLOYEE':
        baseActions.push(
          <Button variant="outline" asChild key="my-okrs" className="shadow-card hover:shadow-card-hover">
            <Link href="/my-okrs">My OKRs</Link>
          </Button>
        )
        break
    }

    // Add create objective button for all roles (with limits for employees)
    const canCreateObjective = userRole === 'ADMIN' || userRole === 'MANAGER' ||
      (userRole === 'EMPLOYEE' && metrics.totalObjectives < 5) // Employee limit

    if (canCreateObjective) {
      baseActions.push(
        <Button asChild key="new-objective" className="shadow-card hover:shadow-card-hover">
          <Link href="/okrs/new">New Objective</Link>
        </Button>
      )
    }

    const getTitle = () => {
      switch (userRole) {
        case 'ADMIN': return "Admin Dashboard"
        case 'MANAGER': return "Team Dashboard"
        case 'EMPLOYEE': return "My Dashboard"
        default: return "Dashboard"
      }
    }

    const getDescription = () => {
      switch (userRole) {
        case 'ADMIN': return "Company-wide OKR overview and administration"
        case 'MANAGER': return "Team progress and leadership insights"
        case 'EMPLOYEE': return "Your personal OKRs and progress tracking"
        default: return "Overview of your OKRs and team progress"
      }
    }

    return {
      title: getTitle(),
      description: getDescription(),
      actions: baseActions
    }
  }

  const headerContent = getHeaderContent()
  const quickActions = (() => {
    const actions = []

    const canCreateObjective = userRole === 'ADMIN' || userRole === 'MANAGER' ||
      (userRole === 'EMPLOYEE' && metrics.totalObjectives < 5)

    if (canCreateObjective) {
      actions.push(
        <QuickAction
          key="create-objective"
          title="Create Objective"
          description="Start a new OKR cycle and align owners"
          href="/okrs/new"
        />
      )
    }

    switch (userRole) {
      case 'ADMIN':
        actions.push(
          <QuickAction
            key="manage-users"
            title="User Access"
            description="Assign roles and manage teams"
            href="/admin/users"
          />,
          <QuickAction
            key="view-reports"
            title="Reports & Exports"
            description="PDF / Excel / alignment views"
            href="/reports"
          />
        )
        break
      case 'MANAGER':
        actions.push(
          <QuickAction
            key="team-okrs"
            title="Team Dashboard"
            description="Focus on team-level OKRs"
            href="/my-okrs"
          />,
          <QuickAction
            key="team-overview"
            title="Alignment Overview"
            description="See team performance & risks"
            href="/teams"
          />
        )
        break
      case 'EMPLOYEE':
        actions.push(
          <QuickAction
            key="my-okrs"
            title="Update My OKRs"
            description="Quickly log weekly check-ins"
            href="/my-okrs"
          />,
          <QuickAction
            key="check-ins"
            title="Weekly Check-in"
            description="Traffic light + comments"
            href="/checkins"
          />
        )
        break
    }

    return actions
  })()

  const showHeatMap = userRole === 'ADMIN' || userRole === 'MANAGER'

  return (
    <div className="space-y-7 sm:space-y-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {headerContent.title}
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            {headerContent.description}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {headerContent.actions}
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[2fr_1fr]">
        <HeroSection metrics={metrics} hero={checkInSummary?.hero} />
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Action Feed</CardTitle>
            <CardDescription>Notifications, reminders, and quick steps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg border border-dashed border-primary/40 bg-primary/5 px-3 py-2 text-sm text-primary">
              Within 30 seconds know where to act: green = on track, yellow = at risk, red = off track.
            </div>
            {quickActions.length ? (
              <div className="space-y-3">
                {quickActions.map((action, index) => (
                  <div key={`quick-${index}`}>{action}</div>
                ))}
              </div>
            ) : null}
            <Button asChild size="sm" variant="secondary" className="w-full">
              <Link href="/reports">Open reports & exports</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Objectives"
          value={metrics.totalObjectives}
          description="Active OKRs across the company"
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          description="Objectives scored as done"
          trend={{ value: 12, label: "from last month" }}
        />
        <MetricCard
          title="At Risk"
          value={metrics.atRiskObjectives}
          description="Needs attention this week"
        />
        <MetricCard
          title="Average Progress"
          value={`${metrics.avgProgress}%`}
          description="Weighted across all objectives"
          trend={{ value: 8, label: "from last week" }}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <ObjectiveProgressList objectives={filteredObjectives} />
          <TimelineView objectives={filteredObjectives} isLoading={isLoading} />
          {showHeatMap && <HeatMap type="teams" data={teamHeatmapData} />}
        </div>

        <div className="space-y-6">
          {filteredObjectives.length > 0 && (
            <TopObjectivesWidget objectives={filteredObjectives} />
          )}
          <PersonalOKRsWidget
            objectives={filteredObjectives}
            userEmail={demoEnabled ? demoViewerEmail : user?.email}
            userRole={userRole}
          />
          {userRole !== 'ADMIN' && <ThisWeekCheckIns />}
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {showProductivityExtras && <TeamProgressWidget userRole={userRole} userId={user?.id} />}
        {showNotificationFeed && <NotificationsFeed userRole={userRole} userId={user?.id} />}
        <AlignmentMap objectives={filteredObjectives} alignment={checkInSummary?.alignment} />
      </div>

      {showProductivityExtras && (
        <div className="grid gap-6 lg:grid-cols-2">
          <UpcomingDeadlinesWidget userRole={userRole} userId={user?.id} />
          <AtRiskObjectivesWidget userRole={userRole} userId={user?.id} />
        </div>
      )}

      {showProductivityExtras && (userRole === 'ADMIN' || userRole === 'MANAGER') && (
        <RecentActivity userRole={userRole} recentCheckIns={checkInSummary?.recentCheckIns} />
      )}
    </div>
  )
}
