'use client'

import { useState } from 'react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ProgressChip } from '@/components/objectives/progress-chip'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { strings } from '@/config/strings'
import { useObjectives } from '@/hooks/useObjectives'

export function ObjectivesList() {
  const [search, setSearch] = useState('')
  const { data, isLoading, isError, error } = useObjectives({ search })

  const objectives = data?.objectives ?? []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{strings.titles.okrs}</h1>
          <p className="text-sm text-muted-foreground">{strings.descriptions.okrs}</p>
        </div>
        <Button asChild>
          <Link href="/objectives/new">{strings.buttons.newObjective}</Link>
        </Button>
      </div>

      <Input
        placeholder={strings.inputs.objectiveSearch}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {isLoading ? (
        <div className="space-y-4">
          <SkeletonRow lines={3} />
          <SkeletonRow lines={3} />
          <SkeletonRow lines={3} />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error?.message ?? strings.errors.objectivesLoad}
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map((objective) => (
          <Link
            key={objective.id}
            href={`/objectives/${objective.id}`}
            className="block rounded-lg border p-5 transition hover:border-primary"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-semibold">{objective.title}</h2>
                <p className="text-sm text-muted-foreground">
                  Cycle: {objective.cycle} • Owner: {objective.owner.name ?? objective.owner.email}
                </p>
              </div>
              <ProgressChip value={objective.progress} />
            </div>
            <div className="mt-4 grid gap-3 text-sm text-muted-foreground sm:grid-cols-3">
              <div>
                <span className="font-medium text-foreground">{strings.labels.start}</span>
                <p>{new Date(objective.startAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">{strings.labels.end}</span>
                <p>{new Date(objective.endAt).toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium text-foreground">Aligned KRs</span>
                <p>{objective.keyResults.length} KRs • {objective._count?.children ?? 0} children</p>
              </div>
            </div>
          </Link>
        ))}
        </div>
      )}

      {!isLoading && !isError && objectives.length === 0 ? (
        <div className="rounded-lg border border-dashed p-8 text-center">
          <p className="text-sm text-muted-foreground">{strings.emptyStates.noObjectives.description}</p>
        </div>
      ) : null}
    </div>
  )
}
