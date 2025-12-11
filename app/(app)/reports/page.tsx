'use client'

import { useMemo, useState } from 'react'
import { FileText, FileSpreadsheet, TrendingUp, Target, Filter } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useObjectives } from '@/hooks/useObjectives'
import { TimelineView } from '@/components/analytics/TimelineView'
import { useCheckInSummary } from '@/hooks/useCheckInSummary'
import { AlignmentTree } from '@/components/analytics/AlignmentTree'
import { DateRangePicker } from '@/components/ui/date-range-picker'
import type { AlignmentNode } from '@/lib/checkin-summary'

function ExportSection() {
  const [downloading, setDownloading] = useState(false)
  const { data } = useObjectives({ limit: 200 })
  const objectives = data?.objectives ?? []

  const exportCsvClient = () => {
    const headers = ['Title', 'Owner', 'Cycle', 'Status', 'Progress']
    const rows = objectives.map((obj) => [
      `"${obj.title.replace(/"/g, '""')}"`,
      `"${obj.owner.name ?? obj.owner.email}"`,
      `"${obj.cycle}"`,
      obj.status,
      `${obj.progress}%`,
    ])
    const csv = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'okr-report.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  const downloadFromApi = async (format: 'pdf' | 'xlsx' | 'csv') => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/reports/export?format=${format}`)
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Failed to export report')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `okr-report.${format === 'xlsx' ? 'xlsx' : format}`
      link.click()
      URL.revokeObjectURL(url)
      toast.success(`Downloaded ${format.toUpperCase()} report`)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unable to download report'
      toast.error(message)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Reports</CardTitle>
        <CardDescription>Download OKR reports in various formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={() => downloadFromApi('pdf')} disabled={downloading}>
            <FileText className="h-4 w-4" />
            Download PDF
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={() => downloadFromApi('xlsx')} disabled={downloading}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel Export
          </Button>
          <Button variant="secondary" className="flex items-center gap-2" onClick={exportCsvClient} disabled={downloading}>
            <FileSpreadsheet className="h-4 w-4" />
            Quick CSV
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Exports include title, owner, cycle, status, progress, and key results for visible objectives.
        </p>
      </CardContent>
    </Card>
  )
}

type TrendRow = { period: string; completion: number; delta: number }

