'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { StatusChip } from '@/components/check-ins/StatusChip'
import { strings } from '@/config/strings'
import { toast } from 'sonner'
import { calculateObjectiveProgress, calculateKRProgress } from '@/lib/utils'
import { maybeHandleDemoRequest } from '@/lib/demo/api'

const schema = z.object({
  value: z.coerce.number().min(0),
  status: z.enum(['GREEN', 'YELLOW', 'RED']),
  comment: z.string().max(500).optional().or(z.literal('')),
})

type KeyResultProgress = {
  id: string
  target: number
  current: number
  weight?: number
  progress?: number
}

type ObjectiveCache = {
  objective?: {
    keyResults?: KeyResultProgress[]
    progress?: number
  }
}

type ObjectivesCache = {
  objectives?: Array<{
    keyResults?: KeyResultProgress[]
    progress?: number
  }>
}

type ProgressPayload = {
  objectiveId: string
  objectiveProgress: number
  objectiveScore: number
  keyResults: Array<Required<KeyResultProgress>>
}

type CheckInApiResponse = {
  ok: boolean
  data: {
    checkIn: {
      id: string
      keyResultId: string
      value: number
      status: string
      comment: string | null
      weekStart: string
      userId: string
    }
    progress?: ProgressPayload
  }
}

type Values = z.infer<typeof schema>

type QuickCheckInRowProps = {
  keyResultId: string
  current: number
  unit?: string | null
  onSuccess?: () => void
}

