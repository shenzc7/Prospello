'use client'

import { useEffect, useMemo, useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useRouter } from 'next/navigation'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { ObjectiveBasicFields } from '@/components/objectives/objective-basic-fields'
import { ProgressChip } from '@/components/objectives/progress-chip'
import { ObjectiveParentSelector } from '@/components/objectives/objective-parent-selector'
import { KeyResultsSection } from '@/components/objectives/key-results-section'
import { useCreateObjective, useObjectives, useUpdateObjective, useTeams, useUserOptions } from '@/hooks/useObjectives'
import { strings } from '@/config/strings'
import { calculateObjectiveProgress, calculateKRProgress } from '@/lib/utils'
import { objectiveFormSchema, type ObjectiveFormData } from '@/lib/schemas'
import { toast } from 'sonner'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'

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

const goalTypeOptions = [
  { value: 'COMPANY', label: 'Company', description: 'Org-wide objective owned by leadership' },
  { value: 'DEPARTMENT', label: 'Department', description: 'Functional objective aligned to the company goal' },
  { value: 'TEAM', label: 'Team', description: 'Team-level focus that ladders up to a department' },
  { value: 'INDIVIDUAL', label: 'Individual', description: 'Personal objective aligned to your team' },
] as const

export function ObjectiveForm({ mode, objectiveId, initialValues, redirectPath = '/objectives' }: ObjectiveFormProps) {
  const router = useRouter()
  const [parentSearch, setParentSearch] = useState('')
  const [ownerSearch, setOwnerSearch] = useState('')
  const [teamSearch, setTeamSearch] = useState('')
  const createMutation = useCreateObjective()
  const updateMutation = useUpdateObjective(objectiveId || '')
  const parentQuery = useObjectives({ search: parentSearch })
  const ownerQuery = useUserOptions(ownerSearch)
  const teamQuery = useTeams(teamSearch)
  const defaultStart = initialValues?.startAt ?? new Date().toISOString().slice(0, 10)
  const defaultEnd = initialValues?.endAt ?? (() => {
    const end = new Date()
    end.setDate(end.getDate() + 90)
    return end.toISOString().slice(0, 10)
  })()

  const form = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      title: initialValues?.title ?? '',
      description: initialValues?.description ?? '',
      cycle: initialValues?.cycle ?? '',
      progressType: initialValues?.progressType ?? 'AUTOMATIC',
      progress: initialValues?.progress ?? 0,
      priority: initialValues?.priority ?? 3,
      weight: initialValues?.weight ?? 0,
      goalType: initialValues?.goalType ?? 'INDIVIDUAL',
      startAt: defaultStart,
      endAt: defaultEnd,
      ownerId: initialValues?.ownerId,
      teamId: initialValues?.teamId,
      parentObjectiveId: initialValues?.parentObjectiveId ?? undefined,
      keyResults: initialValues?.keyResults && initialValues.keyResults.length > 0
        ? initialValues.keyResults
        : [emptyKR()],
    },
  })

  const { control, handleSubmit, formState } = form
  const { fields, append, remove } = useFieldArray({ control, name: 'keyResults' })
  const watchedKeyResults = useWatch({ control, name: 'keyResults' })
  const progressType = useWatch({ control, name: 'progressType' })
  const manualProgress = useWatch({ control, name: 'progress' })
  const goalType = useWatch({ control, name: 'goalType' })
  const cycle = useWatch({ control, name: 'cycle' })
  const startAt = useWatch({ control, name: 'startAt' })
  const endAt = useWatch({ control, name: 'endAt' })
  const teamId = useWatch({ control, name: 'teamId' })
  const keyResults = useMemo(
    () => (watchedKeyResults ?? []) as ObjectiveFormData['keyResults'],
    [watchedKeyResults]
  )

  const totalWeight = useMemo(
    () => keyResults.reduce((sum, kr) => sum + (Number(kr?.weight) || 0), 0),
    [keyResults]
  )

  const weightMismatch = totalWeight !== 100
  const keyResultsError =
    weightMismatch
      ? 'Distribute 100% across your key results to reflect priority'
      : (form.formState.errors.keyResults?.message as string | undefined)

  const computedProgress = useMemo(() => {
    if (progressType === 'MANUAL') {
      return Number(manualProgress) || 0
    }
    if (!keyResults.length) return 0
    const withProgress = keyResults.map((kr) => {
      const target = Number(kr?.target) || 0
      const current = Number(kr?.current) || 0
      const progress = calculateKRProgress(current, target)
      return { weight: Number(kr?.weight) || 0, progress }
    })
    return calculateObjectiveProgress(withProgress)
  }, [keyResults, progressType, manualProgress])

  const datesError = useMemo(() => {
    if (!startAt || !endAt) return ''
    const start = new Date(startAt)
    const end = new Date(endAt)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return ''
    return start >= end ? 'Start date must be before end date' : ''
  }, [startAt, endAt])

  useEffect(() => {
    if (!weightMismatch) {
      form.clearErrors('keyResults')
    }
  }, [weightMismatch, form])

  useEffect(() => {
    if (!datesError) {
      form.clearErrors(['startAt', 'endAt'])
    }
  }, [datesError, form])

  const onSubmit = handleSubmit(async (values) => {
    if (datesError) {
      form.setError('startAt', { type: 'manual', message: datesError })
      form.setError('endAt', { type: 'manual', message: datesError })
      toast.error(datesError)
      return
    }

    if (weightMismatch) {
      form.setError('keyResults', {
        type: 'manual',
        message: keyResultsError,
      })
      toast.error('Key result weights must add up to 100%')
      return
    }

    if (values.goalType === 'TEAM' && !values.teamId) {
      form.setError('teamId', {
        type: 'manual',
        message: 'Select a team for team objectives',
      })
      toast.error('Team objective needs a team owner')
      return
    }

    if (values.goalType !== 'COMPANY' && !values.parentObjectiveId) {
      form.setError('parentObjectiveId', {
        type: 'manual',
        message: 'Select a parent objective to keep alignment intact',
      })
      toast.error('Non-company objectives must align to a parent objective')
      return
    }

    const payload = {
      title: values.title,
      description: values.description,
      cycle: values.cycle,
      progressType: values.progressType,
      progress: values.progressType === 'MANUAL' ? Number(values.progress) || 0 : undefined,
      goalType: values.goalType,
      startAt: values.startAt,
      endAt: values.endAt,
      ownerId: values.ownerId,
      teamId: values.teamId,
      parentObjectiveId: values.parentObjectiveId || null,
      keyResults: values.keyResults.map((kr) => ({
        title: kr.title,
        weight: kr.weight,
        target: kr.target,
        current: kr.current,
        unit: kr.unit,
      })),
      priority: values.priority ?? 3,
      weight: values.weight ?? 0,
    }

    const action = mode === 'create' ? strings.toasts.objectives.creating : strings.toasts.objectives.updating
    const successMessage = mode === 'create' ? strings.toasts.objectives.created : strings.toasts.objectives.updated

    const mutation = mode === 'create'
      ? createMutation.mutateAsync(payload)
      : updateMutation?.mutateAsync(payload)

    if (!mutation) return

    try {
      const result = await toast.promise(mutation, {
        loading: action,
        success: successMessage,
        error: (error: Error) => error?.message ?? strings.toasts.objectives.error,
      }).unwrap()

      const newObjectiveId =
        (result as { objective?: { id?: string } })?.objective?.id ??
        (result as { data?: { objective?: { id?: string }; id?: string } })?.data?.objective?.id ??
        (result as { data?: { id?: string } })?.data?.id ??
        (result as { id?: string })?.id

      if (!newObjectiveId) {
        console.warn('Objective create/update returned unexpected shape', result)
        toast.error('Objective saved but missing ID in response')
        return
      }

      router.push(`${redirectPath}/${newObjectiveId}`)
    } catch (error) {
      console.error('Objective create/update failed', error)
    }
  })

  const isSubmitting = formState.isSubmitting || createMutation.isPending || updateMutation?.isPending

  const parentOptions = (parentQuery.data?.objectives ?? [])
    .filter((objective) => objective.id !== objectiveId)
    .filter((objective) => !cycle || objective.cycle === cycle)
  const allowedParentType =
    goalType === 'DEPARTMENT'
      ? 'COMPANY'
      : goalType === 'TEAM'
        ? 'DEPARTMENT'
        : goalType === 'INDIVIDUAL'
          ? 'TEAM'
          : null
  const alignmentFilteredParents = allowedParentType
    ? parentOptions.filter((objective) => objective.goalType === allowedParentType)
    : parentOptions.filter((objective) => !objective.goalType || objective.goalType === 'COMPANY')
  const disableSubmit = isSubmitting || weightMismatch || Boolean(datesError) || (goalType === 'TEAM' && !teamId)

  useEffect(() => {
    // Clear parent selection when cycle changes to prevent mismatched alignment that would fail on save
    const currentParentId = form.getValues('parentObjectiveId')
    if (!currentParentId) return
    const parent = alignmentFilteredParents.find((option) => option.id === currentParentId)
    if (!parent) {
      form.setValue('parentObjectiveId', undefined)
    }
  }, [cycle, alignmentFilteredParents, form])

  return (
    <Form {...form}>
      <form aria-busy={isSubmitting} onSubmit={onSubmit} className="space-y-8" role="form" aria-labelledby="form-title">
        <header className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border/80 bg-card/80 px-5 py-4 shadow-soft">
          <div>
            <h1 id="form-title" className="text-xl font-semibold md:text-2xl">
              {mode === 'create' ? strings.titles.objectiveCreate : strings.titles.objectiveEdit}
            </h1>
            <p className="text-sm text-muted-foreground">
              Capture the objective, align it to the right level, and set clear key results.
            </p>
          </div>
          <ProgressChip value={computedProgress} className="rounded-full" aria-label={`Progress: ${Math.round(computedProgress)}%`} />
        </header>

        <section className="grid gap-6 lg:grid-cols-[1.4fr,1fr]">
          <div className="space-y-6 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-soft">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Objective basics</p>
              <p className="text-sm text-muted-foreground">Cycle, timing, and why this objective matters.</p>
            </div>
            <ObjectiveBasicFields control={control} />
            {datesError ? <p className="text-sm font-medium text-destructive">{datesError}</p> : null}
          </div>

          <div className="space-y-4">
            <div className="space-y-4 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-soft">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Goal type</p>
                <p className="text-sm text-muted-foreground">Company → Department → Team → Individual</p>
              </div>
              <FormField
                control={control}
                name="goalType"
                render={({ field }) => (
                  <FormItem>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {goalTypeOptions.map((option) => {
                        const active = field.value === option.value
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => field.onChange(option.value)}
                            aria-pressed={active}
                            className={`rounded-xl border p-3 text-left transition ${
                              active ? 'border-primary bg-primary/5 ring-2 ring-primary/20' : 'border-border/70 hover:border-primary/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-foreground">{option.label}</span>
                              <span className={`text-xs font-semibold ${active ? 'text-primary' : 'text-muted-foreground'}`}>
                                {active ? 'Selected' : 'Choose'}
                              </span>
                            </div>
                            <p className="mt-1 text-sm text-muted-foreground">{option.description}</p>
                          </button>
                        )
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-4 rounded-2xl border border-border/80 bg-card/80 p-5 shadow-soft">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Alignment & ownership</p>
                <p className="text-sm text-muted-foreground">Connect to parent goals and set who owns this outcome.</p>
              </div>

              <FormField
                control={control}
                name="parentObjectiveId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Align under (optional)</FormLabel>
                    <ObjectiveParentSelector
                      field={{
                        value: field.value,
                        onChange: (value) => field.onChange(value || undefined),
                      }}
                      options={alignmentFilteredParents.map((objective) => ({
                        id: objective.id,
                        title: objective.title,
                        cycle: objective.cycle,
                        goalType: objective.goalType,
                      }))}
                      search={parentSearch}
                      onSearch={setParentSearch}
                      loading={parentQuery.isLoading}
                      canHaveNoParent={goalType === 'COMPANY'}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={control}
                  name="ownerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Owner (for managers/admins)</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Assign owner" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(ownerQuery.data?.users ?? []).map((user) => (
                            <SelectItem key={user.id} value={user.id}>
                              {user.name || user.email} ({user.role})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Input
                          placeholder="Search users"
                          value={ownerSearch}
                          onChange={(e) => setOwnerSearch(e.target.value)}
                        />
                        {ownerQuery.isLoading ? <span aria-live="polite">Loading…</span> : null}
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={control}
                  name="teamId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Team {goalType === 'TEAM' ? '(required)' : '(optional)'}</FormLabel>
                      <Select onValueChange={(value) => field.onChange(value || undefined)} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select team" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {(teamQuery.data?.teams ?? []).map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                      <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                        <Input
                          placeholder="Search teams"
                          value={teamSearch}
                          onChange={(e) => setTeamSearch(e.target.value)}
                        />
                        {teamQuery.isLoading ? <span aria-live="polite">Loading…</span> : null}
                      </div>
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-soft">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Key results</h2>
              <p className="text-sm text-muted-foreground">Add 1–5 measurable outcomes. Weights must total 100%.</p>
            </div>
            <span className={`text-sm font-medium ${weightMismatch ? 'text-destructive' : 'text-muted-foreground'}`}>
              Weight distributed: {totalWeight}%
            </span>
          </div>

          <KeyResultsSection
            fields={fields}
            canAddMore={fields.length < 5}
            onAdd={() => append(emptyKR(0))}
            onRemove={(index) => remove(index)}
            totalWeight={totalWeight}
            error={keyResultsError}
            footer={
              <p className="text-xs text-muted-foreground">
                Minimum one key result, maximum five. Use weights to show priority across the set.
              </p>
            }
          />
        </section>

        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="ghost" onClick={() => router.push(redirectPath)}>
            {strings.buttons.cancel}
          </Button>
          <Button type="submit" disabled={disableSubmit} className="rounded-full" aria-live="polite">
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
