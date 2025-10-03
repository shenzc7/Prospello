'use client'

import { Input } from '@/components/ui/input'

type ParentOption = {
  id: string
  title: string
  cycle: string
}

type ParentSelectorProps = {
  field: {
    value?: string | null
    onChange: (value: string) => void
  }
  options: ParentOption[]
  search: string
  onSearch: (value: string) => void
  loading: boolean
}

export function ObjectiveParentSelector({ field, options, search, onSearch, loading }: ParentSelectorProps) {
  return (
    <div className="space-y-3">
      <select
        value={field.value ?? ''}
        onChange={(event) => field.onChange(event.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">No parent</option>
        {options.map((objective) => (
          <option key={objective.id} value={objective.id}>
            {objective.title} ({objective.cycle})
          </option>
        ))}
      </select>
      <Input
        placeholder="Search objectives..."
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      {loading ? <p className="text-xs text-muted-foreground">Loading objectives…</p> : null}
    </div>
  )
}
