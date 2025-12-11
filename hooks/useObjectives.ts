'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

export type ObjectiveStatusValue = 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'DONE'

type KeyResult = {
  id: string
  title: string
  weight: number
  target: number
  current: number
  unit?: string | null
  progress: number
  initiatives?: Array<{
    id: string
    title: string
    status: string
  }>
}

export type Objective = {
  id: string
  title: string
  description?: string | null
  cycle: string
  startAt: string
  endAt: string
  goalType?: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
  progress: number
  score?: number | null
  status: ObjectiveStatusValue
  fiscalQuarter: number
  createdAt: string
  owner: {
    id: string
    name?: string | null
    email: string
  }
  team?: {
    id: string
    name: string
  } | null
  parent?: {
    id: string
    title: string
  } | null
  children?: Array<{ id: string; title: string }>
  keyResults: KeyResult[]
  _count?: {
    children: number
  }
}

type ObjectivesResponse = {
  objectives: Objective[]
  pagination: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

type ObjectiveResponse = {
  objective: Objective
}

export async function fetchJSON<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
    credentials: 'include',
  })

  if (!res.ok) {
    let detail = 'Request failed'
    try {
      const body = await res.json()
      detail = body.error || detail
    } catch (_) {
      // ignore
    }
    throw new Error(detail)
  }

  const body = await res.json()

  if (body && typeof body === 'object' && 'ok' in body) {
    if (!body.ok) {
      throw new Error(body.error?.msg || 'Request failed')
    }
    return body.data as T
  }

  return body as T
}

export type ObjectivesQueryParams = {
  search?: string
  cycle?: string
  ownerId?: string
  teamId?: string
  fiscalQuarter?: number
  status?: ObjectiveStatusValue
  limit?: number
  offset?: number
}

type ObjectivesQueryOptions = {
  enabled?: boolean
}

export function useObjectives(params: ObjectivesQueryParams, options?: ObjectivesQueryOptions) {
  const query = new URLSearchParams()
  if (params.search) query.set('search', params.search)
  if (params.cycle) query.set('cycle', params.cycle)
  if (params.ownerId) query.set('ownerId', params.ownerId)
  if (params.teamId) query.set('teamId', params.teamId)
  if (params.fiscalQuarter) query.set('fiscalQuarter', String(params.fiscalQuarter))
  if (params.status) query.set('status', params.status)
  if (typeof params.limit === 'number') query.set('limit', String(params.limit))
  if (typeof params.offset === 'number') query.set('offset', String(params.offset))
  const suffix = query.toString() ? `?${query.toString()}` : ''

  return useQuery<ObjectivesResponse, Error>({
    queryKey: ['objectives', params],
    queryFn: () => fetchJSON(`/api/objectives${suffix}`),
    enabled: options?.enabled ?? true,
    staleTime: 30 * 1000, // 30 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
  })
}

export function useObjective(id: string | undefined) {
  return useQuery<ObjectiveResponse, Error>({
    queryKey: ['objective', id],
    queryFn: () => fetchJSON(`/api/objectives/${id}`),
    enabled: Boolean(id),
  })
}

type ObjectivePayload = {
  title: string
  description?: string | null
  cycle: string
  goalType: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
  startAt: string
  endAt: string
  ownerId?: string
  teamId?: string | null
  parentObjectiveId?: string | null
  keyResults: Array<{
    title: string
    weight: number
    target: number
    current: number
    unit?: string
  }>
}

export function useCreateObjective() {
  const queryClient = useQueryClient()
  return useMutation<ObjectiveResponse, Error, ObjectivePayload>({
    mutationFn: async (payload) =>
      fetchJSON('/api/objectives', {
        method: 'POST',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
    },
  })
}

export function useUpdateObjective(id: string) {
  const queryClient = useQueryClient()
  return useMutation<ObjectiveResponse, Error, Partial<ObjectivePayload>>({
    mutationFn: async (payload) =>
      fetchJSON(`/api/objectives/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['objective', id] })
      if (variables.keyResults) {
        queryClient.invalidateQueries({ queryKey: ['objectives'] })
      }
    },
  })
}

type UpdateObjectiveStatusInput = {
  id: string
  status: ObjectiveStatusValue
}

export function useUpdateObjectiveStatus() {
  const queryClient = useQueryClient()
  return useMutation<ObjectiveResponse, Error, UpdateObjectiveStatusInput>({
    mutationFn: ({ id, status }) =>
      fetchJSON(`/api/objectives/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['objective', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['objectives'] })
    },
  })
}

export function useUserOptions(search: string) {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  const suffix = query.toString() ? `?${query.toString()}` : ''

  return useQuery<{ users: Array<{ id: string; email: string; name?: string | null; role: string }> }, Error>({
    queryKey: ['user-options', search],
    queryFn: () => fetchJSON(`/api/users${suffix}`),
    enabled: true,
  })
}

export function useTeams(search: string) {
  const query = new URLSearchParams()
  if (search) query.set('search', search)
  const suffix = query.toString() ? `?${query.toString()}` : ''

  return useQuery<{ teams: Array<{ id: string; name: string }> }, Error>({
    queryKey: ['teams', search],
    queryFn: () => fetchJSON(`/api/teams${suffix}`),
    enabled: true,
  })
}
