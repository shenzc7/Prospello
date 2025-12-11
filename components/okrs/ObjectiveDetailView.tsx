'use client'

import { useState, type ReactNode } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { CheckInDrawer } from '@/components/okrs/CheckInDrawer'
import { ProgressChip } from '@/components/okrs/ProgressChip'
import { HistoryPanel } from '@/components/check-ins/HistoryPanel'
import { CommentsPanel } from '@/components/collaboration/CommentsPanel'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { Button } from '@/components/ui/button'
import { strings } from '@/config/strings'
import { type Objective, useObjective } from '@/hooks/useObjectives'
import { getFiscalQuarterLabel } from '@/lib/india'
import { fmtPercent, fmtMetric } from '@/lib/ui'
import { calculateKRProgress } from '@/lib/utils'

const INR_REGEX = /₹|inr|rupee/i

async function deleteResource(path: string) {
  const response = await fetch(path, {
    method: 'DELETE',
    credentials: 'include',
  })

  if (!response.ok) {
    let message = 'Request failed'
    try {
      const body = await response.json()
      message = body.error ?? message
    } catch {
      // ignore JSON parse errors
    }
    throw new Error(message)
  }
}

type KeyResult = Objective['keyResults'][number]
type Initiative = NonNullable<KeyResult['initiatives']>[number]

export function ObjectiveDetailView({ objectiveId }: { objectiveId: string }) {
  const { data, isLoading, isError, error } = useObjective(objectiveId)
  const router = useRouter()
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const deleteObjective = useMutation({
    mutationFn: async () => deleteResource(`/api/objectives/${objectiveId}`),
    onSuccess: () => {
      toast.success(strings.toasts.objectives.deleted)
      queryClient.invalidateQueries({ queryKey: ['objective', objectiveId] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      setConfirmDelete(false)
      router.push('/okrs')
    },
    onError: (err: Error) => toast.error(err?.message ?? strings.toasts.objectives.deleteError),
  })

  if (isLoading) {
    return <SkeletonRow lines={4} />
  }

  if (isError || !data?.objective) {
    return (
      <EmptyState
        title={strings.emptyStates.missingObjective.title}
        description={error?.message ?? strings.emptyStates.missingObjective.description}
        action={
          <Button asChild className="rounded-full">
            <Link href="/okrs">{strings.emptyStates.missingObjective.actionLabel}</Link>
          </Button>
        }
      />
    )
  }

  const objective = data.objective

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/80 px-5 py-5 shadow-soft">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{objective.cycle}</p>
          <h1 className="text-2xl font-semibold" data-testid="okrs-detail-title">
            {objective.title}
          </h1>
          <p className="text-sm text-muted-foreground">
            {strings.labels.ownerPrefix} {objective.owner.name ?? objective.owner.email}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProgressChip value={objective.progress} withLabel testId="okrs-progress" className="rounded-full px-4" />
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteObjective.isPending}
          >
            {strings.buttons.deleteObjective}
          </Button>
        </div>
      </header>

      {objective.description ? (
        <p className="rounded-2xl border border-border/60 bg-card/70 p-5 text-sm leading-relaxed text-muted-foreground shadow-soft">
          {objective.description}
        </p>
      ) : null}

      <section className="grid gap-4 md:grid-cols-4">
        <MetaCard label={strings.labels.start} value={new Date(objective.startAt).toLocaleDateString()} />
        <MetaCard label={strings.labels.end} value={new Date(objective.endAt).toLocaleDateString()} />
        <MetaCard label={strings.labels.fiscalQuarter} value={getFiscalQuarterLabel(objective.fiscalQuarter)} />
        <MetaCard
          label={strings.labels.alignedUnder}
          value={
            objective.parent ? (
              <Link className="text-sm font-medium text-primary underline-offset-4 hover:underline" href={`/okrs/${objective.parent.id}`}>
                {objective.parent.title}
              </Link>
            ) : (
              strings.labels.topLevelObjective
            )
          }
        />
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{strings.titles.keyResults}</h2>
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {strings.labels.weightsTotal}
          </span>
        </div>
        <div className="space-y-4">
          {objective.keyResults.map((keyResult) => (
            <KeyResultCard key={keyResult.id} objectiveId={objectiveId} keyResult={keyResult} />
          ))}
        </div>
      </section>

      <CommentsPanel
        objectiveId={objectiveId}
        keyResults={objective.keyResults.map((kr) => ({ id: kr.id, title: kr.title }))}
      />

      <ConfirmDialog
        open={confirmDelete}
        title={strings.dialogs.deleteObjective.title}
        description={strings.dialogs.deleteObjective.description}
        confirmLabel={strings.dialogs.deleteObjective.confirmLabel}
        confirmingLabel={strings.buttons.deleting}
        cancelLabel={strings.dialogs.deleteObjective.cancelLabel}
        isConfirming={deleteObjective.isPending}
        onCancel={() => {
          if (!deleteObjective.isPending) {
            setConfirmDelete(false)
          }
        }}
        onConfirm={() => {
          if (!deleteObjective.isPending) {
            deleteObjective.mutate()
          }
        }}
      />
    </div>
  )
}

type MetaCardProps = {
  label: string
  value: ReactNode
}

