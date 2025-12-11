'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { format, startOfQuarter, endOfQuarter } from 'date-fns'
import {
  Users,
  PlayCircle,
  AlertTriangle,
  Bell,
  Shield,
  Gauge,
  BarChart3,
  CloudDownload,
  CheckCircle2,
  Target,
  Activity,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { isFeatureEnabled } from '@/config/features'
import { useDemoMode } from '@/components/demo/DemoProvider'
import { useObjectives } from '@/hooks/useObjectives'
import { HeatMap } from '@/components/analytics/HeatMap'
import { useCheckInSummary } from '@/hooks/useCheckInSummary'
import { AlignmentTree } from '@/components/analytics/AlignmentTree'
import { NotificationsFeed } from '@/components/productivity/NotificationsFeed'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'

function StatCard({ title, value, description, icon }: { title: string; value: string; description: string; icon: React.ReactNode }) {
  return (
    <Card className="shadow-card">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="text-muted-foreground">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  )
}

export default function AdminPage() {
  const { data: session } = useSession()
  const role = session?.user?.role
  const { enabled: demoEnabled } = useDemoMode()
  const isAdmin = role === 'ADMIN' || demoEnabled
  const { toast } = useToast()
  const [cycle, setCycle] = useState('Q4 2024')
  const [isScoring, setIsScoring] = useState(false)
  const featuresDisabled = !isFeatureEnabled('adminExtras')

  const { data: objectivesData, isLoading: objectivesLoading } = useObjectives({}, { enabled: isAdmin })
  const objectives = useMemo(() => objectivesData?.objectives ?? [], [objectivesData?.objectives])

  const { data: checkInSummary } = useCheckInSummary(isAdmin)

  const hero = useMemo(() => {
    const total = objectives.length
    const avgProgress = total ? Math.round(objectives.reduce((s, o) => s + (o.progress ?? 0), 0) / total) : 0
    const atRisk = objectives.filter((o) => o.status === 'AT_RISK').length
    const done = objectives.filter((o) => o.status === 'DONE').length
    const status = calculateTrafficLightStatus(avgProgress)
    const classes = getTrafficLightClasses(status)
    const quarterStart = startOfQuarter(new Date())
    const quarterEnd = endOfQuarter(new Date())
    const quarterPct = Math.round(((Date.now() - quarterStart.getTime()) / (quarterEnd.getTime() - quarterStart.getTime())) * 100)
    return { total, avgProgress, atRisk, done, status, classes, quarterStart, quarterEnd, quarterPct }
  }, [objectives])

  const topAtRisk = useMemo(
    () => objectives.filter((o) => o.status === 'AT_RISK').slice(0, 5),
    [objectives]
  )

  const teamHeatmap = checkInSummary?.teamHeatmap
  const alignment = checkInSummary?.alignment

  const handleFinalizeScores = async () => {
    try {
      if (demoEnabled) {
        toast({
          title: 'Demo mode',
          description: 'Scoring is simulated in demo mode.',
        })
        return
      }
      setIsScoring(true)
      const res = await fetch(`/api/cron/scoring?cycle=${encodeURIComponent(cycle)}`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('Failed to finalize scores')

      const data = await res.json()
      toast({
        title: 'Scores Finalized',
        description: data.message,
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to finalize scores'
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      })
    } finally {
      setIsScoring(false)
    }
  }

  const handleExport = async (format: 'pdf' | 'xlsx') => {
    try {
      if (demoEnabled) {
        toast({ title: 'Demo mode', description: 'Exports disabled in demo.' })
        return
      }
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format, scope: 'admin-report' }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Export failed')
      }
      toast({ title: 'Export started', description: `${format.toUpperCase()} generation kicked off.` })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to export'
      toast({ title: 'Export failed', description: message, variant: 'destructive' })
    }
  }

  if (featuresDisabled) {
    return (
      <div className="space-y-3">
        <h1 className="text-2xl font-bold">Admin features are disabled</h1>
        <p className="text-sm text-muted-foreground">
          This release is scoped to the PRD only. Admin dashboards and cycle controls will return in a future update.
        </p>
        <Link href="/" className="text-sm text-primary underline">Back to dashboard</Link>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Access restricted to Admins. Please contact an admin to update roles or cycles.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <ShieldCheck className="h-4 w-4" />
            Admin Control Center
          </div>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">Company OKRs, roles, cycles, and exports</p>
          {demoEnabled && (
            <p className="text-xs text-primary mt-1">Demo mode: read-only showcase with seeded admin data.</p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/users">
            <Button variant="secondary" className="gap-2">
              <Users className="h-4 w-4" />
              Manage Users
            </Button>
          </Link>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
            <CloudDownload className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2" onClick={() => handleExport('xlsx')}>
            <CloudDownload className="h-4 w-4" />
            Export Excel
          </Button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <Card className="bg-gradient-to-r from-primary/5 via-primary/10 to-transparent border-primary/30">
          <CardHeader className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Company OKRs</p>
                <CardTitle className="text-2xl font-bold">Health Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  PRD: Within 30s know status, risks, and personal actions.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border px-3 py-1 text-xs font-semibold">Cycle: {cycle}</span>
              </div>
            </div>
            <div className="grid gap-6 md:grid-cols-[1.1fr_1fr]">
              <div className="flex items-center gap-6">
                <div className="relative">
                  <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="8" fill="none" className="text-muted-foreground/20" />
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      stroke="currentColor"
                      strokeWidth="8"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${2 * Math.PI * 40 * (1 - (hero.avgProgress || 0) / 100)}`}
                      className="text-primary transition-all duration-700"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold">{hero.avgProgress}%</span>
                  </div>
                </div>
                <div className="space-y-2">
                <div className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${hero.classes.bg} ${hero.classes.border} ${hero.classes.text}`}>
                  <span className={`h-2 w-2 rounded-full bg-current`}></span>
                  {hero.status.toUpperCase()}
                </div>
                  <div className="text-sm text-muted-foreground">
                    {hero.total} active objectives • {hero.done} completed • {hero.atRisk} at risk
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Quarter timeline: {format(hero.quarterStart, 'MMM d')} – {format(hero.quarterEnd, 'MMM d')}
                  </div>
                  <Progress value={hero.quarterPct} className="h-1.5" />
                  <p className="text-xs text-muted-foreground">{hero.quarterPct}% of quarter elapsed</p>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <StatCard title="Completion" value={`${hero.done}/${hero.total}`} description="Objectives marked DONE" icon={<CheckCircle2 className="h-4 w-4" />} />
                <StatCard title="At Risk" value={`${hero.atRisk}`} description="Needs attention" icon={<AlertTriangle className="h-4 w-4" />} />
                <StatCard title="Avg Progress" value={`${hero.avgProgress}%`} description="Weighted company-wide" icon={<Activity className="h-4 w-4" />} />
                <StatCard title="Cycle" value={cycle || 'Current'} description="Scoring 0.0 – 1.0" icon={<Gauge className="h-4 w-4" />} />
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5" />
              Cycle Management
            </CardTitle>
            <CardDescription>Finalize scoring and trigger exports</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-end gap-3">
                <div className="space-y-2 flex-1">
                  <label className="text-sm font-medium">Cycle Name</label>
                  <Input
                    value={cycle}
                    onChange={(e) => setCycle(e.target.value)}
                    placeholder="e.g. Q4 2024"
                  />
                </div>
                <Button onClick={handleFinalizeScores} disabled={isScoring || !cycle} className="whitespace-nowrap">
                  {isScoring ? 'Processing...' : 'Finalize Scores'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Runs scoring 0.0–1.0 using latest KR progress and updates dashboards.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Gauge className="h-4 w-4" /> Scoring</div>
                <p className="text-xs text-muted-foreground">Auto-calc at quarter end</p>
              </div>
              <div className="rounded-lg border bg-muted/30 p-3">
                <div className="flex items-center gap-2 text-sm font-semibold"><Bell className="h-4 w-4" /> Reminders</div>
                <p className="text-xs text-muted-foreground">Weekly check-in nudges</p>
              </div>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <p>
                Finalizing scores calculates completion for all objectives in the selected cycle and locks edits. Re-run anytime if KR data updates.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <HeatMap
          type="teams"
          title="Team Heatmap"
          description="Traffic-light overview across teams"
          data={teamHeatmap}
        />
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              RBAC Policy
            </CardTitle>
            <CardDescription>Admin → company, Manager → team, Employee → personal</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Company OKRs: Admin/Manager</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Team OKRs: Manager</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Personal OKRs: Owner</div>
            <Separator className="my-2" />
            <div className="flex items-center gap-2 text-primary"><Sparkles className="h-4 w-4" /> Aligns with PRD role flows.</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Alignment Map
            </CardTitle>
            <CardDescription>Company → team → individual cascade</CardDescription>
          </CardHeader>
          <CardContent>
            {alignment?.length ? <AlignmentTree nodes={alignment} /> : <p className="text-sm text-muted-foreground">No alignment data available.</p>}
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Top At-Risk Objectives
            </CardTitle>
            <CardDescription>Focus areas needing intervention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {objectivesLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
            {!objectivesLoading && !topAtRisk.length && (
              <p className="text-sm text-muted-foreground">No at-risk objectives right now.</p>
            )}
            {topAtRisk.map((obj) => (
              <div key={obj.id} className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{obj.title}</div>
                  <span className="text-xs font-semibold text-destructive">{obj.progress}%</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Owner: {obj.owner.name || obj.owner.email} {obj.team ? `• Team ${obj.team.name}` : ''}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Reporting & Exports
            </CardTitle>
            <CardDescription>Generate quarterly reports or export to PDF/Excel</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <Button variant="outline" className="gap-2" onClick={() => handleExport('pdf')}>
              <CloudDownload className="h-4 w-4" />
              Export PDF
            </Button>
            <Button variant="outline" className="gap-2" onClick={() => handleExport('xlsx')}>
              <CloudDownload className="h-4 w-4" />
              Export Excel
            </Button>
            <span className="text-xs text-muted-foreground">Includes alignment tree, team heatmap, and scoring summary.</span>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Action Feed
            </CardTitle>
            <CardDescription>Notifications, reminders, and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <NotificationsFeed userRole="ADMIN" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
