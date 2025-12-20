'use client'

import React from 'react'
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  formatISO,
  isAfter,
  isBefore,
  isEqual,
  isSameDay,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek
} from 'date-fns'
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Filter } from 'lucide-react'

import { cn } from '@/lib/ui'

type DateRangePickerProps = {
  from?: string
  to?: string
  onChange: (from?: string, to?: string) => void
  label?: string
}

function parseDate(value?: string) {
  if (!value) return undefined
  const parsed = parseISO(value)
  return Number.isNaN(parsed.getTime()) ? undefined : parsed
}

function formatDisplay(value?: string) {
  const date = parseDate(value)
  return date ? format(date, 'MM/dd/yyyy') : ''
}

export function DateRangePicker({ from, to, onChange, label = 'Date range' }: DateRangePickerProps) {
  const fromDate = parseDate(from)
  const toDate = parseDate(to)
  const initialMonth = fromDate ?? toDate ?? new Date()
  const [month, setMonth] = React.useState<Date>(initialMonth)
  const [open, setOpen] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (!containerRef.current) return
      if (!open) return
      if (containerRef.current.contains(event.target as Node)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const days = React.useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 0 })
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 0 })
    const slots: Date[] = []
    let current = start
    while (isBefore(current, end) || isSameDay(current, end)) {
      slots.push(current)
      current = new Date(current.getFullYear(), current.getMonth(), current.getDate() + 1)
    }
    return slots
  }, [month])

  const onSelectDay = (day: Date) => {
    if (!fromDate || (fromDate && toDate)) {
      onChange(formatISO(day, { representation: 'date' }), undefined)
      setMonth(day)
      return
    }

    if (isAfter(day, fromDate) || isEqual(day, fromDate)) {
      onChange(formatISO(fromDate, { representation: 'date' }), formatISO(day, { representation: 'date' }))
    } else {
      onChange(formatISO(day, { representation: 'date' }), formatISO(fromDate, { representation: 'date' }))
      setMonth(day)
    }
  }

  const isInRange = (day: Date) => {
    if (fromDate && toDate) {
      return (isAfter(day, fromDate) && isBefore(day, toDate)) || isSameDay(day, fromDate) || isSameDay(day, toDate)
    }
    return false
  }

  const isEdge = (day: Date) => (fromDate && isSameDay(day, fromDate)) || (toDate && isSameDay(day, toDate))

  const clear = () => {
    onChange(undefined, undefined)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        className="flex items-center gap-2 rounded-2xl border border-border/70 bg-gradient-to-b from-background/95 to-card/90 px-3 py-2 shadow-soft backdrop-blur transition hover:border-border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
        aria-label={label}
        onClick={() => setOpen((prev) => !prev)}
      >
        <Filter className="h-4 w-4 text-muted-foreground" />
        <div className="flex items-center gap-2 text-left">
          <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
            <CalendarIcon className="h-4 w-4 text-primary" />
            <span className="min-w-[88px] text-sm font-medium tabular-nums text-foreground/90">
              {formatDisplay(from) || 'Start'}
            </span>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">to</span>
          <div className="flex items-center gap-2 rounded-xl bg-background/70 px-3 py-2">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span className="min-w-[88px] text-sm font-medium tabular-nums text-foreground/90">
              {formatDisplay(to) || 'End'}
            </span>
          </div>
        </div>
      </button>
      {open ? (
        <div className="absolute right-0 z-50 mt-2 w-[320px] rounded-2xl border border-border/70 bg-popover/95 p-4 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 pb-3">
          <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
            {format(month, 'MMM yyyy')}
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-primary/10"
              aria-label="Previous month"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setMonth((m) => addMonths(m, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-primary/10"
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
            <div key={day} className="py-1">
              {day}
            </div>
          ))}
        </div>
        <div className="mt-1 grid grid-cols-7 gap-1">
          {days.map((day) => {
            const disabled = !isSameMonth(day, month)
            const selected = isEdge(day)
            const inRange = isInRange(day)
            return (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => onSelectDay(day)}
                className={cn(
                  'relative flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition',
                  disabled && 'text-muted-foreground/40',
                  !disabled && 'hover:bg-primary/10 hover:text-primary',
                  inRange && 'bg-primary/10 text-primary',
                  selected && 'bg-primary text-primary-foreground hover:bg-primary'
                )}
                aria-label={format(day, 'PPP')}
              >
                {format(day, 'd')}
              </button>
            )
          })}
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-primary/20" />
            <span>In range</span>
            <span className="h-3 w-3 rounded-full bg-primary" />
            <span>Selected</span>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-xs font-semibold text-primary transition hover:underline"
          >
            Clear
          </button>
        </div>
      </div>
      ) : null}
    </div>
  )
}















