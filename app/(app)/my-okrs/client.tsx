'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, Flag, Plus, Target, TrendingUp } from 'lucide-react'

import { QuickCheckInRow } from '@/components/check-ins/QuickCheckInRow'
import { HistoryPanel } from '@/components/check-ins/HistoryPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { strings } from '@/config/strings'
import { useObjectives } from '@/hooks/useObjectives'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { calculateKRProgress } from '@/lib/utils'

function fmtPercent(value?: number) {
  if (value == null || Number.isNaN(value)) return '0%'
  return `${Math.round(value)}%`
}

export function MyOkrsClient() {
  const { data: session, status } = useSession()
  const [cycle, setCycle] = useState('')
  const ownerId = session?.user?.id

  const query = useObjectives(
    { ownerId: ownerId ?? undefined, cycle: cycle || undefined, limit: 100 },
    { enabled: status !== 'loading' && Boolean(ownerId) }
  )

  const isLoading = status === 'loading' || query.isLoading
  const isError = query.isError
  const objectives = useMemo(() => query.data?.objectives ?? [], [query.data?.objectives])
  const myObjectives = useMemo(
    () => objectives.filter((objective) => !ownerId || objective.owner?.id === ownerId),
    [objectives, ownerId]
  )
  const cycles = useMemo(() => Array.from(new Set(myObjectives.map((objective) => objective.cycle))).sort(), [myObjectives])
  const filteredObjectives = useMemo(
    () => (cycle ? myObjectives.filter((objective) => objective.cycle === cycle) : myObjectives),
    [myObjectives, cycle]
  )

  const averageProgress = filteredObjectives.length
    ? filteredObjectives.reduce((sum, objective) => sum + objective.progress, 0) / filteredObjectives.length
    : 0

  const pendingKeyResults = filteredObjectives.flatMap((objective) =>
    objective.keyResults.filter((kr) => (kr.progress ?? calculateKRProgress(kr.current, kr.target)) < 100)
  )
  const atRiskObjectives = filteredObjectives.filter((objective) => objective.status === 'AT_RISK')

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="mb-2 h-8 w-48 rounded-full bg-muted/50" />
            <div className="h-4 w-64 rounded-full bg-muted/50" />
          </div>
        </div>
        <SkeletonRow lines={4} />
        <SkeletonRow lines={4} />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {query.error?.message ?? strings.errors.myOkrsLoad}
      </div>
    )
  }

  const showEmptyState = filteredObjectives.length === 0

  return (
    <div className="space-y-8" data-testid="my-okrs-page">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/80 px-5 py-4 shadow-soft">
        <div>
          <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">My OKRs</h1>
          <p className="text-sm text-muted-foreground">
            Track your objectives, update weekly check-ins, and keep your commitments on track.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="rounded-full">
            <Link href="/objectives/new?goalType=TEAM">
              <Flag className="mr-2 h-4 w-4" />
              New Team Objective
            </Link>
          </Button>
          <Button asChild size="sm" className="rounded-full">
            <Link href="/objectives/new?goalType=INDIVIDUAL">
              <Plus className="mr-2 h-4 w-4" />
              New Objective
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overall progress</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{fmtPercent(averageProgress)}</div>
            <Progress value={averageProgress} className="mt-2" />
            <p className="mt-2 text-xs text-muted-foreground">Weighted average across your objectives</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Check-ins due</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingKeyResults.length}</div>
            <p className="text-xs text-muted-foreground">Key results that still need updates</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At risk</CardTitle>
            <Flag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskObjectives.length}</div>
            <p className="text-xs text-muted-foreground">Objectives marked at risk</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cycle</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-2">
            <select
              aria-label="Filter by cycle"
              value={cycle}
              onChange={(event) => setCycle(event.target.value)}
              className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm"
            >
              <option value="">{strings.selects.currentCycle}</option>
              {cycles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Filter your personal objectives by goal cycle.
            </p>
          </CardContent>
        </Card>
      </div>

      {showEmptyState ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>No OKRs yet</CardTitle>
            <CardDescription>
              Create an objective to start tracking your progress. Align it to your team or company goal.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3">
            <Button asChild className="rounded-full">
              <Link href="/objectives/new?goalType=INDIVIDUAL">Create personal objective</Link>
            </Button>
            <Button asChild variant="outline" className="rounded-full">
              <Link href="/objectives/new?goalType=TEAM">Create team objective</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4">
        {filteredObjectives.map((objective) => {
          const progress = Math.round(objective.progress ?? 0)
          return (
            <Card key={objective.id} className="border border-border/70 shadow-soft">
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{objective.title}</CardTitle>
                    <CardDescription className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{objective.cycle}</Badge>
                      {objective.team ? <Badge variant="secondary">{objective.team.name}</Badge> : null}
                      {objective.parent ? (
                        <span className="text-xs text-muted-foreground">Aligned to {objective.parent.title}</span>
                      ) : (
                        <span className="text-xs text-muted-foreground">Top-level objective</span>
                      )}
                    </CardDescription>
                  </div>
                  <ObjectiveStatusBadge status={objective.status} />
                </div>
                <div className="flex items-center gap-3">
                  <Progress value={progress} className="h-2 flex-1" />
                  <span className="text-sm font-semibold text-foreground">{progress}%</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {objective.keyResults.map((kr) => {
                  const krProgress = Math.round(kr.progress ?? calculateKRProgress(kr.current, kr.target))
                  return (
                    <div key={kr.id} className="space-y-3 rounded-xl border border-border/60 bg-background/70 p-4 shadow-inner">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-medium text-foreground">{kr.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Target {kr.target} {kr.unit ?? ''} • Weight {kr.weight}%
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={krProgress} className="w-24" />
                          <span className="text-sm text-muted-foreground">{krProgress}%</span>
                        </div>
                      </div>
                      <QuickCheckInRow keyResultId={kr.id} current={kr.current} unit={kr.unit} />
                      <HistoryPanel keyResultId={kr.id} />
                    </div>
                  )
                })}
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
