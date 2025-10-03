'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ObjectiveBasicFields } from '@/components/objectives/objective-basic-fields'
import { ProgressChip } from '@/components/objectives/progress-chip'
import { ObjectiveParentSelector } from '@/components/objectives/objective-parent-selector'
import { KeyResultsSection } from '@/components/objectives/key-results-section'
import { useCreateObjective, useObjectives, useUpdateObjective } from '@/hooks/useObjectives'
import { strings } from '@/config/strings'
import { calculateObjectiveProgress, calculateKRProgress } from '@/lib/utils'
import { objectiveFormSchema, type ObjectiveFormData } from '@/lib/schemas'
import { toast } from 'sonner'

type ObjectiveFormProps = {
  mode: 'create' | 'edit'
  objectiveId?: string
  initialValues?: Partial<ObjectiveFormData>
  redirectPath?: string
}

const emptyKR = (weight = 100): ObjectiveFormData['keyResults'][number] => ({
  title: '',
  weight,
  target: 100,
  current: 0,
  unit: 'percent',
})

export function ObjectiveForm({ mode, objectiveId, initialValues, redirectPath = '/objectives' }: ObjectiveFormProps) {
  const router = useRouter()
  const [parentSearch, setParentSearch] = useState('')
  const createMutation = useCreateObjective()
  const updateMutation = useUpdateObjective(objectiveId || '')
  const parentQuery = useObjectives({ search: parentSearch })

  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      cycle: initialValues?.cycle ?? '',
      startAt: initialValues?.startAt ?? new Date().toISOString().slice(0, 10),
      endAt: initialValues?.endAt ?? new Date().toISOString().slice(0, 10),
      parentObjectiveId: initialValues?.parentObjectiveId ?? undefined,
      keyResults: initialValues?.keyResults && initialValues.keyResults.length > 0
        ? initialValues.keyResults
        : [emptyKR()],
    },
  })

  const { control, handleSubmit, formState } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'keyResults' })
  const keyResults = useWatch({ control, name: 'keyResults' }) ?? []

  const totalWeight = useMemo(
    () => keyResults.reduce((sum: number, kr: any) => sum + (Number(kr?.weight) || 0), 0),
    [keyResults]
  )

  const keyResultsError = (form.formState.errors.keyResults as { message?: string } | undefined)?.message

  const computedProgress = useMemo(() => {
    if (!keyResults.length) return 0
    const withProgress = keyResults.map((kr: any) => {
      const target = Number(kr?.target) || 0
      const current = Number(kr?.current) || 0
      const progress = calculateKRProgress(current, target)
      return { weight: Number(kr?.weight) || 0, progress }
    })
    return calculateObjectiveProgress(withProgress)
  }, [keyResults])

  useEffect(() => {
    if (totalWeight <= 100) {
      form.clearErrors('keyResults')
    }
  }, [totalWeight, form])

  const onSubmit = handleSubmit(async (values) => {
    if (totalWeight > 100) {
      form.setError('keyResults' as any, {
        type: 'manual',
        message: strings.errors.weightsExceeded,
      } as any)
      toast.error(strings.toasts.objectives.weightsExceeded)
      return
    }

    const payload = {
      title: values.title,
      description: values.description,
      cycle: values.cycle,
      startAt: values.startAt,
      endAt: values.endAt,
      parentObjectiveId: values.parentObjectiveId || null,
      keyResults: values.keyResults.map((kr) => ({
        title: kr.title,
        weight: kr.weight,
        target: kr.target,
        current: kr.current,
        unit: kr.unit,
      })),
    }

    const action = mode === 'create' ? strings.toasts.objectives.creating : strings.toasts.objectives.updating
    const successMessage = mode === 'create' ? strings.toasts.objectives.created : strings.toasts.objectives.updated

    const mutation = mode === 'create'
      ? createMutation.mutateAsync(payload)
      : updateMutation?.mutateAsync(payload)

    if (!mutation) return

    const result = await toast.promise(mutation, {
      loading: action,
      success: successMessage,
      error: (error: Error) => error?.message ?? strings.toasts.objectives.error,
    }) as unknown as { objective: { id: string } }

    router.push(`${redirectPath}/${result.objective.id}`)
  })

  const isSubmitting = formState.isSubmitting || createMutation.isPending || updateMutation?.isPending

  const parentOptions = (parentQuery.data?.objectives ?? []).filter((objective) => objective.id !== objectiveId)

  return (
    <Form {...form}>
      <form aria-busy={isSubmitting} onSubmit={onSubmit} className="space-y-8" role="form" aria-labelledby="form-title">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/80 px-5 py-4 shadow-soft">
          <div>
            <h1 id="form-title" className="text-xl font-semibold md:text-2xl">
              {mode === 'create' ? strings.titles.objectiveCreate : strings.titles.objectiveEdit}
            </h1>
            <p className="text-sm text-muted-foreground">{strings.descriptions.objectiveForm}</p>
          </div>
          <ProgressChip value={computedProgress} className="rounded-full" aria-label={`Progress: ${Math.round(computedProgress)}%`} />
        </header>

        <ObjectiveBasicFields control={control} />

        <FormField
          control={control}
          name="parentObjectiveId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Align Under (optional)</FormLabel>
              <ObjectiveParentSelector
                field={{
                  value: field.value,
                  onChange: (value) => field.onChange(value || undefined),
                }}
                options={parentOptions.map((objective) => ({
                  id: objective.id,
                  title: objective.title,
                  cycle: objective.cycle,
                }))}
                search={parentSearch}
                onSearch={setParentSearch}
                loading={parentQuery.isLoading}
              />
              <FormMessage />
            </FormItem>
          )}
        />

        <KeyResultsSection
          fields={fields}
          canAddMore={fields.length < 5}
          onAdd={() => append(emptyKR(0))}
          onRemove={(index) => remove(index)}
          totalWeight={totalWeight}
          error={keyResultsError}
        />

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push(redirectPath)}>
            {strings.buttons.cancel}
          </Button>
          <Button type="submit" disabled={isSubmitting} className="rounded-full" aria-live="polite">
            {isSubmitting
              ? strings.buttons.saving
              : mode === 'create'
                ? strings.buttons.createObjective
                : strings.buttons.saveObjective}
          </Button>
        </div>
      </form>
    </Form>
  )
}
