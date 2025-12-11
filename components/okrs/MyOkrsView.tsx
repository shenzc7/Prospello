'use client'

import { useState } from 'react'

import { QuickCheckInRow } from '@/components/check-ins/QuickCheckInRow'
import { HistoryPanel } from '@/components/check-ins/HistoryPanel'
import { ProgressChip } from '@/components/okrs/ProgressChip'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { strings } from '@/config/strings'
import { useMyOkrs } from '@/hooks/useMyOkrs'
import { fmtPercent } from '@/lib/ui'
import { calculateKRProgress } from '@/lib/utils'

const ALL_CYCLES = '__all_cycles__'

export function MyOkrsView({ ownerId }: { ownerId: string }) {
  const [cycle, setCycle] = useState<string>(ALL_CYCLES)
  const query = useMyOkrs({ ownerId, cycle: cycle === ALL_CYCLES ? undefined : cycle })

  if (query.isLoading) {
    return (
      <div className="space-y-3">
        <SkeletonRow lines={3} />
        <SkeletonRow lines={4} />
      </div>
    )
  }

  if (query.isError) {
    return (
      <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
        {query.error?.message ?? strings.errors.myOkrsLoad}
      </div>
    )
  }

  const objectives = (query.data?.objectives ?? []).filter((objective) => objective.owner?.id === ownerId)
  const cycles = Array.from(new Set(objectives.map((objective) => objective.cycle))).sort()

  return (
    <div className="space-y-6" data-testid="my-okrs-page">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/80 px-5 py-4 shadow-soft">
        <div>
          <h1 className="text-xl font-semibold text-foreground md:text-2xl">{strings.titles.myOkrs}</h1>
          <p className="text-sm text-muted-foreground">{strings.descriptions.myOkrs}</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="my-okrs-cycle">
            {strings.selects.cycleLabel}
          </label>
          <Select value={cycle} onValueChange={setCycle}>
            <SelectTrigger id="my-okrs-cycle" className="h-10 min-w-[160px] rounded-full px-4">
              <SelectValue placeholder={strings.selects.currentCycle} />
            </SelectTrigger>
            <SelectContent align="end">
              <SelectItem value={ALL_CYCLES}>{strings.selects.currentCycle}</SelectItem>
              {cycles.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </header>

      {objectives.length === 0 ? (
        <EmptyState
          title={strings.emptyStates.myOkrs.title}
          description={strings.emptyStates.myOkrs.description}
        />
      ) : null}

      <div className="space-y-6">
        {objectives.map((objective) => (
          <section
            key={objective.id}
            className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-5 shadow-soft"
            data-testid={`my-okrs-objective-${objective.id}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <h2 className="text-lg font-semibold text-foreground">{objective.title}</h2>
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {objective.cycle} • {fmtPercent(objective.progress)} complete
                </p>
              </div>
              <ProgressChip value={objective.progress} />
            </div>

            <div className="space-y-4">
              {objective.keyResults.map((kr) => {
                const progress = kr.progress ?? calculateKRProgress(kr.current, kr.target)
                return (
                  <article key={kr.id} className="space-y-3 rounded-2xl border border-border/60 bg-background/80 p-4 shadow-soft">
                    <header className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-foreground">{kr.title}</p>
                        <p className="text-xs text-muted-foreground">Target {kr.target} {kr.unit ?? ''}</p>
                      </div>
                      <ProgressChip value={progress} />
                    </header>
                    <QuickCheckInRow keyResultId={kr.id} current={kr.current} unit={kr.unit} />
                    <HistoryPanel keyResultId={kr.id} />
                  </article>
                )
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
