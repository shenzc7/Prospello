'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchJSON } from '@/hooks/useObjectives'
import type { CheckInSummary } from '@/lib/checkin-summary'

import { useDemo } from '@/components/demo/DemoContext'
import { useDemoData } from '@/hooks/useDemoData'

export function useCheckInSummary(enabled = true) {
  const { isEnabled, role } = useDemo()
  const { summary: demoSummary } = useDemoData(role)

  const queryResult = useQuery<CheckInSummary, Error>({
    queryKey: ['check-in-summary'],
    queryFn: () => fetchJSON<CheckInSummary>('/api/check-ins/summary'),
    // Don't block rendering - load in background
    enabled: enabled && !isEnabled,
    // Keep stale data longer since this is expensive
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })

  if (isEnabled) {
    return {
      ...queryResult,
      data: demoSummary,
      isLoading: false,
      isSuccess: true
    } as any
  }

  return queryResult
}
