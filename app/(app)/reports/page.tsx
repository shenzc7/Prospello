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
import { Input } from '@/components/ui/input'
import { useCheckInSummary } from '@/hooks/useCheckInSummary'
import { AlignmentTree } from '@/components/analytics/AlignmentTree'
import type { AlignmentNode } from '@/lib/checkin-summary'

function ExportSection() {
  const { data } = useObjectives({ limit: 200 })
  const objectives = data?.objectives ?? []

  const exportCsv = () => {
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

  const queueBackendExport = async (format: 'pdf' | 'xlsx') => {
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, scope: 'reports' }),
      })
      const body = await res.json()
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error?.msg || 'Failed to queue export')
      }
      const exportId = body.data?.export?.id ?? 'export'
      toast.success(`Queued ${format.toUpperCase()} export (${exportId})`)
    } catch (error: any) {
      toast.error(error?.message || 'Unable to queue export')
    }
  }

  const exportPrintPdf = () => {
    const win = window.open('', '_blank', 'width=900,height=700')
    if (!win) return
    const rows = objectives.map(
      (obj) =>
        `<tr><td>${obj.title}</td><td>${obj.owner.name ?? obj.owner.email}</td><td>${obj.cycle}</td><td>${obj.status}</td><td>${obj.progress}%</td></tr>`
    ).join('')
    win.document.write(`
      <html>
        <head><title>OKR Report</title></head>
        <body>
          <h2>OKR Report</h2>
          <table border="1" cellspacing="0" cellpadding="6" style="width:100%; border-collapse:collapse; font-family:Arial, sans-serif; font-size:12px;">
            <thead><tr><th>Title</th><th>Owner</th><th>Cycle</th><th>Status</th><th>Progress</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    win.document.close()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Reports</CardTitle>
        <CardDescription>Download OKR reports in various formats</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex items-center gap-2" onClick={exportPrintPdf}>
            <FileText className="h-4 w-4" />
            PDF Report
          </Button>
          <Button variant="outline" className="flex items-center gap-2" onClick={exportCsv}>
            <FileSpreadsheet className="h-4 w-4" />
            Excel Export
          </Button>
          <Button variant="secondary" className="flex items-center gap-2" onClick={() => queueBackendExport('pdf')}>
            <FileText className="h-4 w-4" />
            Queue PDF (API)
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Exports include title, owner, cycle, status, and progress for all visible objectives.
        </p>
      </CardContent>
    </Card>
  )
}

function TrendAnalysis() {
  const trends = [
    {
      period: 'Q4 2024',
      completion: 78,
      trend: '+5%',
      color: 'text-green-600'
    },
    {
      period: 'Q3 2024',
      completion: 73,
      trend: '+12%',
      color: 'text-green-600'
    },
    {
      period: 'Q2 2024',
      completion: 61,
      trend: '-3%',
      color: 'text-red-600'
    },
    {
      period: 'Q1 2024',
      completion: 64,
      trend: '+8%',
      color: 'text-green-600'
    }
  ]

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
              <div className={`text-sm font-medium ${trend.color}`}>
                {trend.trend}
              </div>
            </div>
          ))}
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

function CompletionAnalytics() {
  const analytics = [
    { label: 'Total Objectives', value: '47', change: '+12%' },
    { label: 'Completed This Quarter', value: '23', change: '+8%' },
    { label: 'Average Completion Time', value: '6.2 weeks', change: '-2 days' },
    { label: 'On-Time Delivery Rate', value: '78%', change: '+5%' }
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
            <p className="text-xs text-muted-foreground">{item.change} from last quarter</p>
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
  const objectives = data?.objectives ?? []
  const completionRate = objectives.length
    ? Math.round((objectives.filter((o) => o.status === 'DONE').length / objectives.length) * 100)
    : 0
  const avgProgress = objectives.length
    ? Math.round(objectives.reduce((sum, o) => sum + o.progress, 0) / objectives.length)
    : 0
  const atRiskCount = objectives.filter((o) => o.status === 'AT_RISK').length
  const cycles = useMemo(() => Array.from(new Set(objectives.map((o) => o.cycle))).sort(), [objectives])

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
          <div className="hidden md:flex items-center gap-2 rounded-lg border px-3 py-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="h-8 w-36"
              aria-label="From date"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="h-8 w-36"
              aria-label="To date"
            />
          </div>
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
      <CompletionAnalytics />

      <TimelineView objectives={objectives} isLoading={isLoading} fromDate={fromDate} toDate={toDate} />

      {/* Main Content */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trends">Trend Analysis</TabsTrigger>
          <TabsTrigger value="alignment">Alignment</TabsTrigger>
          <TabsTrigger value="export">Export</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <TrendAnalysis />
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
