'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronUp, ChevronDown, ArrowUpDown, MoreHorizontal, CheckSquare, Square, Filter } from 'lucide-react'

import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { ProgressChip } from '@/components/okrs/ProgressChip'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { Button } from '@/components/ui/button'
import { FiltersBar } from '@/components/layout/FiltersBar'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { strings } from '@/config/strings'
import { ObjectiveStatusValue, useObjectives } from '@/hooks/useObjectives'
import { useKeyboardShortcuts, okrKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { cn } from '@/lib/ui'


const statusFilters: Array<{ value: ObjectiveStatusValue | ''; label: string }> = [
  { value: '', label: 'All statuses' },
  { value: 'IN_PROGRESS', label: 'On track' },
  { value: 'AT_RISK', label: 'At risk' },
  { value: 'NOT_STARTED', label: 'Not started' },
  { value: 'DONE', label: 'Completed' },
]

const compactDateFormatter = new Intl.DateTimeFormat('en-IN', {
  month: 'short',
  day: 'numeric',
})

function formatTimeline(start: string, end: string) {
  const startDate = new Date(start)
  const endDate = new Date(end)
  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    return 'Timeline pending'
  }
  const sameYear = startDate.getFullYear() === endDate.getFullYear()
  const startLabel = compactDateFormatter.format(startDate)
  const endLabel = compactDateFormatter.format(endDate)
  if (sameYear) {
    return `${startLabel} – ${endLabel} ${startDate.getFullYear()}`
  }
  return `${startLabel} ${startDate.getFullYear()} – ${endLabel} ${endDate.getFullYear()}`
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) {
    const parts = name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
    if (parts.length) {
      return parts.map((part) => part[0]?.toUpperCase()).join('')
    }
  }
  if (email) {
    return email.slice(0, 2).toUpperCase()
  }
  return '–'
}

type SortField = 'title' | 'progress' | 'status' | 'owner' | 'cycle' | 'createdAt'
type SortDirection = 'asc' | 'desc'

