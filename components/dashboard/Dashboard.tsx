'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { format, addDays, isWithinInterval, startOfWeek, endOfWeek } from 'date-fns'

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

function RecentActivity() {
  // Mock recent activity data - in a real app, this would come from an API
  const activities = [
    {
      id: '1',
      type: 'checkin',
      user: 'Meena Patel',
      objective: 'GST Compliance Objective',
      keyResult: 'File monthly returns on schedule',
      value: 5,
      target: 12,
      time: '2 hours ago',
      status: 'progress'
    },
    {
      id: '2',
      type: 'objective',
      user: 'Aditi Rao',
      objective: 'Improve Delivery SLA',
      time: '1 day ago',
      status: 'completed'
    },
    {
      id: '3',
      type: 'checkin',
      user: 'Manish Iyer',
      objective: 'Grow MRR to ₹50L',
      keyResult: 'Leads→Demos pipeline value',
      value: 2400000,
      target: 5000000,
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

  // Mock upcoming deadlines - in a real app, this would be calculated from objectives
  const deadlines = [
    {
      id: '1',
      objective: 'GST Compliance Objective',
      dueDate: addDays(today, 3),
      status: 'AT_RISK' as ObjectiveStatusValue,
      progress: 42
    },
    {
      id: '2',
      objective: 'Grow MRR to ₹50L',
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

function ThisWeekCheckIns() {
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 }) // Monday
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 1 })

  return (
    <Card>
      <CardHeader>
        <CardTitle>This Week's Check-ins</CardTitle>
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
  const { data: objectivesData, isLoading } = useObjectives({})

  const metrics = useMemo(() => {
    if (!objectivesData?.objectives) return null

    const objectives = objectivesData.objectives
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
  }, [objectivesData])

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

  if (!metrics) {
    return (
      <EmptyState
        title="Welcome to OKRFlow"
        description="Get started by creating your first objective or exploring existing OKRs."
        action={
          <Button asChild>
            <Link href="/okrs/new">Create Objective</Link>
          </Button>
        }
      />
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-muted-foreground">
            Overview of your OKRs and team progress
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="shadow-card hover:shadow-card-hover">
            <Link href="/my-okrs">My OKRs</Link>
          </Button>
          <Button asChild className="shadow-card hover:shadow-card-hover">
            <Link href="/okrs/new">New Objective</Link>
          </Button>
        </div>
      </div>

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

      {/* Main Content Grid */}
      <div className="grid gap-6 xl:grid-cols-4">
        {/* Left Column - Quick Actions & Check-ins */}
        <div className="space-y-6 xl:col-span-1">
          <div>
            <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <QuickAction
                title="Create New Objective"
                description="Start a new OKR cycle"
                href="/okrs/new"
              />
              <QuickAction
                title="View All OKRs"
                description="Browse and manage objectives"
                href="/okrs"
              />
              <QuickAction
                title="My Check-ins"
                description="Update weekly progress"
                href="/my-okrs"
              />
              <QuickAction
                title="Team Overview"
                description="See team performance"
                href="/objectives"
              />
            </div>
          </div>

          <ThisWeekCheckIns />
        </div>

        {/* Center Column - Productivity Widgets */}
        <div className="space-y-6 xl:col-span-2">
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-1">
            <UpcomingDeadlinesWidget />
            <AtRiskObjectivesWidget />
          </div>

          <RecentActivity />
        </div>

        {/* Right Column - Team Progress */}
        <div className="space-y-6 xl:col-span-1">
          <TeamProgressWidget />
        </div>
      </div>
    </div>
  )
}
