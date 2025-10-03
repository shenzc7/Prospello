'use client'

import * as React from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { StatusChip } from '@/components/check-ins/StatusChip'
import { strings } from '@/config/strings'
import { toast } from 'sonner'
import { calculateObjectiveProgress, calculateKRProgress } from '@/lib/utils'

const schema = z.object({
  value: z.coerce.number().min(0),
  status: z.enum(['GREEN', 'YELLOW', 'RED']),
  comment: z.string().max(500).optional().or(z.literal('')),
})

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

  const mutate = useMutation({
    mutationFn: async (values: Values) => {
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

      const objectiveSnapshots = queryClient.getQueriesData<any>({ queryKey: ['objective'] })
      const objectivesSnapshots = queryClient.getQueriesData<any>({ queryKey: ['objectives'] })

      function updateObjectiveData(data: any) {
        if (!data?.objective) return data
        const containsKR = data.objective.keyResults?.some((kr: any) => kr.id === keyResultId)
        if (!containsKR) return data

        const keyResults = data.objective.keyResults.map((kr: any) => {
          if (kr.id !== keyResultId) return kr
          const nextProgress = calculateKRProgress(values.value, kr.target)
          return { ...kr, current: values.value, progress: nextProgress }
        })

        const progress = calculateObjectiveProgress(
          keyResults.map((kr: any) => ({ weight: kr.weight ?? 0, progress: kr.progress ?? calculateKRProgress(kr.current, kr.target) }))
        )

        return { ...data, objective: { ...data.objective, keyResults, progress } }
      }

      function updateObjectivesData(data: any) {
        if (!data?.objectives) return data
        const objectives = data.objectives.map((objective: any) => {
          const hasKR = objective.keyResults?.some((kr: any) => kr.id === keyResultId)
          if (!hasKR) return objective

          const keyResults = objective.keyResults.map((kr: any) => {
            if (kr.id !== keyResultId) return kr
            const nextProgress = calculateKRProgress(values.value, kr.target)
            return { ...kr, current: values.value, progress: nextProgress }
          })

          const progress = calculateObjectiveProgress(
            keyResults.map((kr: any) => ({ weight: kr.weight ?? 0, progress: kr.progress ?? calculateKRProgress(kr.current, kr.target) }))
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
    onSuccess: (_result, values, context) => {
      if (context?.toastId) {
        toast.success(strings.toasts.checkIns.success, { id: context.toastId })
      }
      form.reset({ value: values.value, status: values.status, comment: '' })
      onSuccess?.()
    },
    onError: (error: any, _values, context) => {
      if (context?.toastId) {
        toast.error(error?.message || strings.toasts.checkIns.error, { id: context.toastId })
      }
      context?.objectiveSnapshots?.forEach(([queryKey, data]: any[]) => {
        queryClient.setQueryData(queryKey, data)
      })
      context?.objectivesSnapshots?.forEach(([queryKey, data]: any[]) => {
        queryClient.setQueryData(queryKey, data)
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
                  <select
                    {...field}
                    data-testid={`my-okrs-status-${keyResultId}`}
                    className="flex h-10 rounded-full border border-input bg-background px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="GREEN">GREEN</option>
                    <option value="YELLOW">YELLOW</option>
                    <option value="RED">RED</option>
                  </select>
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
