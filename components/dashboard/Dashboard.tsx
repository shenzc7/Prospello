'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { format, addDays, isWithinInterval, startOfWeek, endOfWeek, startOfQuarter, endOfQuarter } from 'date-fns'
import { useSession } from 'next-auth/react'
import { Circle, TrendingUp, AlertTriangle, CheckCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { ProgressChip } from '@/components/objectives/progress-chip'
import { EmptyState } from '@/components/ui/EmptyState'
import { useObjectives } from '@/hooks/useObjectives'
import { ObjectiveStatusValue } from '@/hooks/useObjectives'
import { UpcomingDeadlinesWidget } from '@/components/productivity/UpcomingDeadlinesWidget'
import { AtRiskObjectivesWidget } from '@/components/productivity/AtRiskObjectivesWidget'
import { TeamProgressWidget } from '@/components/productivity/TeamProgressWidget'
import { cn } from '@/lib/ui'
import { UserRole } from '@/lib/rbac'

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
  variant?: 'default' | 'outline' | 'secondary'
}

function QuickAction({ title, description, href, icon, variant = 'outline' }: QuickActionProps) {
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

function RecentActivity({ userRole }: { userRole?: UserRole }) {
  // Only show for managers and admins
  if (userRole !== 'ADMIN' && userRole !== 'MANAGER') return null

  const activities = [
    {
      id: '1',
      type: 'checkin',
      user: 'Jordan Kim',
      objective: 'Improve API Performance by 50%',
      keyResult: 'API response time <200ms',
      value: 350,
      target: 200,
      time: '2 hours ago',
      status: 'progress'
    },
    {
      id: '2',
      type: 'objective',
      user: 'Sarah Chen',
      objective: 'Achieve 99.9% Deployment Uptime',
      time: '1 day ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'checkin',
      user: 'Alex Rodriguez',
      objective: 'Increase User Adoption by 40%',
      keyResult: 'Weekly active users',
      value: 32000,
      target: 50000,
      time: '1 day ago',
      status: 'progress'
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>Latest updates from your team</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {activities.map((activity) => (
          <div key={activity.id} className="flex items-start gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="text-xs">
                {activity.user.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm">
                <span className="font-medium">{activity.user}</span>{' '}
                {activity.type === 'checkin' ? (
                  <>
                    updated progress on{' '}
                    <span className="font-medium">{activity.keyResult}</span>{' '}
                    to {activity.value}{activity.keyResult?.includes('₹') ? '' : activity.keyResult?.includes('%') ? '%' : ''} of {activity.target}
                  </>
                ) : (
                  <>
                    marked objective{' '}
                    <span className="font-medium">{activity.objective}</span>{' '}
                    as completed
                  </>
                )}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function UpcomingDeadlines() {
  const today = new Date()
  const nextWeek = addDays(today, 7)

  const deadlines = [
    {
      id: '1',
      objective: 'Improve API Performance by 50%',
      dueDate: addDays(today, 3),
      status: 'AT_RISK' as ObjectiveStatusValue,
      progress: 42
    },
    {
      id: '2',
      objective: 'Increase User Adoption by 40%',
      dueDate: addDays(today, 14),
      status: 'IN_PROGRESS' as ObjectiveStatusValue,
      progress: 48
    }
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upcoming Deadlines</CardTitle>
        <CardDescription>Objectives due in the next 2 weeks</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {deadlines.map((deadline) => (
          <div key={deadline.id} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{deadline.objective}</p>
              <div className="flex items-center gap-2 mt-1">
                <ObjectiveStatusBadge status={deadline.status} />
                <span className="text-xs text-muted-foreground">
                  Due {format(deadline.dueDate, 'MMM d')}
                </span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium">{deadline.progress}%</div>
              <Progress value={deadline.progress} className="w-16 h-1 mt-1" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

function TopObjectivesWidget({ objectives }: { objectives: any[] }) {
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


function HeroSection({ metrics }: { metrics: any }) {
  const quarterStart = startOfQuarter(new Date())
  const quarterEnd = endOfQuarter(new Date())
  const now = new Date()
  const quarterProgress = ((now.getTime() - quarterStart.getTime()) / (quarterEnd.getTime() - quarterStart.getTime())) * 100

  const getTrafficLightStatus = (progress: number) => {
    if (progress >= 70) return { color: 'text-green-600', bg: 'bg-green-50', icon: CheckCircle, label: 'On Track' }
    if (progress >= 40) return { color: 'text-yellow-600', bg: 'bg-yellow-50', icon: AlertTriangle, label: 'At Risk' }
    return { color: 'text-red-600', bg: 'bg-red-50', icon: AlertTriangle, label: 'Off Track' }
  }

  const status = getTrafficLightStatus(metrics?.avgProgress || 0)
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
                  strokeDashoffset={`${2 * Math.PI * 40 * (1 - (metrics?.avgProgress || 0) / 100)}`}
                  className="text-primary transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold">{Math.round(metrics?.avgProgress || 0)}%</span>
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
                {metrics?.totalObjectives || 0} active objectives
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

function PersonalOKRsWidget({ userId, userRole }: { userId?: string; userRole?: UserRole }) {
  // Only show for employees
  if (userRole !== 'EMPLOYEE') return null

  const personalObjectives = [
    { id: '1', title: 'Improve Code Quality', progress: 75, status: 'IN_PROGRESS' },
    { id: '2', title: 'Learn TypeScript Advanced Features', progress: 60, status: 'IN_PROGRESS' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle>My OKRs</CardTitle>
        <CardDescription>Your personal objectives and progress</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {personalObjectives.map((objective) => (
          <div key={objective.id} className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{objective.title}</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-muted-foreground">{objective.progress}%</span>
                <Progress value={objective.progress} className="flex-1 h-1" />
              </div>
            </div>
            <Button size="sm" variant="outline" className="ml-2">
              Update
            </Button>
          </div>
        ))}
        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            💡 Weekly check-in due tomorrow
          </p>
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
        <CardTitle>This Week&apos;s Check-ins</CardTitle>
        <CardDescription>
          {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            Update your weekly progress
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export function Dashboard() {
  const { data: session } = useSession()
  const user = session?.user
  const userRole = user?.role as UserRole

  // Build query params based on user role
  const queryParams = useMemo(() => {
    if (!user) return {}

    switch (userRole) {
      case 'ADMIN':
        // Admin sees all objectives
        return {}
      case 'MANAGER':
        // Manager sees team objectives and their own
        return {}
      case 'EMPLOYEE':
        // Employee sees only their own objectives
        return { ownerId: user.id }
      default:
        return { ownerId: user.id }
    }
  }, [user, userRole])

  const { data: objectivesData, isLoading } = useObjectives(queryParams)

  // Filter objectives based on user role for display
  const filteredObjectives = useMemo(() => {
    if (!objectivesData?.objectives || !user) return objectivesData?.objectives ?? []

    const objectives = objectivesData.objectives

    switch (userRole) {
      case 'ADMIN':
        // Admin sees all objectives
        return objectives
      case 'MANAGER':
        // Manager sees objectives they own or are on their team
        return objectives.filter(obj =>
          obj.owner.id === user.id ||
          obj.team?.name?.includes('Team') // Managers can see team objectives
        )
      case 'EMPLOYEE':
        // Employee sees only their own objectives
        return objectives.filter(obj => obj.owner.id === user.id)
      default:
        return objectives.filter(obj => obj.owner.id === user.id)
    }
  }, [objectivesData?.objectives, user, userRole])

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
          title: "Welcome to Prospello Admin Dashboard",
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
          title: "Welcome to Prospello",
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

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {headerContent.title}
          </h1>
          <p className="text-muted-foreground">
            {headerContent.description}
          </p>
        </div>
        <div className="flex gap-2">
          {headerContent.actions}
        </div>
      </div>

      {/* Hero Section - Only for Admin and Manager */}
      {(userRole === 'ADMIN' || userRole === 'MANAGER') && metrics && (
        <div className="mb-8">
          <HeroSection metrics={metrics} />
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Objectives"
          value={metrics.totalObjectives}
          description="Active OKRs in your organization"
        />
        <MetricCard
          title="Completion Rate"
          value={`${metrics.completionRate}%`}
          description="Objectives marked as done"
          trend={{ value: 12, label: "from last month" }}
        />
        <MetricCard
          title="At Risk"
          value={metrics.atRiskObjectives}
          description="Objectives needing attention"
        />
        <MetricCard
          title="Average Progress"
          value={`${metrics.avgProgress}%`}
          description="Across all objectives"
          trend={{ value: 8, label: "from last week" }}
        />
      </div>

      {/* Main Content Grid - Role-based */}
      {(() => {
        const getQuickActions = () => {
          const actions = []

          // Create objective action (with limits)
          const canCreateObjective = userRole === 'ADMIN' || userRole === 'MANAGER' ||
                                    (userRole === 'EMPLOYEE' && metrics.totalObjectives < 5)

          if (canCreateObjective) {
            actions.push(
              <QuickAction
                key="create-objective"
                title="Create New Objective"
                description="Start a new OKR cycle"
                href="/okrs/new"
              />
            )
          }

          // Role-specific actions
          switch (userRole) {
            case 'ADMIN':
              actions.push(
                <QuickAction
                  key="manage-users"
                  title="Manage Users"
                  description="Add/remove users and teams"
                  href="/admin/users"
                />,
                <QuickAction
                  key="view-reports"
                  title="View Reports"
                  description="Company analytics and insights"
                  href="/reports"
                />
              )
              break
            case 'MANAGER':
              actions.push(
                <QuickAction
                  key="team-okrs"
                  title="Team OKRs"
                  description="Manage team objectives"
                  href="/my-okrs"
                />,
                <QuickAction
                  key="team-overview"
                  title="Team Overview"
                  description="See team performance"
                  href="/objectives"
                />
              )
              break
            case 'EMPLOYEE':
              actions.push(
                <QuickAction
                  key="my-okrs"
                  title="My OKRs"
                  description="View and update my objectives"
                  href="/my-okrs"
                />,
                <QuickAction
                  key="check-ins"
                  title="My Check-ins"
                  description="Update weekly progress"
                  href="/checkins"
                />
              )
              break
          }

          return actions
        }

        const quickActions = getQuickActions()

        return (
          <div className="grid gap-6 xl:grid-cols-4">
            {/* Left Column - Quick Actions & Check-ins */}
            <div className="space-y-6 xl:col-span-1">
              {quickActions.length > 0 && (
                <div>
                  <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
                  <div className="space-y-3">
                    {quickActions}
                  </div>
                </div>
              )}

              {/* Show personal OKRs for employees */}
              <PersonalOKRsWidget userId={user?.id} userRole={userRole} />

              {/* Only show check-ins for non-admin users */}
              {userRole !== 'ADMIN' && <ThisWeekCheckIns />}
            </div>

            {/* Center Column - Productivity Widgets - Role-based */}
            <div className="space-y-6 xl:col-span-2">
              <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
                <UpcomingDeadlinesWidget userRole={userRole} userId={user?.id} />
                <AtRiskObjectivesWidget userRole={userRole} userId={user?.id} />
              </div>

              {/* Top Objectives - Show for all roles */}
              {filteredObjectives.length > 0 && (
                <TopObjectivesWidget objectives={filteredObjectives} />
              )}

              {/* Only show recent activity for managers and admins */}
              <RecentActivity userRole={userRole} />
            </div>

            {/* Right Column - Team Progress - Only for managers and admins */}
            <div className="space-y-6 xl:col-span-1">
              <TeamProgressWidget userRole={userRole} userId={user?.id} />
            </div>
          </div>
        )
      })()}
    </div>
  )
}

