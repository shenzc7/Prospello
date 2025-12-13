'use client'

import * as React from 'react'
import { useQuery } from '@tanstack/react-query'

import { StatusChip } from '@/components/check-ins/StatusChip'
import { strings } from '@/config/strings'

type Item = { id: string; weekStart: string; value: number; status: 'GREEN'|'YELLOW'|'RED'; comment?: string|null }

async function fetchHistory(keyResultId: string) {
  const res = await fetch(`/api/check-ins?keyResultId=${encodeURIComponent(keyResultId)}`, { credentials: 'include', cache: 'no-store' })
  if (!res.ok) throw new Error('Failed to load history')
  const raw = await res.json()
  // API responses use { ok, data }, but demo may return a direct object. Normalize both.
  const payload = (raw && typeof raw === 'object' && 'data' in raw)
    ? (raw as { data: unknown }).data
    : raw
  const list = (payload as { checkIns?: unknown })?.checkIns
  return Array.isArray(list) ? (list as Item[]) : []
}

type HistoryPanelProps = {
  keyResultId: string
  toggleTestId?: string
}

export function HistoryPanel({ keyResultId, toggleTestId }: HistoryPanelProps) {
  const [open, setOpen] = React.useState(false)
  const query = useQuery({
    queryKey: ['check-ins', keyResultId],
    queryFn: () => fetchHistory(keyResultId),
    enabled: open,
  })

  return (
    <div className="mt-2">
      <button
        className="text-xs font-medium text-primary underline-offset-4 transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        data-testid={toggleTestId ?? `kr-history-toggle-${keyResultId}`}
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
      >
        {open ? strings.toggles.hideHistory : strings.toggles.showHistory}
      </button>
      {open ? (
        <div
          className="mt-3 space-y-2 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-soft"
          data-testid={`kr-history-${keyResultId}`}
        >
          {query.isLoading ? <div className="text-xs text-muted-foreground">Loading…</div> : null}
          {query.isError ? <div className="text-xs text-destructive">Failed to load</div> : null}
          {query.data?.map((c) => (
            <div
              key={c.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/50 bg-background/90 px-3 py-2 text-xs text-muted-foreground"
            >
              <div>
                {new Date(c.weekStart).toLocaleDateString()} — {c.value}
                {c.comment ? <span className="ml-2">• {c.comment}</span> : null}
              </div>
              <StatusChip status={c.status} />
            </div>
          ))}
          {query.data && query.data.length === 0 ? (
            <div className="text-xs text-muted-foreground">No history.</div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