export function QuickCheckInRow({
  keyResultId,
  current,
  unit,
  onSuccess,
}: QuickCheckInRowProps) {
  const queryClient = useQueryClient()

  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { value: current ?? 0, status: 'GREEN', comment: '' },
  })

  const mutate = useMutation<CheckInApiResponse, Error, Values>({
    mutationFn: async (values: Values) => {
      const demoPayload = maybeHandleDemoRequest<CheckInApiResponse>('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyResultId, ...values }),
      })
      if (demoPayload !== null) {
        return demoPayload
      }
      const res = await fetch('/api/check-ins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ keyResultId, ...values }),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error || 'Failed to save check-in')
      }
      return res.json()
    },
    onMutate: async (values) => {
      const toastId = `check-in-${keyResultId}`
      toast.loading(strings.toasts.checkIns.loading, { id: toastId })

      const objectiveSnapshots = queryClient.getQueriesData<ObjectiveCache>({ queryKey: ['objective'] })
      const objectivesSnapshots = queryClient.getQueriesData<ObjectivesCache>({ queryKey: ['objectives'] })

      function updateObjectiveData(data: ObjectiveCache) {
        if (!data?.objective) return data
        const containsKR = data.objective.keyResults?.some((kr) => kr.id === keyResultId)
        if (!containsKR) return data

        const keyResults = data.objective.keyResults.map((kr) => {
          if (kr.id !== keyResultId) return kr
          const nextProgress = calculateKRProgress(values.value, kr.target)
          return { ...kr, current: values.value, progress: nextProgress }
        })

        const progress = calculateObjectiveProgress(
          keyResults.map((kr) => ({ weight: kr.weight ?? 0, progress: kr.progress ?? calculateKRProgress(kr.current, kr.target) }))
        )

        return { ...data, objective: { ...data.objective, keyResults, progress } }
      }

      function updateObjectivesData(data: ObjectivesCache) {
        if (!data?.objectives) return data
        const objectives = data.objectives.map((objective) => {
          const hasKR = objective.keyResults?.some((kr) => kr.id === keyResultId)
          if (!hasKR) return objective

          const keyResults = objective.keyResults.map((kr) => {
            if (kr.id !== keyResultId) return kr
            const nextProgress = calculateKRProgress(values.value, kr.target)
            return { ...kr, current: values.value, progress: nextProgress }
          })

          const progress = calculateObjectiveProgress(
            keyResults.map((kr) => ({ weight: kr.weight ?? 0, progress: kr.progress ?? calculateKRProgress(kr.current, kr.target) }))
          )

          return { ...objective, keyResults, progress }
        })

        return { ...data, objectives }
      }

      objectiveSnapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, updateObjectiveData(data))
      })

      objectivesSnapshots.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, updateObjectivesData(data))
      })

      return {
        toastId,
        objectiveSnapshots,
        objectivesSnapshots,
      }
    },
    onSuccess: (result, values, context) => {
      if (context?.toastId) {
        toast.success(strings.toasts.checkIns.success, { id: context.toastId })
      }
      if (result?.ok && result.data?.progress) {
        const payload = result.data.progress

        const applyServerObjective = (data: ObjectiveCache) => {
          if (!data?.objective?.keyResults) return data
          if (!data.objective.keyResults.some((kr) => kr.id === keyResultId)) return data
          return {
            ...data,
            objective: {
              ...data.objective,
              progress: payload.objectiveProgress,
              keyResults: data.objective.keyResults.map((kr) => {
                const updated = payload.keyResults.find((item) => item.id === kr.id)
                return updated ? { ...kr, current: updated.current, progress: updated.progress } : kr
              }),
            },
          }
        }

        const applyServerObjectives = (data: ObjectivesCache) => {
          if (!data?.objectives) return data
          return {
            ...data,
            objectives: data.objectives.map((objective) => {
              if (!objective.keyResults?.some((kr) => kr.id === keyResultId)) return objective
              return {
                ...objective,
                progress: payload.objectiveProgress,
                keyResults: objective.keyResults.map((kr) => {
                  const updated = payload.keyResults.find((item) => item.id === kr.id)
                  return updated ? { ...kr, current: updated.current, progress: updated.progress } : kr
                }),
              }
            }),
          }
        }

        context?.objectiveSnapshots?.forEach(([queryKey]) => {
          queryClient.setQueryData<ObjectiveCache>(queryKey, (previous) => applyServerObjective(previous ?? {}))
        })
        context?.objectivesSnapshots?.forEach(([queryKey]) => {
          queryClient.setQueryData<ObjectivesCache>(queryKey, (previous) => applyServerObjectives(previous ?? {}))
        })
      }
      form.reset({ value: values.value, status: values.status, comment: '' })
      onSuccess?.()
    },
    onError: (error: Error, _values, context) => {
      if (context?.toastId) {
        toast.error(error?.message || strings.toasts.checkIns.error, { id: context.toastId })
      }
      context?.objectiveSnapshots?.forEach(([queryKey, data]) => {
        queryClient.setQueryData<ObjectiveCache>(queryKey, data)
      })
      context?.objectivesSnapshots?.forEach(([queryKey, data]) => {
        queryClient.setQueryData<ObjectivesCache>(queryKey, data)
      })
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['objective'] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
      queryClient.invalidateQueries({ queryKey: ['check-ins', keyResultId] })
    },
  })

  return (
    <div className="flex items-start gap-3" data-testid={`my-okrs-kr-${keyResultId}`}>
      <Form {...form}>
        <form
          aria-busy={mutate.isPending}
          className="flex flex-1 flex-col gap-2 rounded-2xl border border-border/60 bg-card/70 p-3 shadow-soft sm:flex-row sm:items-center"
          onSubmit={form.handleSubmit((v) => mutate.mutate(v))}
        >
          <FormField
            control={form.control}
            name="value"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    data-testid={`my-okrs-value-${keyResultId}`}
                    type="number"
                    step="any"
                    min="0"
                    className="rounded-full"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger data-testid={`my-okrs-status-${keyResultId}`} className="h-10 rounded-full px-4">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent align="start">
                      <SelectItem value="GREEN">GREEN</SelectItem>
                      <SelectItem value="YELLOW">YELLOW</SelectItem>
                      <SelectItem value="RED">RED</SelectItem>
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="comment"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormControl>
                  <Input data-testid={`my-okrs-comment-${keyResultId}`} placeholder={strings.inputs.optionalComment} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            data-testid={`my-okrs-save-${keyResultId}`}
            type="submit"
            disabled={mutate.isPending}
            aria-live="polite"
            className="rounded-full"
          >
            {mutate.isPending ? strings.buttons.saving : strings.buttons.save}
          </Button>
          <StatusChip
            data-testid={`status-chip-${keyResultId}`}
            status={form.watch('status')}
            className="ml-auto"
          />
        </form>
      </Form>
      {unit ? <span className="text-xs text-muted-foreground">{unit}</span> : null}
    </div>
  )
}