function TrendAnalysis({ trends }: { trends: TrendRow[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          OKR Completion Trends
        </CardTitle>
        <CardDescription>Historical completion rates by quarter</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {trends.map((trend) => (
            <div key={trend.period} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="text-sm font-medium">{trend.period}</div>
                <Badge variant="outline">{trend.completion}%</Badge>
              </div>
              <div className={`text-sm font-medium ${trend.delta >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {trend.delta >= 0 ? '+' : ''}
                {trend.delta}%
              </div>
            </div>
          ))}
          {trends.length === 0 && (
            <p className="text-sm text-muted-foreground">No trend data yet.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function AlignmentVisualization({ nodes, isLoading }: { nodes?: AlignmentNode[]; isLoading?: boolean }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Alignment Overview
        </CardTitle>
        <CardDescription>Goal cascade from company to individual level</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AlignmentTree nodes={nodes ?? []} isLoading={isLoading} />
        <div className="p-4 bg-muted/20 rounded-lg">
          <p className="text-sm text-muted-foreground">
            <strong>Legend:</strong> Green ≥70%, Yellow 30-69%, Red &lt;30%
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Expand objectives to see how goals cascade from company → team → individual level
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

function CompletionAnalytics({
  total,
  completed,
  avgProgress,
  atRisk,
}: {
  total: number
  completed: number
  avgProgress: number
  atRisk: number
}) {
  const analytics = [
    { label: 'Total Objectives', value: total.toString(), helper: 'Across all scopes' },
    { label: 'Completed', value: completed.toString(), helper: 'Marked as done' },
    { label: 'Average Progress', value: `${avgProgress}%`, helper: 'Weighted across KRs' },
    { label: 'At Risk', value: atRisk.toString(), helper: 'Needs attention' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {analytics.map((item) => (
        <Card key={item.label}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{item.label}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{item.value}</div>
            <p className="text-xs text-muted-foreground">{item.helper}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function ReportsPage() {
  const [selectedQuarter, setSelectedQuarter] = useState('Q4-2024')
  const [cycleFilter, setCycleFilter] = useState<string>('all')
  const [fromDate, setFromDate] = useState<string>('')
  const [toDate, setToDate] = useState<string>('')
  const { data, isLoading } = useObjectives({
    limit: 200,
    cycle: cycleFilter === 'all' ? undefined : cycleFilter,
  })
  const { data: summary, isLoading: summaryLoading } = useCheckInSummary()
  const objectives = useMemo(() => data?.objectives ?? [], [data?.objectives])
  const completionRate = objectives.length
    ? Math.round((objectives.filter((o) => o.status === 'DONE').length / objectives.length) * 100)
    : 0
  const completedCount = objectives.filter((o) => o.status === 'DONE').length
  const avgProgress = objectives.length
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
    : 0
  const atRiskCount = objectives.filter((o) => o.status === 'AT_RISK').length
  const cycles = useMemo(() => Array.from(new Set(objectives.map((o) => o.cycle))).sort(), [objectives])
  const trends = useMemo(() => {
    const map = new Map<string, { total: number; done: number; progressSum: number; start?: number }>()
    objectives.forEach((obj) => {
      const key = obj.cycle || `Q${obj.fiscalQuarter}`
      const start = obj.startAt ? new Date(obj.startAt).getTime() : Date.now()
      const existing = map.get(key) || { total: 0, done: 0, progressSum: 0, start }
      existing.total += 1
      existing.done += obj.status === 'DONE' ? 1 : 0
      existing.progressSum += obj.progress || 0
      existing.start = existing.start ? Math.min(existing.start, start) : start
      map.set(key, existing)
    })
    const entries = Array.from(map.entries()).sort((a, b) => (a[1].start ?? 0) - (b[1].start ?? 0))
    return entries.map(([period, value], idx) => {
      const completion = value.total ? Math.round((value.done / value.total) * 100) : 0
      const prev = entries[idx - 1]?.[1]
      const prevCompletion = prev && prev.total ? Math.round((prev.done / prev.total) * 100) : completion
      return { period, completion, delta: completion - prevCompletion }
    })
  }, [objectives])

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Reports & Analytics
          </h1>
          <p className="text-muted-foreground">
            Track progress, analyze trends, and export OKR reports
          </p>
        </div>
        <div className="flex items-center gap-2">
          <DateRangePicker
            from={fromDate}
            to={toDate}
            onChange={(from, to) => {
              setFromDate(from ?? '')
              setToDate(to ?? '')
            }}
          />
          <Select value={selectedQuarter} onValueChange={setSelectedQuarter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q4-2024">Q4 2024</SelectItem>
              <SelectItem value="Q3-2024">Q3 2024</SelectItem>
              <SelectItem value="Q2-2024">Q2 2024</SelectItem>
              <SelectItem value="Q1-2024">Q1 2024</SelectItem>
            </SelectContent>
          </Select>
          <Select value={cycleFilter} onValueChange={setCycleFilter}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All cycles</SelectItem>
              {cycles.map((cycle) => (
                <SelectItem key={cycle} value={cycle}>{cycle}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="card-spotlight">
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Reporting console</p>
            <h2 className="text-xl font-semibold text-foreground">Quarterly performance overview</h2>
            <p className="text-sm text-muted-foreground">
              Export PDF & Excel, view alignment map, and analyze completion trends.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3 sm:min-w-[320px]">
            <div className="rounded-xl border border-border/60 bg-card/70 p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Completion</p>
              <p className="text-xl font-bold text-foreground">{completionRate}%</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Avg progress</p>
              <p className="text-xl font-bold text-foreground">{avgProgress}%</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 p-3 text-center">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">At risk</p>
              <p className="text-xl font-bold text-destructive">{atRiskCount}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics Overview */}
      <CompletionAnalytics
        total={objectives.length}
        completed={completedCount}
        avgProgress={avgProgress}
        atRisk={atRiskCount}
      />

      <TimelineView objectives={objectives} isLoading={isLoading} fromDate={fromDate} toDate={toDate} />

      {/* Main Content */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="alignment">Alignment</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis trends={trends} />
        </TabsContent>

        <TabsContent value="alignment" className="space-y-6">
          <AlignmentVisualization nodes={summary?.alignment} isLoading={summaryLoading} />
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <ExportSection />
        </TabsContent>
      </Tabs>
    </div>
  )
}
