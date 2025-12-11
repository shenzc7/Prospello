'use client'

import { useMemo, useState } from 'react'
import { CalendarClock, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { format, differenceInDays, startOfYear, endOfYear, parseISO, isAfter, isBefore } from 'date-fns'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Objective } from '@/hooks/useObjectives'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'

type TimelineItem = {
  id: string
  title: string
  start: Date
  end: Date
  progress: number
  status: string
  owner: string
}

function buildTimeline(objectives: Objective[]) {
  return objectives.map((objective) => ({
    id: objective.id,
    title: objective.title,
    start: parseISO(objective.startAt),
    end: parseISO(objective.endAt),
    progress: objective.progress,
    status: objective.status,
    owner: objective.owner.name ?? objective.owner.email,
  }))
}

function getDurationPercent(item: TimelineItem, yearStart: Date, yearEnd: Date) {
  const total = differenceInDays(yearEnd, yearStart) || 1
  const startOffset = Math.max(0, differenceInDays(item.start, yearStart))
  const endOffset = Math.min(total, differenceInDays(item.end, yearStart))
  const width = Math.max(2, ((endOffset - startOffset) / total) * 100)
  const left = (startOffset / total) * 100
  return { width, left }
}

export function TimelineView({
  objectives,
  isLoading,
  fromDate,
  toDate,
}: {
  objectives: Objective[]
  isLoading?: boolean
  fromDate?: string
  toDate?: string
}) {
  const [mode, setMode] = useState<'quarterly' | 'yearly'>('quarterly')
  const [yearOffset, setYearOffset] = useState(0)

  const timelineItems = useMemo(() => buildTimeline(objectives), [objectives])
  const currentYear = new Date().getFullYear() + yearOffset
  const yearStart = startOfYear(new Date(currentYear, 0, 1))
  const yearEnd = endOfYear(new Date(currentYear, 11, 31))

  const items = useMemo(() => {
    if (mode === 'yearly') {
      return timelineItems.filter((item) => item.start.getFullYear() === currentYear || item.end.getFullYear() === currentYear)
    }
    // Quarterly: filter by current year and group by quarter label on render
    return timelineItems.filter((item) => item.start.getFullYear() === currentYear || item.end.getFullYear() === currentYear)
  }, [mode, timelineItems, currentYear])

  const filteredItems = useMemo(() => {
    let filtered = items
    if (fromDate) {
      const from = new Date(fromDate)
      filtered = filtered.filter((item) => !isBefore(item.end, from))
    }
    if (toDate) {
      const to = new Date(toDate)
      filtered = filtered.filter((item) => !isAfter(item.start, to))
    }
    return filtered
  }, [items, fromDate, toDate])

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
          <CardDescription>Quarterly / yearly OKR schedule</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-16 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            Timeline View
          </CardTitle>
          <CardDescription>Quarterly / yearly OKR schedule with progress</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border">
            <button
              className={`px-3 py-1 text-sm ${mode === 'quarterly' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setMode('quarterly')}
            >
              Quarterly
            </button>
            <button
              className={`px-3 py-1 text-sm ${mode === 'yearly' ? 'bg-primary text-primary-foreground' : ''}`}
              onClick={() => setMode('yearly')}
            >
              Yearly
            </button>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border px-2 py-1 text-sm">
            <button aria-label="Previous year" onClick={() => setYearOffset((v) => v - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span>{currentYear}</span>
            <button aria-label="Next year" onClick={() => setYearOffset((v) => v + 1)}>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredItems.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            No objectives scheduled for {currentYear}.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => {
              const duration = getDurationPercent(item, yearStart, yearEnd)
              const traffic = calculateTrafficLightStatus(item.progress)
              const trafficClasses = getTrafficLightClasses(traffic)
              const quarterLabel = `Q${Math.floor(item.start.getMonth() / 3) + 1}`
              return (
                <div key={item.id} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {mode === 'quarterly' ? quarterLabel : format(item.start, 'MMM d, yyyy')} → {format(item.end, 'MMM d, yyyy')} • {item.owner}
                      </p>
                    </div>
                    <Badge className={`${trafficClasses.bg} ${trafficClasses.text} border ${trafficClasses.border}`}>
                      {Math.round(item.progress)}%
                    </Badge>
                  </div>
                  <div className="relative mt-3 h-3 rounded-full bg-muted">
                    <div
                      className="absolute top-0 h-3 rounded-full bg-primary"
                      style={{ left: `${duration.left}%`, width: `${duration.width}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Start: {format(item.start, 'MMM d')}</span>
                    <span>End: {format(item.end, 'MMM d')}</span>
                  </div>
                  <div className="mt-2">
                    <Progress value={item.progress} className="h-1.5" />
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
