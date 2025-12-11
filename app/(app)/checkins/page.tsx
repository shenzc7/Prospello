'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { formatDistanceToNow } from 'date-fns'
import { ArrowLeft, Calendar, TrendingUp, CheckCircle2, BarChart3, AlertTriangle, Gauge, Download } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeatMap } from '@/components/analytics/HeatMap'
import { AlignmentTree } from '@/components/analytics/AlignmentTree'
import { Badge } from '@/components/ui/badge'
import { useCheckInSummary } from '@/hooks/useCheckInSummary'
import type { CheckInSummary, HeroSummary } from '@/lib/checkin-summary'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { maybeHandleDemoRequest } from '@/lib/demo/api'

type RecentCheckIn = CheckInSummary['recentCheckIns'][number]

function getStatusIcon(status: RecentCheckIn['status']) {
  const normalized = status.toLowerCase()
  switch (normalized) {
    case 'green':
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    case 'yellow':
      return <TrendingUp className="h-4 w-4 text-yellow-600" />
    default:
      return <AlertTriangle className="h-4 w-4 text-red-600" />
  }
}

function SummaryGauge({ hero }: { hero?: HeroSummary }) {
  const progress = hero?.avgProgress ?? 0
  const score = hero?.scoreAverage ?? 0

  return (
    <Card className="h-full bg-gradient-to-br from-emerald-50 via-white to-cyan-50 dark:from-slate-900 dark:to-slate-900/60">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Gauge className="h-5 w-5 text-emerald-600" />
          Cycle health
        </CardTitle>
        <CardDescription>Real progress from latest check-ins and scoring</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" strokeWidth="10" className="text-muted-foreground/15" stroke="currentColor" fill="none" />
            <circle
              cx="50"
              cy="50"
              r="42"
              strokeWidth="10"
              stroke="currentColor"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 42}`}
              strokeDashoffset={`${2 * Math.PI * 42 * (1 - progress / 100)}`}
              className="text-emerald-500 transition-all duration-700"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-2xl font-bold">{progress}%</div>
              <div className="text-xs text-muted-foreground">Avg progress</div>
            </div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-emerald-200/70 bg-white/80 p-3 text-sm shadow-sm dark:border-emerald-500/20 dark:bg-white/5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Completion</p>
            <p className="text-lg font-semibold">{hero?.completionRate ?? 0}%</p>
            <p className="text-xs text-muted-foreground">Objectives marked done</p>
          </div>
          <div className="rounded-xl border border-cyan-200/70 bg-white/80 p-3 text-sm shadow-sm dark:border-cyan-500/20 dark:bg-white/5">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Score</p>
            <p className="text-lg font-semibold">{score.toFixed(2)}</p>
            <p className="text-xs text-muted-foreground">0.0–1.0 automated scoring</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function WeeklyCheckIns({ items, isLoading }: { items?: RecentCheckIn[]; isLoading: boolean }) {
  const rows = items ?? []
  return (
    <div className="space-y-4">
      {isLoading ? (
        Array.from({ length: 3 }).map((_, idx) => (
          <Card key={idx} className="animate-pulse">
            <CardContent className="p-4 space-y-3">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-4 w-1/2 rounded bg-muted" />
              <div className="h-3 w-1/3 rounded bg-muted" />
            </CardContent>
          </Card>
        ))
      ) : rows.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-sm text-muted-foreground">
            No check-ins yet. Log a traffic-light update to light up this view.
          </CardContent>
        </Card>
      ) : (
        rows.map((checkIn) => {
          const statusClasses = getTrafficLightClasses(calculateTrafficLightStatus(checkIn.value))
          return (
            <Card key={checkIn.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(checkIn.status)}
                      <h4 className="font-medium leading-tight">{checkIn.keyResultTitle}</h4>
                      <Badge variant="outline" className="text-xs">
                        {Math.round(checkIn.value)}%
                      </Badge>
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusClasses.bg} ${statusClasses.border} ${statusClasses.text}`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-current" />
                        {checkIn.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {checkIn.objectiveTitle} • {checkIn.ownerName}
                    </p>
                    {checkIn.comment ? <p className="text-sm">{checkIn.comment}</p> : null}
                  </div>
                  <div className="text-right text-xs text-muted-foreground min-w-[110px]">
                    {formatDistanceToNow(new Date(checkIn.weekStart), { addSuffix: true })}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })
      )}
    </div>
  )
}

