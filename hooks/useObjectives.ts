'use client'

import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'


export type ObjectiveStatusValue = 'NOT_STARTED' | 'IN_PROGRESS' | 'AT_RISK' | 'DONE'

type KeyResult = {
  id: string
  title: string
  weight: number
  target: number
  current: number
  unit?: string | null
  progress: number
  initiativeCount?: number
  initiatives?: Array<{
    id: string
    title: string
    status: string
    createdAt: string
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
  progressType?: 'AUTOMATIC' | 'MANUAL'
  priority?: number
  weight?: number
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
    goalType?: 'COMPANY' | 'DEPARTMENT' | 'TEAM' | 'INDIVIDUAL'
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

export function evictObjectiveFromCache(queryClient: QueryClient, objectiveId: string) {
  const snapshots = queryClient.getQueriesData<ObjectivesResponse>({ queryKey: ['objectives'] })
  snapshots.forEach(([queryKey, data]) => {
    if (!data?.objectives?.length) return
    const nextObjectives = data.objectives.filter((objective) => objective.id !== objectiveId)
    if (nextObjectives.length !== data.objectives.length) {
      queryClient.setQueryData(queryKey, { ...data, objectives: nextObjectives })
    }
  })
  queryClient.removeQueries({ queryKey: ['objective', objectiveId], exact: true })
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
      const body: unknown = await res.json()
      const errorField = (body as { error?: unknown })?.error
      if (typeof errorField === 'string') {
        detail = errorField
      } else if (errorField && typeof errorField === 'object') {
        // Prefer structured API error message if present
        const msg =
          typeof (errorField as { msg?: unknown }).msg === 'string'
            ? (errorField as { msg?: string }).msg
            : typeof (errorField as { message?: unknown }).message === 'string'
              ? (errorField as { message?: string }).message
              : null

        // Extract first validation issue if available (e.g., Zod issues from API)
        const details = (errorField as { details?: unknown }).details
        const firstIssue = Array.isArray(details) ? details[0] : null
        const issueMessage =
          firstIssue && typeof (firstIssue as { message?: unknown }).message === 'string'
            ? (firstIssue as { message?: string }).message
            : null
        const issuePath =
          firstIssue && Array.isArray((firstIssue as { path?: unknown }).path) && (firstIssue as { path: unknown[] }).path.length
            ? `${(firstIssue as { path: unknown[] }).path.join('.')}: `
            : ''

        if (msg) {
          detail = issueMessage ? `${msg}: ${issuePath}${issueMessage}` : msg
        } else if (issueMessage) {
          detail = `${issuePath}${issueMessage}`
        } else {
          detail = JSON.stringify(errorField)
        }
      } else if (typeof (body as { message?: unknown })?.message === 'string') {
        detail = (body as { message: string }).message
      } else if (body) {
        detail = JSON.stringify(body)
      }
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
    staleTime: 30 * 1000,
    gcTime: 5 * 60 * 1000,
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
  progressType: 'AUTOMATIC' | 'MANUAL'
  progress?: number
  priority: number
  weight: number
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

  return useQuery<{ teams: Array<{ id: string; name: string; members?: Array<{ id: string; name?: string | null; email: string; role: string }> }> }, Error>({
    queryKey: ['teams', search],
    queryFn: () => fetchJSON(`/api/teams${suffix}`),
  })
}

export function useTeam(id: string) {
  return useQuery<{ team: { id: string; name: string; members: Array<{ id: string; name?: string | null; email: string; role: string }>; objectives: Array<{ id: string; title: string; status: string; progress: number }> } }, Error>({
    queryKey: ['team', id],
    queryFn: () => fetchJSON(`/api/teams/${id}`),
    enabled: Boolean(id),
  })
}
