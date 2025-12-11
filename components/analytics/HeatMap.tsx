'use client'

import { useMemo, useEffect, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { format, eachWeekOfInterval, subWeeks } from 'date-fns'
import { CheckCircle2, AlertTriangle, XCircle, Clock, Users, ChevronRight } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/ui'
import { type TrafficLightStatus } from '@/lib/utils'

export type HeatMapCell = {
  value: number
  status: 'green' | 'yellow' | 'red' | 'gray'
  date?: Date
  checkInId?: string
}

export type TeamStatus = {
  teamId: string
  teamName: string
  progress: number
  status: 'green' | 'yellow' | 'red' | 'gray'
  objectiveCount: number
  memberCount: number
}

export type KeyResultProgress = {
  keyResultId: string
  keyResultTitle: string
  objectiveTitle: string
  ownerName: string
  weeklyProgress: HeatMapCell[]
}

export type HeatMapProps = {
  type: 'teams' | 'progress'
  title?: string
  description?: string
  data?: TeamStatus[] | KeyResultProgress[]
  className?: string
}

// Mock data for demonstration
const mockTeamData: TeamStatus[] = [
  { teamId: '1', teamName: 'Sales', progress: 70, status: 'green', objectiveCount: 8, memberCount: 6 },
  { teamId: '2', teamName: 'Marketing', progress: 45, status: 'yellow', objectiveCount: 6, memberCount: 4 },
  { teamId: '3', teamName: 'Product', progress: 30, status: 'yellow', objectiveCount: 10, memberCount: 8 },
  { teamId: '4', teamName: 'Engineering', progress: 82, status: 'green', objectiveCount: 12, memberCount: 10 },
  { teamId: '5', teamName: 'Design', progress: 25, status: 'red', objectiveCount: 4, memberCount: 3 },
  { teamId: '6', teamName: 'Support', progress: 68, status: 'yellow', objectiveCount: 5, memberCount: 4 },
]

const mockProgressData: KeyResultProgress[] = [
  {
    keyResultId: '1',
    keyResultTitle: 'API Response Time < 200ms',
    objectiveTitle: 'Improve API Performance',
    ownerName: 'John Doe',
    weeklyProgress: [
      { value: 0, status: 'gray', date: subWeeks(new Date(), 4) },
      { value: 25, status: 'red', date: subWeeks(new Date(), 3) },
      { value: 45, status: 'yellow', date: subWeeks(new Date(), 2) },
      { value: 75, status: 'green', date: subWeeks(new Date(), 1) },
      { value: 85, status: 'green', date: new Date() }
    ]
  },
  {
    keyResultId: '2',
    keyResultTitle: 'User Adoption Rate > 80%',
    objectiveTitle: 'Increase Product Adoption',
    ownerName: 'Jane Smith',
    weeklyProgress: [
      { value: 30, status: 'yellow', date: subWeeks(new Date(), 4) },
      { value: 35, status: 'yellow', date: subWeeks(new Date(), 3) },
      { value: 40, status: 'yellow', date: subWeeks(new Date(), 2) },
      { value: 55, status: 'yellow', date: subWeeks(new Date(), 1) },
      { value: 60, status: 'yellow', date: new Date() }
    ]
  },
  {
    keyResultId: '3',
    keyResultTitle: 'NPS Score > 70',
    objectiveTitle: 'Improve Customer Satisfaction',
    ownerName: 'Mike Johnson',
    weeklyProgress: [
      { value: 65, status: 'yellow', date: subWeeks(new Date(), 4) },
      { value: 68, status: 'yellow', date: subWeeks(new Date(), 3) },
      { value: 72, status: 'green', date: subWeeks(new Date(), 2) },
      { value: 75, status: 'green', date: subWeeks(new Date(), 1) },
      { value: 78, status: 'green', date: new Date() }
    ]
  }
]

function getStatusColor(status: TrafficLightStatus) {
  switch (status) {
    case 'green': return 'bg-green-500'
    case 'yellow': return 'bg-amber-500'
    case 'red': return 'bg-red-500'
    default: return 'bg-slate-300'
  }
}

function getStatusBg(status: TrafficLightStatus) {
  switch (status) {
    case 'green': return 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
    case 'yellow': return 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800'
    case 'red': return 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
    default: return 'bg-slate-50 border-slate-200 dark:bg-slate-900 dark:border-slate-700'
  }
}

function getStatusLabel(status: TrafficLightStatus) {
  switch (status) {
    case 'green': return 'On Track'
    case 'yellow': return 'At Risk'
    case 'red': return 'Off Track'
    default: return 'No Data'
  }
}

function TeamHeatMap({ data }: { data: TeamStatus[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Prefetch team pages on mount
  useEffect(() => {
    data.forEach(team => {
      router.prefetch(`/teams/${team.teamId}`)
    })
  }, [data, router])
  
  const stats = useMemo(() => {
    const total = data.length || 1
    const byStatus = data.reduce<Record<TrafficLightStatus, number>>(
      (acc, item) => {
        acc[item.status] = (acc[item.status] || 0) + 1
        return acc
      },
      { green: 0, yellow: 0, red: 0, gray: 0 }
    )
    const avg = Math.round(data.reduce((sum, t) => sum + (t.progress || 0), 0) / total)
    return { byStatus, avg }
  }, [data])

  const handleTeamClick = (teamId: string) => {
    startTransition(() => {
      router.push(`/teams/${teamId}`)
    })
  }

  return (
    <div className="space-y-6">
      {/* Summary row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-green-500" />
          <span className="text-muted-foreground">On Track</span>
          <span className="font-semibold">{stats.byStatus.green}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-amber-500" />
          <span className="text-muted-foreground">At Risk</span>
          <span className="font-semibold">{stats.byStatus.yellow}</span>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <div className="w-3 h-3 rounded-full bg-red-500" />
          <span className="text-muted-foreground">Off Track</span>
          <span className="font-semibold">{stats.byStatus.red}</span>
        </div>
      </div>

      {/* Team grid - PRD: Grid or list view with traffic light colors */}
      <div className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", isPending && "opacity-70 pointer-events-none")}>
        {data.map((team) => (
          <button
            key={team.teamId}
            onClick={() => handleTeamClick(team.teamId)}
            className={cn(
              'group text-left rounded-lg border-2 p-4 transition-all duration-150',
              'hover:shadow-md hover:-translate-y-0.5 cursor-pointer active:scale-[0.98]',
              getStatusBg(team.status)
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className={cn('w-2.5 h-2.5 rounded-full', getStatusColor(team.status))} />
                <span className="font-semibold">{team.teamName}</span>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            
            {/* PRD format: Team – Progress% (Status) */}
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold">{team.progress}%</span>
              <span className={cn(
                'text-xs font-medium px-2 py-0.5 rounded-full',
                team.status === 'green' && 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300',
                team.status === 'yellow' && 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300',
                team.status === 'red' && 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300',
                team.status === 'gray' && 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              )}>
                {getStatusLabel(team.status)}
              </span>
            </div>

            {/* Progress bar */}
            <div className="mt-3 h-1.5 w-full rounded-full bg-black/5 dark:bg-white/10 overflow-hidden">
              <div
                className={cn('h-full rounded-full transition-all', getStatusColor(team.status))}
                style={{ width: `${team.progress}%` }}
              />
            </div>

            <div className="mt-2 text-xs text-muted-foreground">
              {team.objectiveCount} objectives · {team.memberCount} members
            </div>
          </button>
        ))}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
          <span>On Track ≥70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          <span>At Risk 30–69%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <XCircle className="w-3.5 h-3.5 text-red-600" />
          <span>Off Track &lt;30%</span>
        </div>
      </div>
    </div>
  )
}

function ProgressHeatMap({ data }: { data: KeyResultProgress[] }) {
  const weekLabels = useMemo(() => {
    const endDate = new Date()
    const startDate = subWeeks(endDate, 4)
    return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 })
      .map((week) => format(week, 'MMM d'))
  }, [])

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_repeat(5,_60px)] gap-2 mb-3 text-xs font-medium text-muted-foreground">
            <div>Key Result</div>
            {weekLabels.map((week, i) => (
              <div key={i} className="text-center">{week}</div>
            ))}
          </div>

          {/* Rows */}
          {data.map((kr) => (
            <div
              key={kr.keyResultId}
              className="grid grid-cols-[1fr_repeat(5,_60px)] gap-2 mb-2 py-3 border-b last:border-0"
            >
              <div>
                <p className="text-sm font-medium truncate">{kr.keyResultTitle}</p>
                <p className="text-xs text-muted-foreground truncate">{kr.ownerName}</p>
              </div>

              {kr.weeklyProgress.map((cell, i) => (
                <div
                  key={i}
                  className={cn(
                    'h-10 rounded flex items-center justify-center text-xs font-semibold border',
                    getStatusBg(cell.status)
                  )}
                  title={`${cell.value}% - ${getStatusLabel(cell.status)}`}
                >
                  {cell.value > 0 ? `${cell.value}%` : '-'}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-6 text-xs text-muted-foreground pt-2 border-t">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-green-100 border border-green-200" />
          <span>On Track ≥70%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-amber-100 border border-amber-200" />
          <span>At Risk 30–69%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-red-100 border border-red-200" />
          <span>Off Track &lt;30%</span>
        </div>
      </div>
    </div>
  )
}

export function HeatMap({ type, title, description, data, className }: HeatMapProps) {
  const fallback = type === 'teams' ? mockTeamData : mockProgressData
  const displayData = (data && data.length > 0 ? data : fallback)

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base">
          {title || (type === 'teams' ? 'Team Heatmap' : 'Weekly Progress')}
        </CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {type === 'teams' ? (
          <TeamHeatMap data={displayData as TeamStatus[]} />
        ) : (
          <ProgressHeatMap data={displayData as KeyResultProgress[]} />
        )}
      </CardContent>
    </Card>
  )
}