function CheckInAnalytics({
  heatmap,
  hero,
  isLoading,
}: {
  heatmap?: CheckInSummary['heatmap']
  hero?: HeroSummary
  isLoading: boolean
}) {
  const progressHeatmap = useMemo(() => heatmap ?? [], [heatmap])
  const loading = isLoading && progressHeatmap.length === 0

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Check-in Analytics</h3>
        <p className="text-sm text-muted-foreground">Weekly engagement and scoring over the last 5 weeks</p>
      </div>

      {loading ? (
        <Card className="border">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading heatmap…</CardContent>
        </Card>
      ) : (
        <HeatMap
          type="progress"
          title="Progress Heat Map"
          description="Live KR momentum from weekly check-ins"
          data={progressHeatmap}
          className="border"
        />
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completion rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hero?.completionRate ?? 0}%</div>
            <p className="text-xs text-muted-foreground">Objectives marked done</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Average score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(hero?.scoreAverage ?? 0).toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">0.0 – 1.0 automated scoring</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Objectives covered</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{hero?.objectiveCount ?? 0}</div>
            <p className="text-xs text-muted-foreground">Included in this summary</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckinsPage() {
  const router = useRouter()
  const { data, isLoading, isError } = useCheckInSummary()
  const weeklySummary = data?.weeklySummary ?? { onTrack: 0, atRisk: 0, offTrack: 0, dueThisWeek: 0 }

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    try {
      const demoPayload = maybeHandleDemoRequest('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, scope: 'weekly-checkins' }),
      })
      if (demoPayload !== null) {
        throw new Error('Demo mode is read-only. Export available outside demo.')
      }
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, scope: 'weekly-checkins' }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Export failed')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `checkins.${format === 'xlsx' ? 'xlsx' : 'pdf'}`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${format.toUpperCase()} export`)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unable to start export'
      toast.error(message)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-right">
          <h1 className="text-2xl font-bold">Check-ins & Progress</h1>
          <p className="text-sm text-muted-foreground">
            Real check-ins, scoring, and exports per PRD
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <SummaryGauge hero={data?.hero} />

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              Actions & reminders
            </CardTitle>
            <CardDescription>Keep weekly check-ins on track</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full" variant="secondary">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Check-in
            </Button>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button variant="outline" className="w-full" onClick={() => handleExport('pdf')}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleExport('xlsx')}>
                <BarChart3 className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Weekly check-ins use a green / yellow / red traffic light to capture momentum and risks.
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="card-spotlight border-primary/30">
        <CardHeader>
          <CardTitle>Weekly health</CardTitle>
          <CardDescription>Who is on track, at risk, or off track this week</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">On Track</p>
            <p className="text-2xl font-bold text-green-700">{weeklySummary.onTrack}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">At Risk</p>
            <p className="text-2xl font-bold text-amber-700">{weeklySummary.atRisk}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">Off Track</p>
            <p className="text-2xl font-bold text-red-700">{weeklySummary.offTrack}</p>
          </div>
          <div className="rounded-xl border border-border/70 bg-card/70 p-3">
            <p className="text-xs text-muted-foreground">Due this week</p>
            <p className="text-2xl font-bold text-primary">{weeklySummary.dueThisWeek}</p>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="checkins" className="space-y-6">
        <TabsList>
          <TabsTrigger value="checkins" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Check-ins
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress Analytics
          </TabsTrigger>
          <TabsTrigger value="alignment" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Alignment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins">
          <WeeklyCheckIns items={data?.recentCheckIns} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="analytics">
          <CheckInAnalytics heatmap={data?.heatmap} hero={data?.hero} isLoading={isLoading} />
        </TabsContent>

        <TabsContent value="alignment">
          <Card>
            <CardHeader>
              <CardTitle>Company → Team → Individual</CardTitle>
              <CardDescription>Live alignment tree from your objectives</CardDescription>
            </CardHeader>
            <CardContent>
              <AlignmentTree nodes={data?.alignment ?? []} isLoading={isLoading} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {isError ? (
        <Card>
          <CardContent className="p-4 text-sm text-destructive">Unable to load check-in data. Please refresh.</CardContent>
        </Card>
      ) : null}
    </div>
  )
}
