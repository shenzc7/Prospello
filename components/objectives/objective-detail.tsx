'use client'

import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { ProgressChip } from '@/components/objectives/progress-chip'
import { useObjective } from '@/hooks/useObjectives'

export function ObjectiveDetail({ objectiveId }: { objectiveId: string }) {
  const { data, isLoading, isError, error } = useObjective(objectiveId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading objective…</p>
  }

  if (isError || !data?.objective) {
    return <p className="text-sm text-red-600">{error?.message ?? 'Objective not found'}</p>
  }

  const objective = data.objective

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-muted-foreground">{objective.cycle}</p>
          <h1 className="text-2xl font-semibold">{objective.title}</h1>
          <p className="text-sm text-muted-foreground">
            Owner: {objective.owner.name ?? objective.owner.email}
          </p>
          {objective.team ? (
            <p className="text-xs text-muted-foreground">Team: {objective.team.name}</p>
          ) : null}
          <p className="text-xs text-muted-foreground">Goal type: {objective.goalType ?? 'INDIVIDUAL'}</p>
        </div>
        <div className="flex items-center gap-3">
          <ProgressChip value={objective.progress} />
          <Button variant="outline" asChild>
            <Link href={`/objectives/${objective.id}/edit`}>Edit</Link>
          </Button>
        </div>
      </div>

      {objective.description ? (
        <p className="rounded-lg border bg-muted/30 p-4 text-sm text-muted-foreground">
          {objective.description}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-muted-foreground">Start</p>
          <p className="text-sm font-medium">{new Date(objective.startAt).toLocaleDateString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-muted-foreground">End</p>
          <p className="text-sm font-medium">{new Date(objective.endAt).toLocaleDateString()}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-xs uppercase text-muted-foreground">Alignment</p>
          <p className="text-sm font-medium">
            {objective.parent ? (
              <Link className="underline" href={`/objectives/${objective.parent.id}`}>
                {objective.parent.title}
              </Link>
            ) : (
              'Top-level objective'
            )}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Key Results</h2>
          <p className="text-sm text-muted-foreground">Weights sum to 100%</p>
        </div>
        <div className="space-y-4">
          {objective.keyResults.map((kr) => (
            <div key={kr.id} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{kr.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Weight {kr.weight}% • Target {kr.target} {kr.unit ?? ''}
                  </p>
                </div>
                <ProgressChip value={kr.progress} />
              </div>
              <div className="mt-3 grid gap-3 text-xs text-muted-foreground sm:grid-cols-2">
                <p>Current: {kr.current} {kr.unit ?? ''}</p>
                <p>Delta: {Math.round(kr.progress)}%</p>
              </div>
              {kr.initiatives && kr.initiatives.length ? (
                <div className="mt-4 space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground">Initiatives</p>
                  <ul className="space-y-1 text-xs">
                    {kr.initiatives.map((initiative) => (
                      <li key={initiative.id} className="flex items-center justify-between rounded border bg-muted/40 px-3 py-2">
                        <span>{initiative.title}</span>
                        <span className="font-medium uppercase text-muted-foreground">{initiative.status}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
