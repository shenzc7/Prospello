'use client'

import { useQuery } from '@tanstack/react-query'

import { fetchJSON } from '@/hooks/useObjectives'
import type { CheckInSummary } from '@/lib/checkin-summary'

export function useCheckInSummary(enabled = true) {
  return useQuery<CheckInSummary, Error>({
    queryKey: ['check-in-summary'],
    queryFn: () => fetchJSON<CheckInSummary>('/api/check-ins/summary'),
    // Don't block rendering - load in background
    enabled,
    // Keep stale data longer since this is expensive
    staleTime: 60 * 1000, // 1 minute
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}
