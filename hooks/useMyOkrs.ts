'use client'

import { useObjectives, type ObjectivesQueryParams } from '@/hooks/useObjectives'

export type UseMyOkrsParams = Pick<ObjectivesQueryParams, 'cycle' | 'ownerId'>

export function useMyOkrs(params: UseMyOkrsParams = {}) {
  return useObjectives({ ...params, limit: 100 })
}
