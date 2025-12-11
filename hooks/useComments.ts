import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchJSON } from '@/hooks/useObjectives'

export type Comment = {
  id: string
  content: string
  objectiveId?: string | null
  keyResultId?: string | null
  createdAt: string
  user: {
    id: string
    name?: string | null
    email: string
  }
}

type CommentQueryParams = {
  objectiveId?: string
  keyResultId?: string | null
}

export function useComments(params: CommentQueryParams) {
  const queryClient = useQueryClient()
  const queryKey = ['comments', params.objectiveId, params.keyResultId]

  const { data, isLoading } = useQuery<{ comments: Comment[] }>({
    queryKey,
    queryFn: () => {
      const search = new URLSearchParams()
      if (params.objectiveId) search.set('objectiveId', params.objectiveId)
      if (params.keyResultId) search.set('keyResultId', params.keyResultId)
      const suffix = search.toString() ? `?${search.toString()}` : ''
      return fetchJSON(`/api/comments${suffix}`)
    },
    enabled: !!params.objectiveId || !!params.keyResultId,
  })

  const create = useMutation({
    mutationFn: async (payload: { content: string } & CommentQueryParams) => {
      return fetchJSON('/api/comments', {
        method: 'POST',
        body: JSON.stringify(payload),
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  const remove = useMutation({
    mutationFn: async (id: string) =>
      fetchJSON(`/api/comments/${id}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey })
    },
  })

  return {
    comments: data?.comments ?? [],
    isLoading,
    addComment: create.mutateAsync,
    deleteComment: remove.mutateAsync,
    isSaving: create.isPending,
  }
}
