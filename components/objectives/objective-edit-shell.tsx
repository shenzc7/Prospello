'use client'

import { ObjectiveForm } from '@/components/objectives/objective-form'
import { useObjective, type Objective } from '@/hooks/useObjectives'

function mapToFormData(objective: Objective) {
  return {
    title: objective.title,
    description: objective.description ?? '',
    cycle: objective.cycle,
    goalType: objective.goalType ?? 'INDIVIDUAL',
    startAt: objective.startAt.slice(0, 10),
    endAt: objective.endAt.slice(0, 10),
  ownerId: objective.owner?.id ?? undefined,
  teamId: objective.team?.id ?? undefined,
    parentObjectiveId: objective.parent?.id ?? undefined,
    keyResults: objective.keyResults.map((kr) => ({
      title: kr.title,
      weight: kr.weight,
      target: kr.target,
      current: kr.current,
      unit: kr.unit ?? '',
    })),
  }
}

export function ObjectiveEditShell({ objectiveId }: { objectiveId: string }) {
  const { data, isLoading, isError, error } = useObjective(objectiveId)

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading objective…</p>
  }

  if (isError || !data?.objective) {
    return <p className="text-sm text-red-600">{error?.message ?? 'Unable to load objective'}</p>
  }

  const initialValues = mapToFormData(data.objective)

  return <ObjectiveForm mode="edit" objectiveId={objectiveId} initialValues={initialValues} />
}
