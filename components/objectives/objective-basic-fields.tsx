'use client'

import { Control, useWatch } from 'react-hook-form'

import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ObjectiveFormData } from '@/lib/schemas'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type Props = {
  control: Control<ObjectiveFormData>
}

export function ObjectiveBasicFields({ control }: Props) {
  const progressType = useWatch({ control, name: 'progressType' })

  return (
    <>
      <div className="grid gap-6 lg:grid-cols-2">
        <FormField
          control={control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objective Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Increase customer satisfaction" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="cycle"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cycle</FormLabel>
              <FormControl>
                <Input placeholder="Q1 2025" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="startAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Start Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="endAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>End Date</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="description"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Description</FormLabel>
            <FormControl>
              <Textarea rows={4} placeholder="Why this objective matters" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <FormField
          control={control}
          name="progressType"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Progress Tracking</FormLabel>
              <Select value={field.value} onValueChange={field.onChange}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Automatic" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="AUTOMATIC">Automatic from key results</SelectItem>
                  <SelectItem value="MANUAL">Manual (enter %)</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {progressType === 'MANUAL' && (
          <FormField
            control={control}
            name="progress"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Manual progress (%)</FormLabel>
                <FormControl>
                  <Input type="number" min={0} max={100} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </div>
    </>
  )
}
