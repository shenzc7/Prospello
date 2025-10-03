'use client'

import React, { useMemo, useState } from 'react'
import Link from 'next/link'

import { ProgressChip } from '@/components/okrs/ProgressChip'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FiltersBar } from '@/components/layout/FiltersBar'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { strings } from '@/config/strings'
import { useObjectives } from '@/hooks/useObjectives'
import { fmtPercent, fmtMetric } from '@/lib/ui'

const INR_REGEX = /₹|inr|rupee/i

export function OkrBoard() {
  const [search, setSearch] = useState('')
  const [cycle, setCycle] = useState('')

  const query = useObjectives({
    search: search || undefined,
    cycle: cycle || undefined,
    limit: 100,
  })

  const objectives = query.data?.objectives ?? []

  const cycles = useMemo(() => {
    const set = new Set<string>()
    objectives.forEach((objective) => objective.cycle && set.add(objective.cycle))
    return Array.from(set).sort()
  }, [objectives])

  const showEmpty = !query.isLoading && !query.isError && objectives.length === 0


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            {strings.titles.okrs}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Project Board</p>
        </div>
        <SegmentedControl
          items={[
            { label: 'List', href: '/okrs', exact: true },
            { label: 'Board', href: '/okrs/board' },
          ]}
        />
      </div>

      <FiltersBar>
          <label className="sr-only" htmlFor="okrs-board-search">
            {strings.inputs.objectiveSearch}
          </label>
          <Input
            id="okrs-board-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={strings.inputs.objectiveSearch}
            className="max-w-sm rounded-full border-border/70 bg-background/95 px-5"
          />
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground" htmlFor="okrs-board-cycle">
              {strings.selects.cycleLabel}
            </label>
            <select
              id="okrs-board-cycle"
              value={cycle}
              onChange={(e) => setCycle(e.target.value)}
              className="h-10 rounded-full border border-border/70 bg-background/95 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="">{strings.selects.allCycles}</option>
              {cycles.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
      </FiltersBar>

      {query.isLoading ? (
        <div className="space-y-3" aria-live="polite">
          <SkeletonRow lines={3} />
          <SkeletonRow lines={3} />
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {query.error?.message ?? strings.errors.objectivesLoad}
        </div>
      ) : null}

      {showEmpty ? (
        <EmptyState
          title={strings.emptyStates.noObjectives.title}
          description={strings.emptyStates.noObjectives.description}
          action={
            <Button asChild className="rounded-full">
              <Link href="/okrs/new">{strings.emptyStates.noObjectives.actionLabel}</Link>
            </Button>
          }
        />
      ) : null}

      {objectives.length ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Status Columns */}
          {['NOT_STARTED', 'IN_PROGRESS', 'AT_RISK', 'DONE'].map((status) => {
            const statusObjectives = objectives.filter(obj => obj.status === status)
            const statusLabel = {
              'NOT_STARTED': 'Planning',
              'IN_PROGRESS': 'In Progress',
              'AT_RISK': 'Needs Attention',
              'DONE': 'Completed'
            }[status]

            return (
              <div key={status} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getStatusColor(status)}`} />
                  <h3 className="font-semibold text-sm uppercase tracking-wide">
                    {statusLabel} ({statusObjectives.length})
                  </h3>
                </div>
                <div className="space-y-3">
                  {statusObjectives.map((objective) => (
                    <Card key={objective.id} objective={objective} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : null}
    </div>
  )
}



function Card({ objective }: { objective: any }) {
  return (
    <div className="bg-card/90 backdrop-blur-sm border border-border/60 rounded-xl p-5 shadow-card hover:shadow-card-hover hover:border-border/80 transition-all duration-200 cursor-pointer group hover:scale-[1.02]"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-foreground text-sm truncate" title={objective.title}>
            {objective.title}
          </h3>
          <p className="text-xs text-muted-foreground mt-1">
            {objective.cycle} • {objective.owner.name ?? objective.owner.email}
          </p>
        </div>
        <div className="ml-3">
          <div className="flex items-center gap-2">
            <ProgressChip value={objective.progress} />
            <span className="text-xs font-medium text-muted-foreground">
              {Math.round(objective.progress)}%
            </span>
          </div>
        </div>
      </div>

      {objective.keyResults.length > 0 && (
        <div className="space-y-3 mb-4">
          {objective.keyResults.slice(0, 2).map((kr: any) => (
            <div key={kr.id} className="bg-muted/30 rounded-lg p-3 border border-border/30">
              <p className="text-xs font-medium text-foreground truncate mb-2" title={kr.title}>
                {kr.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  {fmtMetric(kr.current, kr.unit)} / {fmtMetric(kr.target, kr.unit)}
                </span>
                <div className="flex items-center gap-2">
                  <ProgressChip value={kr.progress ?? 0} />
                  <span className="text-xs font-medium text-muted-foreground">
                    {Math.round(kr.progress ?? 0)}%
                  </span>
                </div>
              </div>
            </div>
          ))}
          {objective.keyResults.length > 2 && (
            <p className="text-xs text-muted-foreground text-center bg-muted/20 rounded-md py-2">
              +{objective.keyResults.length - 2} more key results
            </p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-border/40">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center border border-primary/20">
            <span className="text-xs font-semibold text-primary">
              {(objective.owner.name ?? objective.owner.email).charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <span className="text-xs font-medium text-foreground block">
              {objective.owner.name ?? objective.owner.email}
            </span>
            <span className="text-xs text-muted-foreground">
              {objective.cycle}
            </span>
          </div>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-7 text-xs hover:bg-primary/5 hover:text-primary">
          <Link href={`/okrs/${objective.id}`}>View</Link>
        </Button>
      </div>
    </div>
  )
}

function getStatusColor(status: string) {
  switch (status) {
    case 'NOT_STARTED': return 'okr-status-not-started'
    case 'IN_PROGRESS': return 'okr-status-in-progress'
    case 'AT_RISK': return 'okr-status-at-risk'
    case 'DONE': return 'okr-status-done'
    default: return 'okr-status-not-started'
  }
}

