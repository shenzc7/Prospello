'use client'

import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const NO_PARENT = '__no_parent__'

type ParentOption = {
  id: string
  title: string
  cycle: string
  goalType?: string
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
  canHaveNoParent: boolean
}

export function ObjectiveParentSelector({ field, options, search, onSearch, loading, canHaveNoParent }: ParentSelectorProps) {
  return (
    <div className="space-y-3">
      <Select
        value={field.value ?? NO_PARENT}
        onValueChange={(value) => field.onChange(value === NO_PARENT ? '' : value)}
      >
        <SelectTrigger className="h-11">
          <SelectValue placeholder="No parent" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_PARENT} disabled={!canHaveNoParent}>
            No parent
          </SelectItem>
          {options.map((objective) => (
            <SelectItem key={objective.id} value={objective.id}>
              {objective.title} ({objective.cycle})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Search objectives..."
        value={search}
        onChange={(event) => onSearch(event.target.value)}
      />
      {loading ? <p className="text-xs text-muted-foreground">Loading objectives…</p> : null}
    </div>
  )
}