export function OkrTable() {
  const [search, setSearch] = useState('')
  const [cycle, setCycle] = useState('')
  const [status, setStatus] = useState<ObjectiveStatusValue | ''>('')
  const [sortField, setSortField] = useState<SortField>('createdAt')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

  const query = useObjectives({
    search: search || undefined,
    cycle: cycle || undefined,
    status: status || undefined,
  })

  const objectives = query.data?.objectives ?? []

  const cycles = useMemo(() => {
    const set = new Set<string>()
    objectives.forEach((objective) => {
      if (objective.cycle) set.add(objective.cycle)
    })
    return Array.from(set).sort()
  }, [objectives])

  const sortedObjectives = useMemo(() => {
    return [...objectives].sort((a, b) => {
      let aValue: any
      let bValue: any

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase()
          bValue = b.title.toLowerCase()
          break
        case 'progress':
          aValue = a.progress
          bValue = b.progress
          break
        case 'status':
          aValue = a.status
          bValue = b.status
          break
        case 'owner':
          aValue = a.owner.name || a.owner.email
          bValue = b.owner.name || b.owner.email
          break
        case 'cycle':
          aValue = a.cycle
          bValue = b.cycle
          break
        case 'createdAt':
          aValue = new Date(a.createdAt)
          bValue = new Date(b.createdAt)
          break
        default:
          return 0
      }

      if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
      if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
      return 0
    })
  }, [objectives, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(sortedObjectives.map(obj => obj.id)))
    } else {
      setSelectedIds(new Set())
    }
  }

  const handleSelectObjective = (id: string, checked: boolean) => {
    const newSelected = new Set(selectedIds)
    if (checked) {
      newSelected.add(id)
    } else {
      newSelected.delete(id)
    }
    setSelectedIds(newSelected)
  }

  const selectedCount = selectedIds.size
  const hasSelection = selectedCount > 0

  // Keyboard shortcuts
  useKeyboardShortcuts([
    {
      key: 'a',
      ctrl: true,
      description: 'Select all objectives',
      action: () => handleSelectAll(!hasSelection || selectedCount < sortedObjectives.length)
    },
    {
      key: 'Escape',
      description: 'Clear selection',
      action: () => setSelectedIds(new Set())
    }
  ])


  const showEmpty = !query.isLoading && !query.isError && objectives.length === 0

  const SortableHeader = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      className="h-auto p-0 font-medium hover:bg-transparent"
      onClick={() => handleSort(field)}
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortDirection === 'asc' ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown className="h-4 w-4 opacity-50" />
        )}
      </span>
    </Button>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{strings.titles.okrs}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {objectives.length} objectives • {hasSelection && `${selectedCount} selected`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasSelection && (
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{selectedCount} selected</Badge>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <MoreHorizontal className="h-4 w-4 mr-2" />
                    Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <CheckSquare className="h-4 w-4 mr-2" />
                    Mark as Complete
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Filter className="h-4 w-4 mr-2" />
                    Change Status
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
          <SegmentedControl
            items={[
              { label: 'Table', href: '/okrs', exact: true },
              { label: 'Board', href: '/okrs/board' },
            ]}
          />
        </div>
      </div>


      <FiltersBar className="border border-border/40 bg-background/60">
        <label className="sr-only" htmlFor="okrs-search-input">
          {strings.inputs.objectiveSearch}
        </label>
        <Input
          id="okrs-search-input"
          data-testid="okrs-search-input"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={`${strings.inputs.objectiveSearch} (Ctrl+F)`}
          className="max-w-sm rounded-lg border-border/40 bg-background/80 px-4 text-sm"
        />

        {/* Quick Filters */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Quick Filters</span>
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={status === 'AT_RISK' ? 'default' : 'outline'}
              onClick={() => setStatus(status === 'AT_RISK' ? '' : 'AT_RISK')}
              className="h-7 px-2 text-xs"
            >
              At Risk
            </Button>
            <Button
              size="sm"
              variant={status === 'DONE' ? 'default' : 'outline'}
              onClick={() => setStatus(status === 'DONE' ? '' : 'DONE')}
              className="h-7 px-2 text-xs"
            >
              Completed
            </Button>
            <Button
              size="sm"
              variant={search === 'my' ? 'default' : 'outline'}
              onClick={() => setSearch(search === 'my' ? '' : 'my')}
              className="h-7 px-2 text-xs"
            >
              My OKRs
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="okrs-cycle-select">
            {strings.selects.cycleLabel}
          </label>
          <select
            id="okrs-cycle-select"
            data-testid="okrs-cycle-select"
            value={cycle}
            onChange={(event) => setCycle(event.target.value)}
            className="h-9 rounded-lg border-border/40 bg-background/80 px-3 text-sm"
          >
            <option value="">{strings.selects.allCycles}</option>
            {cycles.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Status</span>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map((filter) => (
              <Button
                key={filter.value || 'all'}
                type="button"
                variant={status === filter.value ? 'default' : 'outline'}
                aria-pressed={status === filter.value}
                onClick={() => setStatus((current) => (current === filter.value ? '' : filter.value))}
                className={cn(
                  'h-8 rounded-md px-3 text-xs transition-all',
                  status === filter.value
                    ? 'bg-primary text-primary-foreground'
                    : 'border-border/40 bg-background/80 text-foreground hover:bg-muted'
                )}
              >
                {filter.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Saved Views */}
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Views</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 px-2 text-xs">
                Saved Views
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => {
                setStatus('')
                setCycle('')
                setSearch('')
                setSortField('createdAt')
                setSortDirection('desc')
              }}>
                All Objectives
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setStatus('AT_RISK')
                setCycle('')
                setSearch('')
              }}>
                At Risk Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setStatus('DONE')
                setCycle('')
                setSearch('')
              }}>
                Completed Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => {
                setSearch('my')
                setStatus('')
                setCycle('')
              }}>
                My Objectives
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </FiltersBar>

      {query.isLoading ? (
        <div className="space-y-3" aria-live="polite">
          <SkeletonRow lines={3} />
          <SkeletonRow lines={3} />
        </div>
      ) : null}

      {query.isError ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive backdrop-blur">
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
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-lg border border-border/60 bg-card shadow-sm">
            <Table className="min-w-full">
            <TableHeader className="bg-muted/50">
              <TableRow className="!border-0">
                <TableHead className="w-12 px-6 py-4">
                  <Checkbox
                    checked={selectedCount === sortedObjectives.length && sortedObjectives.length > 0}
                    onCheckedChange={handleSelectAll}
                    aria-label="Select all objectives"
                  />
                </TableHead>
                <TableHead className="px-6 py-4 text-left">
                  <SortableHeader field="title">Objective</SortableHeader>
                </TableHead>
                <TableHead className="px-6 py-4 text-left">
                  <SortableHeader field="status">Status</SortableHeader>
                </TableHead>
                <TableHead className="px-6 py-4 text-left">
                  <SortableHeader field="progress">Progress</SortableHeader>
                </TableHead>
                <TableHead className="px-6 py-4 text-left">Key results</TableHead>
                <TableHead className="px-6 py-4 text-left">
                  <SortableHeader field="owner">Owner</SortableHeader>
                </TableHead>
                <TableHead className="px-6 py-4 text-left">
                  <SortableHeader field="cycle">Cycle</SortableHeader>
                </TableHead>
                <TableHead className="w-12 px-6 py-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedObjectives.map((objective) => (
                <TableRow
                  key={objective.id}
                  className={cn(
                    "group relative !border-0 transition-colors hover:bg-muted/50",
                    selectedIds.has(objective.id) && "bg-muted/30"
                  )}
                >
                  <TableCell className="align-top px-6 py-4">
                    <Checkbox
                      checked={selectedIds.has(objective.id)}
                      onCheckedChange={(checked) => handleSelectObjective(objective.id, checked as boolean)}
                      aria-label={`Select ${objective.title}`}
                    />
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <div className="space-y-2">
                      <Link
                        className="text-base font-semibold text-foreground transition hover:text-primary"
                        href={`/okrs/${objective.id}`}
                      >
                        {objective.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        {objective.team ? <span>{objective.team.name}</span> : null}
                        <span>
                          {(objective.children?.length ?? 0) > 0
                            ? `${objective.children?.length ?? 0} aligned`
                            : 'Top-level objective'}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <ObjectiveStatusBadge status={objective.status} />
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <ProgressMeter value={objective.progress} />
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <KeyResultPreview
                      items={objective.keyResults.map((keyResult) => ({
                        id: keyResult.id,
                        title: keyResult.title,
                        progress: keyResult.progress,
                      }))}
                    />
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <OwnerCell
                      name={objective.owner.name}
                      email={objective.owner.email}
                      team={objective.team?.name}
                      progress={objective.progress}
                    />
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <Badge variant="outline" className="text-xs">
                      {objective.cycle}
                    </Badge>
                  </TableCell>
                  <TableCell className="align-top px-6 py-4">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/okrs/${objective.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/okrs/${objective.id}/edit`}>Edit</Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-4">
            {sortedObjectives.map((objective) => (
              <MobileObjectiveCard
                key={objective.id}
                objective={objective}
                isSelected={selectedIds.has(objective.id)}
                onSelect={(selected) => handleSelectObjective(objective.id, selected)}
              />
            ))}
          </div>
        </>
      ) : null}
    </div>
  )
}


function ProgressMeter({ value }: { value: number }) {
  const clamped = Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value))) : 0
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{clamped}% complete</span>
        <span className={cn(
          'font-semibold',
          clamped >= 75 ? 'progress-high' : clamped >= 50 ? 'progress-medium' : 'progress-low'
        )}>
          {clamped >= 75 ? 'On track' : clamped >= 50 ? 'Keep pushing' : 'Needs focus'}
        </span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-foreground/10">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 via-primary to-primary/80 transition-all duration-500 ease-out"
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  )
}

type KeyResultPreviewProps = {
  items: Array<{ id: string; title: string; progress: number }>
}

function KeyResultPreview({ items }: KeyResultPreviewProps) {
  if (!items.length) {
    return <p className="text-xs text-muted-foreground">No key results yet.</p>
  }

  const visible = items.slice(0, 2)
  const hiddenCount = items.length - visible.length

  return (
    <div className="space-y-2">
      {visible.map((item) => {
        const progress = Number.isFinite(item.progress) ? Math.round(item.progress) : 0
        return (
          <div key={item.id} className="flex items-center justify-between gap-3 rounded-2xl bg-foreground/[0.04] px-3 py-2 text-xs text-muted-foreground">
            <span className="line-clamp-1 font-medium text-foreground/80">{item.title}</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
        )
      })}
      {hiddenCount > 0 ? (
        <span className="text-xs text-muted-foreground">+{hiddenCount} more key result{hiddenCount === 1 ? '' : 's'}</span>
      ) : null}
    </div>
  )
}

type OwnerCellProps = {
  name?: string | null
  email: string
  team?: string
  progress: number
}

function OwnerCell({ name, email, team, progress }: OwnerCellProps) {
  const initials = getInitials(name, email)
  const displayName = name || email
  const momentum = Number.isFinite(progress) ? Math.round(progress) : undefined

  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 via-primary/30 to-primary/50 text-sm font-semibold text-primary dark:from-primary/30 dark:via-primary/40 dark:to-primary/60">
        {initials}
      </span>
      <div className="space-y-1 text-sm">
        <p className="font-semibold text-foreground">{displayName}</p>
        {team ? <p className="text-xs text-muted-foreground">{team}</p> : null}
        {momentum != null ? <p className="text-xs text-muted-foreground">Momentum {momentum}%</p> : null}
      </div>
    </div>
  )
}

type MobileObjectiveCardProps = {
  objective: any
  isSelected: boolean
  onSelect: (selected: boolean) => void
}

function MobileObjectiveCard({ objective, isSelected, onSelect }: MobileObjectiveCardProps) {
  return (
    <div className={cn(
      "rounded-xl border border-border/60 bg-card p-4 shadow-sm transition-all hover:shadow-md",
      isSelected && "ring-2 ring-primary/20 border-primary/40"
    )}>
      <div className="flex items-start gap-3">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onSelect}
          className="mt-1"
          aria-label={`Select ${objective.title}`}
        />
        <div className="flex-1 min-w-0">
          <Link
            href={`/okrs/${objective.id}`}
            className="text-base font-semibold text-foreground hover:text-primary transition-colors"
          >
            {objective.title}
          </Link>

          <div className="flex items-center gap-2 mt-2">
            <ObjectiveStatusBadge status={objective.status} />
            <ProgressChip value={objective.progress} />
            <span className="text-sm font-medium text-muted-foreground">
              {Math.round(objective.progress)}%
            </span>
          </div>

          <div className="flex items-center justify-between mt-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>{objective.owner.name || objective.owner.email}</span>
              {objective.team && <span>•</span>}
              {objective.team && <span>{objective.team.name}</span>}
            </div>
            <Badge variant="outline" className="text-xs">
              {objective.cycle}
            </Badge>
          </div>

          {objective.keyResults.length > 0 && (
            <div className="mt-3 space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Key Results ({objective.keyResults.length})
              </p>
              <div className="space-y-1">
                {objective.keyResults.slice(0, 2).map((kr: any) => (
                  <div key={kr.id} className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <span className="text-xs text-foreground truncate flex-1 mr-2">{kr.title}</span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {Math.round(kr.progress ?? 0)}%
                    </span>
                  </div>
                ))}
                {objective.keyResults.length > 2 && (
                  <p className="text-xs text-muted-foreground text-center">
                    +{objective.keyResults.length - 2} more
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
