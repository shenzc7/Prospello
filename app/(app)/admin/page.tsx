'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Users,
  Settings,
  PlayCircle,
  AlertTriangle,
  Bell,
  Shield,
  Gauge,
  BarChart3,
  CloudDownload,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import { isFeatureEnabled } from '@/config/features'

export default function AdminPage() {
  if (!isFeatureEnabled('adminExtras')) {
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

  const { data: session } = useSession()
  const role = session?.user?.role
  const isAdmin = role === 'ADMIN'
  const { toast } = useToast()
  const [cycle, setCycle] = useState('Q4 2024')
  const [isScoring, setIsScoring] = useState(false)

  const handleFinalizeScores = async () => {
    try {
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
      toast({
        title: 'Error',
        description: 'Failed to finalize scores',
        variant: 'destructive',
      })
    } finally {
      setIsScoring(false)
    }
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
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Control roles, alignment, cycles, and exports</p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Roles & access</p>
          <p className="text-sm font-semibold text-foreground">Admin • Manager • Employee</p>
          <p className="text-xs text-muted-foreground">Gate dashboards, check-ins, and objective edits.</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Goal cycles</p>
          <p className="text-sm font-semibold text-foreground">Automated scoring 0.0 – 1.0</p>
          <p className="text-xs text-muted-foreground">Run end-of-quarter scoring with one click.</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">SSO & reminders</p>
          <p className="text-sm font-semibold text-foreground">Google / Slack / Teams</p>
          <p className="text-xs text-muted-foreground">Authentication plus weekly reminder delivery.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Link href="/admin/users">
          <Card className="hover:bg-muted/50 transition-colors cursor-pointer h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                User Management
              </CardTitle>
              <CardDescription>Manage users, teams, and roles</CardDescription>
            </CardHeader>
          </Card>
        </Link>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              RBAC Policy
            </CardTitle>
            <CardDescription>Admin: full. Manager: team scope. Employee: own OKRs.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Company OKRs: Admin/Manager</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Team OKRs: Manager</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-3 w-3 text-green-500" /> Personal OKRs: Owner</div>
          </CardContent>
        </Card>

        <Card className="h-full opacity-70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Integrations
            </CardTitle>
            <CardDescription>SSO and notification channels (coming soon)</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PlayCircle className="h-5 w-5" />
            Cycle Management
          </CardTitle>
          <CardDescription>Close quarter, score OKRs, and trigger reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-[1.3fr_1fr]">
            <div className="space-y-3 rounded-lg border p-4">
              <div className="flex items-end gap-4">
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
                Finalize runs 0.0–1.0 scoring using latest KR progress and updates all linked dashboards.
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
          </div>

          <div className="bg-amber-50 dark:bg-amber-950/30 p-4 rounded-lg flex gap-3 text-sm text-amber-800 dark:text-amber-200">
            <AlertTriangle className="h-5 w-5 shrink-0" />
            <p>
              Finalizing scores calculates completion for all objectives in the selected cycle and locks edits. Re-run anytime if KR data updates.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Reporting & Exports
          </CardTitle>
          <CardDescription>Generate quarterly reports or export to PDF/Excel per PRD</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
          <Button variant="outline" className="gap-2">
            <CloudDownload className="h-4 w-4" />
            Export PDF
          </Button>
          <Button variant="outline" className="gap-2">
            <CloudDownload className="h-4 w-4" />
            Export Excel
          </Button>
          <span className="text-xs text-muted-foreground">Includes alignment tree, team heatmap, and scoring summary.</span>
        </CardContent>
      </Card>
    </div>
  )
}
