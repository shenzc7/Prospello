'use client'

import { ChevronDown, ChevronRight, Users } from 'lucide-react'
import { useState } from 'react'

import type { AlignmentNode } from '@/lib/checkin-summary'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { cn } from '@/lib/ui'

type AlignmentTreeProps = {
  nodes: AlignmentNode[]
  isLoading?: boolean
}

function TreeRow({ node }: { node: AlignmentNode }) {
  const [open, setOpen] = useState(true)
  const statusClasses = getTrafficLightClasses(calculateTrafficLightStatus(node.progress))

  return (
    <div className="space-y-2">
      <button
        type="button"
        className={cn(
          'flex w-full items-start gap-3 rounded-xl border px-3 py-2 text-left transition-colors',
          statusClasses.bg,
          statusClasses.border
        )}
        onClick={() => setOpen((prev) => !prev)}
      >
        {node.children && node.children.length > 0 ? (
          open ? <ChevronDown className="h-4 w-4 mt-0.5" /> : <ChevronRight className="h-4 w-4 mt-0.5" />
        ) : (
          <span className="h-4 w-4" />
        )}
        <div className="flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-semibold">{node.title}</span>
            <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', statusClasses.border, statusClasses.text)}>
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {Math.round(node.progress)}%
            </span>
            {node.teamName ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                <Users className="h-3 w-3" />
                {node.teamName}
              </span>
            ) : null}
            {node.goalType ? (
              <span className="rounded-full border px-2 py-0.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                {node.goalType.toLowerCase()}
              </span>
            ) : null}
          </div>
          <p className="text-xs text-muted-foreground">{node.owner}</p>
        </div>
      </button>
      {open && node.children && node.children.length > 0 ? (
        <div className="ml-6 border-l border-border/70 pl-3">
          {node.children.map((child) => (
            <TreeRow key={child.id} node={child} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

export function AlignmentTree({ nodes, isLoading }: AlignmentTreeProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="h-12 w-full animate-pulse rounded-xl bg-muted" />
        ))}
      </div>
    )
  }

  if (!nodes || nodes.length === 0) {
    return <p className="text-sm text-muted-foreground">No alignment data yet. Create objectives to populate the tree.</p>
  }

  return (
    <div className="space-y-4">
      {nodes.map((node) => (
        <TreeRow key={node.id} node={node} />
      ))}
    </div>
  )
}
