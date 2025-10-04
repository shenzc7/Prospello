'use client'

import { useMemo } from 'react'
import { format, startOfWeek, endOfWeek, eachWeekOfInterval, subWeeks, isWithinInterval } from 'date-fns'
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/ui'

type HeatMapCell = {
  value: number
  status: 'green' | 'yellow' | 'red' | 'gray'
  date?: Date
  checkInId?: string
}

type TeamStatus = {
  teamId: string
  teamName: string
  progress: number
  status: 'green' | 'yellow' | 'red' | 'gray'
  objectiveCount: number
  memberCount: number
}

type KeyResultProgress = {
  keyResultId: string
  keyResultTitle: string
  objectiveTitle: string
  ownerName: string
  weeklyProgress: HeatMapCell[]
}

type HeatMapProps = {
  type: 'teams' | 'progress'
  title?: string
  description?: string
  data?: TeamStatus[] | KeyResultProgress[]
  className?: string
}

// Mock data for demonstration
const mockTeamData: TeamStatus[] = [
  {
    teamId: '1',
    teamName: 'Engineering',
    progress: 85,
    status: 'green',
    objectiveCount: 12,
    memberCount: 8
  },
  {
    teamId: '2',
    teamName: 'Product',
    progress: 65,
    status: 'yellow',
    objectiveCount: 8,
    memberCount: 5
  },
  {
    teamId: '3',
    teamName: 'Marketing',
    progress: 45,
    status: 'red',
    objectiveCount: 6,
    memberCount: 4
  },
  {
    teamId: '4',
    teamName: 'Sales',
    progress: 78,
    status: 'green',
    objectiveCount: 10,
    memberCount: 6
  },
  {
    teamId: '5',
    teamName: 'Design',
    progress: 92,
    status: 'green',
    objectiveCount: 7,
    memberCount: 3
  }
]

const mockProgressData: KeyResultProgress[] = [
  {
    keyResultId: '1',
    keyResultTitle: 'API Response Time < 200ms',
    objectiveTitle: 'Improve API Performance',
    ownerName: 'John Doe',
    weeklyProgress: [
      { value: 0, status: 'gray', date: subWeeks(new Date(), 4) },
      { value: 25, status: 'yellow', date: subWeeks(new Date(), 3) },
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
      { value: 65, status: 'green', date: subWeeks(new Date(), 4) },
      { value: 68, status: 'green', date: subWeeks(new Date(), 3) },
      { value: 72, status: 'green', date: subWeeks(new Date(), 2) },
      { value: 75, status: 'green', date: subWeeks(new Date(), 1) },
      { value: 78, status: 'green', date: new Date() }
    ]
  }
]

function getStatusIcon(status: string, size = 'h-3 w-3') {
  switch (status) {
    case 'green':
      return <CheckCircle2 className={cn(size, 'text-green-600')} />
    case 'yellow':
      return <AlertTriangle className={cn(size, 'text-yellow-600')} />
    case 'red':
      return <XCircle className={cn(size, 'text-red-600')} />
    default:
      return <Clock className={cn(size, 'text-gray-400')} />
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case 'green':
      return 'bg-green-100 border-green-200 hover:bg-green-200'
    case 'yellow':
      return 'bg-yellow-100 border-yellow-200 hover:bg-yellow-200'
    case 'red':
      return 'bg-red-100 border-red-200 hover:bg-red-200'
    default:
      return 'bg-gray-100 border-gray-200 hover:bg-gray-200'
  }
}

function TeamHeatMap({ data }: { data: TeamStatus[] }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {data.map((team) => (
          <div
            key={team.teamId}
            className={cn(
              'flex items-center justify-between p-4 rounded-lg border-2 transition-colors cursor-pointer',
              getStatusColor(team.status)
            )}
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(team.status, 'h-5 w-5')}
              <div>
                <h4 className="font-semibold text-sm">{team.teamName}</h4>
                <p className="text-xs text-muted-foreground">
                  {team.objectiveCount} objectives • {team.memberCount} members
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold">{team.progress}%</div>
              <Badge variant="outline" className="text-xs">
                {team.status.toUpperCase()}
              </Badge>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-3 w-3 text-green-600" />
          <span>On Track (&ge;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-3 w-3 text-yellow-600" />
          <span>At Risk (30-69%)</span>
        </div>
        <div className="flex items-center gap-2">
          <XCircle className="h-3 w-3 text-red-600" />
          <span>Off Track (&lt;30%)</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="h-3 w-3 text-gray-400" />
          <span>No Data</span>
        </div>
      </div>
    </div>
  )
}

function ProgressHeatMap({ data }: { data: KeyResultProgress[] }) {
  // Generate week labels for the last 5 weeks
  const weekLabels = useMemo(() => {
    const endDate = new Date()
    const startDate = subWeeks(endDate, 4)
    return eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 })
      .map(week => format(week, 'MMM d'))
  }, [])

  return (
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="min-w-[600px]">
          {/* Header */}
          <div className="grid grid-cols-[250px_repeat(5,_1fr)] gap-2 mb-4">
            <div className="text-xs font-medium text-muted-foreground">Key Results</div>
            {weekLabels.map((week, index) => (
              <div key={index} className="text-xs font-medium text-muted-foreground text-center">
                {week}
              </div>
            ))}
          </div>

          {/* Rows */}
          {data.map((kr) => (
            <div key={kr.keyResultId} className="grid grid-cols-[250px_repeat(5,_1fr)] gap-2 mb-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
              <div className="space-y-1">
                <h4 className="text-sm font-medium leading-tight">{kr.keyResultTitle}</h4>
                <p className="text-xs text-muted-foreground">{kr.objectiveTitle}</p>
                <p className="text-xs text-muted-foreground">by {kr.ownerName}</p>
              </div>

              {kr.weeklyProgress.map((cell, index) => (
                <div
                  key={index}
                  className={cn(
                    'aspect-square rounded border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110',
                    getStatusColor(cell.status)
                  )}
                  title={`${cell.value}% - ${cell.status.toUpperCase()}`}
                >
                  <span className="text-xs font-bold">{cell.value}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-center gap-6 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 bg-green-100 border-green-200"></div>
          <span>On Track (&ge;70%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 bg-yellow-100 border-yellow-200"></div>
          <span>At Risk (30-69%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 bg-red-100 border-red-200"></div>
          <span>Off Track (&lt;30%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded border-2 bg-gray-100 border-gray-200"></div>
          <span>No Check-in</span>
        </div>
      </div>
    </div>
  )
}

export function HeatMap({
  type,
  title,
  description,
  data,
  className
}: HeatMapProps) {
  const displayData = data || (type === 'teams' ? mockTeamData : mockProgressData)

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
          {title || (type === 'teams' ? 'Team Status Heat Map' : 'Progress Heat Map')}
        </CardTitle>
        <CardDescription>
          {description || (type === 'teams'
            ? 'Real-time overview of team performance and objective status'
            : 'Weekly progress tracking for key results over time'
          )}
        </CardDescription>
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
