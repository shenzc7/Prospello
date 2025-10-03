'use client'

import { useDroppable } from '@dnd-kit/core'

import { ObjectiveCard } from '@/components/board/ObjectiveCard'
import { cn } from '@/lib/ui'
import type { Objective, ObjectiveStatusValue } from '@/hooks/useObjectives'

type StatusColumnProps = {
  status: ObjectiveStatusValue
  title: string
  description: string
  objectives: Objective[]
  isUpdating: boolean
}

export function StatusColumn({ status, title, description, objectives, isUpdating }: StatusColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status })

  return (
    <section
      ref={setNodeRef}
      className={cn(
        'flex min-h-[520px] flex-col gap-3 rounded-2xl border border-border/70 bg-card/80 p-4 shadow-soft transition',
        isOver && 'ring-2 ring-primary/30'
      )}
    >
      <header className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground/90">{title}</h2>
        <p className="text-xs text-muted-foreground/80">{description}</p>
      </header>
      <div className="grid gap-3">
        {objectives.map((objective) => (
          <ObjectiveCard key={objective.id} objective={objective} isUpdating={isUpdating} />
        ))}
      </div>
    </section>
  )
}
