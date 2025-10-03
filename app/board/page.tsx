'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { DndContext, DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'

import { StatusColumn } from '@/components/board/StatusColumn'
import { FiltersBar } from '@/components/layout/FiltersBar'
import { PageHeader } from '@/components/layout/PageHeader'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { strings } from '@/config/strings'
import { getIndianFiscalLabel } from '@/lib/india'
import {
  Objective,
  useObjectives,
  useUpdateObjectiveStatus,
  type ObjectiveStatusValue,
} from '@/hooks/useObjectives'

type StatusBuckets = Record<ObjectiveStatusValue, Objective[]>

const columns: Array<{ id: ObjectiveStatusValue; title: string; description: string }> = [
  { id: 'NOT_STARTED', title: 'Not Started', description: 'Plan and align to kick off.' },
  { id: 'IN_PROGRESS', title: 'In Progress', description: 'Execution underway with weekly check-ins.' },
  { id: 'AT_RISK', title: 'At Risk', description: 'Needs attention to avoid slipping.' },
  { id: 'DONE', title: 'Done', description: 'Closed out and ready for showcase.' },
]

export default function BoardPage() {
  const [teamId, setTeamId] = useState('')
  const [ownerId, setOwnerId] = useState('')
  const [fiscalQuarter, setFiscalQuarter] = useState('')

  const objectivesQuery = useObjectives({
    teamId: teamId || undefined,
    ownerId: ownerId || undefined,
    fiscalQuarter: fiscalQuarter ? Number(fiscalQuarter) : undefined,
    limit: 200,
  })
  const updateStatus = useUpdateObjectiveStatus()
  const objectives = objectivesQuery.data?.objectives ?? []
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }))

  const grouped = useMemo(() =>
    objectives.reduce<StatusBuckets>((acc, objective) => {
      acc[objective.status].push(objective)
      return acc
    }, { NOT_STARTED: [], IN_PROGRESS: [], AT_RISK: [], DONE: [] }),
  [objectives])

  const teamOptions = useMemo(() => {
    const map = new Map<string, string>()
    objectives.forEach((objective) => { if (objective.team) map.set(objective.team.id, objective.team.name) })
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [objectives])

  const ownerOptions = useMemo(() => {
    const map = new Map<string, string>()
    objectives.forEach((objective) => map.set(objective.owner.id, objective.owner.name ?? objective.owner.email))
    return Array.from(map.entries()).map(([value, label]) => ({ value, label }))
  }, [objectives])

  const quarterOptions = useMemo(() => {
    const set = new Set<number>()
    objectives.forEach((objective) => set.add(objective.fiscalQuarter))
    return Array.from(set)
      .sort((a, b) => a - b)
      .map((value) => ({ value: String(value), label: getIndianFiscalLabel(value) }))
  }, [objectives])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || !active?.id) return
    const nextStatus = over.id as ObjectiveStatusValue | undefined
    const currentStatus = active.data.current?.status as ObjectiveStatusValue | undefined
    if (nextStatus && nextStatus !== currentStatus) {
      updateStatus.mutate({ id: String(active.id), status: nextStatus })
    }
  }

  const showEmpty = !objectivesQuery.isLoading && !objectivesQuery.isError && objectives.length === 0

  return (
    <div className="space-y-6">
      <PageHeader
        title="Soul OKR Board"
        description="Track Indian fiscal flow across teams and nudge GST compliance objectives forward."
        actions={
          <Link
            href="/okrs"
            className="rounded-full border border-border/60 px-4 py-2 text-sm font-medium text-foreground transition hover:bg-border/10"
          >
            {strings.navigation.items.okrs}
          </Link>
        }
      />
      <FiltersBar>
        <FilterSelect
          id="board-team-filter"
          label="Team"
          value={teamId}
          onChange={setTeamId}
          options={teamOptions}
          placeholder="All teams"
        />
        <FilterSelect
          id="board-owner-filter"
          label="Owner"
          value={ownerId}
          onChange={setOwnerId}
          options={ownerOptions}
          placeholder="All owners"
        />
        <FilterSelect
          id="board-quarter-filter"
          label="Indian Fiscal Quarter"
          value={fiscalQuarter}
          onChange={setFiscalQuarter}
          options={quarterOptions}
          placeholder="All quarters"
        />
        <p className="ml-auto text-xs text-muted-foreground/80">GST Compliance Objective keeps filings on track.</p>
      </FiltersBar>
      {objectivesQuery.isLoading ? (
        <div className="space-y-3" aria-live="polite">
          <SkeletonRow lines={3} />
          <SkeletonRow lines={3} />
        </div>
      ) : null}
      {objectivesQuery.isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {objectivesQuery.error?.message ?? strings.errors.objectivesLoad}
        </div>
      ) : null}
      {showEmpty ? (
        <EmptyState
          title="No objectives match your filters"
          description="Adjust filters to explore the Soul OKR flow or seed fresh initiatives."
        />
      ) : null}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="grid gap-4 lg:grid-cols-4">
          {columns.map((column) => (
            <StatusColumn
              key={column.id}
              status={column.id}
              title={column.title}
              description={column.description}
              objectives={grouped[column.id] ?? []}
              isUpdating={updateStatus.isPending}
            />
          ))}
        </div>
      </DndContext>
    </div>
  )
}

type FilterSelectProps = {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  placeholder: string
}

function FilterSelect({ id, label, value, onChange, options, placeholder }: FilterSelectProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        className="h-10 rounded-full border border-border/70 bg-background/95 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  )
}
