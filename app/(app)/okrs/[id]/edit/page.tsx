'use client'

import { use, useMemo } from 'react'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { ObjectiveForm } from '@/components/objectives/objective-form'
import { useObjective } from '@/hooks/useObjectives'
import type { ObjectiveFormData } from '@/lib/schemas'

type EditOkrPageProps = {
  params: Promise<{
    id: string
  }>
}

export default function EditOkrPage({ params }: EditOkrPageProps) {
  const { id: objectiveId } = use(params)
  const { data, isLoading, isError, error } = useObjective(objectiveId)

  const initialValues = useMemo<Partial<ObjectiveFormData> | undefined>(() => {
    const objective = data?.objective
    if (!objective) return undefined

    return {
      title: objective.title,
      description: objective.description ?? '',
      cycle: objective.cycle,
      progressType: (objective.progressType as ObjectiveFormData['progressType']) || 'AUTOMATIC',
      progress: objective.progress,
      priority: objective.priority ?? 3,
      weight: objective.weight ?? 0,
      goalType: (objective.goalType as ObjectiveFormData['goalType']) || 'INDIVIDUAL',
      startAt: objective.startAt?.slice(0, 10),
      endAt: objective.endAt?.slice(0, 10),
      ownerId: objective.owner?.id,
      teamId: objective.team?.id ?? undefined,
      parentObjectiveId: objective.parent?.id ?? undefined,
      keyResults: objective.keyResults.map((kr) => ({
        title: kr.title,
        weight: kr.weight,
        target: kr.target,
        current: kr.current,
        unit: kr.unit ?? undefined,
      })),
    }
  }, [data?.objective])

  if (isLoading) {
    return <SkeletonRow lines={4} />
  }

  if (isError || !data?.objective) {
    return (
      <EmptyState
        title="Objective unavailable"
        description={error?.message || 'We could not load this objective or you may not have access.'}
        action={undefined}
      />
    )
  }

  if (!initialValues) {
    return (
      <EmptyState
        title="Missing data"
        description="We could not prepare the form for editing this objective."
        action={undefined}
      />
    )
  }

  return (
    <ObjectiveForm
      mode="edit"
      objectiveId={objectiveId}
      initialValues={initialValues}
      redirectPath="/okrs"
    />
  )
}