function MetaCard({ label, value }: MetaCardProps) {
  return (
    <div className="rounded-2xl border border-border/70 bg-card/70 p-4 text-sm shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 text-sm font-medium text-foreground">{value}</div>
    </div>
  )
}

function KeyResultCard({ objectiveId, keyResult }: { objectiveId: string; keyResult: KeyResult }) {
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const deleteKeyResult = useMutation({
    mutationFn: async () => deleteResource(`/api/key-results/${keyResult.id}`),
    onSuccess: () => {
      toast.success(strings.toasts.keyResults.deleted)
      queryClient.invalidateQueries({ queryKey: ['objective', objectiveId] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      setConfirmDelete(false)
    },
    onError: (err: Error) => toast.error(err?.message ?? strings.toasts.keyResults.error),
  })

  const progress = keyResult.progress ?? calculateKRProgress(keyResult.current, keyResult.target)

  return (
    <article className="space-y-4 rounded-2xl border border-border/70 bg-card/70 p-5 shadow-soft">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">{keyResult.title}</h3>
          <p className="text-xs text-muted-foreground">
            Weight {fmtPercent(keyResult.weight)} • Target {fmtMetric(keyResult.target, keyResult.unit)}
            {keyResult.unit && !INR_REGEX.test(keyResult.unit) ? ` ${keyResult.unit}` : ''}
          </p>
          <p className="text-xs text-muted-foreground">
            Current {fmtMetric(keyResult.current, keyResult.unit)}
            {keyResult.unit && !INR_REGEX.test(keyResult.unit) ? ` ${keyResult.unit}` : ''}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ProgressChip value={progress} testId={`kr-progress-${keyResult.id}`} className="rounded-full" />
          <CheckInDrawer
            keyResultId={keyResult.id}
            keyResultTitle={keyResult.title}
            current={keyResult.current}
            unit={keyResult.unit}
          />
          <Button
            type="button"
            variant="ghost"
            className="text-destructive hover:text-destructive"
            onClick={() => setConfirmDelete(true)}
            disabled={deleteKeyResult.isPending}
          >
            {strings.buttons.deleteKeyResult}
          </Button>
        </div>
      </div>

      <div className="space-y-2" data-testid={`kr-initiatives-${keyResult.id}`}>
        <div className="flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{strings.labels.initiatives}</p>
          <Button asChild variant="ghost" className="h-8 rounded-full px-3 text-xs">
            <Link href={`/initiatives?keyResultId=${keyResult.id}`}>{strings.buttons.manage}</Link>
          </Button>
        </div>
        {keyResult.initiatives && keyResult.initiatives.length ? (
          <ul className="space-y-2 text-sm">
            {keyResult.initiatives.map((initiative) => (
              <InitiativeRow
                key={initiative.id}
                objectiveId={objectiveId}
                initiative={initiative}
              />
            ))}
          </ul>
        ) : (
          <p className="text-xs text-muted-foreground">{strings.labels.initiativesEmpty}</p>
        )}
      </div>

      <HistoryPanel keyResultId={keyResult.id} toggleTestId={`kr-history-toggle-${keyResult.id}`} />

      <ConfirmDialog
        open={confirmDelete}
        title={strings.dialogs.deleteKeyResult.title}
        description={strings.dialogs.deleteKeyResult.description}
        confirmLabel={strings.dialogs.deleteKeyResult.confirmLabel}
        confirmingLabel={strings.buttons.deleting}
        cancelLabel={strings.dialogs.deleteKeyResult.cancelLabel}
        isConfirming={deleteKeyResult.isPending}
        onCancel={() => {
          if (!deleteKeyResult.isPending) {
            setConfirmDelete(false)
          }
        }}
        onConfirm={() => {
          if (!deleteKeyResult.isPending) {
            deleteKeyResult.mutate()
          }
        }}
      />
    </article>
  )
}

function InitiativeRow({ objectiveId, initiative }: { objectiveId: string; initiative: Initiative }) {
  const queryClient = useQueryClient()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const deleteInitiative = useMutation({
    mutationFn: async () => deleteResource(`/api/initiatives/${initiative.id}`),
    onSuccess: () => {
      toast.success(strings.toasts.initiatives.deleted)
      queryClient.invalidateQueries({ queryKey: ['objective', objectiveId] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      setConfirmDelete(false)
    },
    onError: (err: Error) => toast.error(err?.message ?? strings.toasts.initiatives.error),
  })

  return (
    <li className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
      <span>{initiative.title}</span>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{initiative.status}</span>
        <Button
          type="button"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => setConfirmDelete(true)}
          disabled={deleteInitiative.isPending}
        >
          {strings.buttons.deleteInitiative}
        </Button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title={strings.dialogs.deleteInitiative.title}
        description={strings.dialogs.deleteInitiative.description}
        confirmLabel={strings.dialogs.deleteInitiative.confirmLabel}
        confirmingLabel={strings.buttons.deleting}
        cancelLabel={strings.dialogs.deleteInitiative.cancelLabel}
        isConfirming={deleteInitiative.isPending}
        onCancel={() => {
          if (!deleteInitiative.isPending) {
            setConfirmDelete(false)
          }
        }}
        onConfirm={() => {
          if (!deleteInitiative.isPending) {
            deleteInitiative.mutate()
          }
        }}
      />
    </li>
  )
}
