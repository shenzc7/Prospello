'use client'

import { useFormContext } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { KRWeightSlider } from '@/components/okrs/KRWeightSlider'

type KeyResultFieldProps = {
  index: number
  onRemove: () => void
  canRemove: boolean
}

export function KeyResultFields({ index, onRemove, canRemove }: KeyResultFieldProps) {
  const { control } = useFormContext()

  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-4">
          <FormField
            control={control}
            name={`keyResults.${index}.title`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>Key Result Title</FormLabel>
                <FormControl>
                  <Input placeholder="Increase NPS to 70" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <FormField
              control={control}
              name={`keyResults.${index}.target`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Target</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`keyResults.${index}.current`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current</FormLabel>
                  <FormControl>
                    <Input type="number" step="any" {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={control}
              name={`keyResults.${index}.unit`}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit</FormLabel>
                  <FormControl>
                    <Input placeholder="percent" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {canRemove ? (
          <Button type="button" variant="ghost" onClick={onRemove} className="text-destructive">
            Remove
          </Button>
        ) : null}
      </div>

      <div className="mt-4">
        <FormField
          control={control}
          name={`keyResults.${index}.weight`}
          render={({ field }) => (
            <FormItem>
              <KRWeightSlider
                index={index}
                value={Number(field.value ?? 0)}
                onChange={(value) => field.onChange(value)}
                onBlur={field.onBlur}
              />
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}
