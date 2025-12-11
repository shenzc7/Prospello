'use client'

import Link from 'next/link'
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'

import { ProgressChip } from '@/components/ui/ProgressChip'
import { getFiscalQuarterLabel } from '@/lib/india'
import { getTrafficLightStatus } from '@/lib/okr'
import { getTrafficLightLabel } from '@/lib/utils'
import { cn, fmtProgressDual } from '@/lib/ui'
import type { Objective } from '@/hooks/useObjectives'

type ObjectiveCardProps = {
  objective: Objective
  isUpdating: boolean
}

const toneMap = {
  green: 'green',
  yellow: 'yellow',
  red: 'red',
  gray: 'gray',
} as const

export function ObjectiveCard({ objective, isUpdating }: ObjectiveCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: objective.id,
    data: { status: objective.status },
  })

  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  const tone = toneMap[getTrafficLightStatus(objective.progress)]
  const toneLabel = getTrafficLightLabel(tone)

  return (
    <article
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'cursor-grab rounded-xl border border-border/60 bg-background/95 p-4 text-sm shadow-sm transition hover:border-primary/50 hover:shadow-md active:cursor-grabbing',
        isUpdating && 'animate-pulse',
        isDragging && 'border-primary/50 shadow-lg'
      )}
    >
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h3 className="truncate font-semibold text-foreground" title={objective.title}>
            {objective.title}
          </h3>
          <p className="text-xs text-muted-foreground">
            {objective.team?.name ?? 'Unassigned team'} • {getFiscalQuarterLabel(objective.fiscalQuarter)}
          </p>
        </div>
        <ProgressChip tone={tone} srLabel={toneLabel}>
          <span className="flex items-center gap-1">
            <span>{fmtProgressDual(objective.progress)}</span>
            <span className="text-[11px] font-medium text-muted-foreground">({toneLabel})</span>
          </span>
        </ProgressChip>
      </header>
      <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
        <div>
          <dt className="font-medium uppercase tracking-wide text-muted-foreground/70">Owner</dt>
          <dd className="truncate text-foreground" title={objective.owner.name ?? objective.owner.email}>
            {objective.owner.name ?? objective.owner.email}
          </dd>
        </div>
        <div className="text-right">
          <dt className="font-medium uppercase tracking-wide text-muted-foreground/70">Key Results</dt>
          <dd className="text-foreground">{objective.keyResults.length}</dd>
        </div>
      </dl>
      <footer className="mt-3 text-xs">
        <Link href={`/okrs/${objective.id}`} className="text-primary hover:underline">
          View objective
        </Link>
      </footer>
    </article>
  )
}
