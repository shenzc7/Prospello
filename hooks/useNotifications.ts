import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface AppNotification {
  id: string
  userId: string
  type: string
  message: string
  read: boolean
  metadata: string | null
  createdAt: string
}

type NotificationResponse =
  | AppNotification[]
  | {
    notifications: AppNotification[]
    unread: number
  }

export function useNotifications() {
  const queryClient = useQueryClient()

  const { data, isLoading } = useQuery<NotificationResponse>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await fetch('/api/notifications')
      if (!res.ok) throw new Error('Failed to fetch notifications')
      return res.json()
    },
  })

  const notifications = Array.isArray(data) ? data : data?.notifications ?? []
  const unread = Array.isArray(data) ? data.filter((n) => !n.read).length : data?.unread ?? 0

  const markReadMutation = useMutation({
    mutationFn: async (ids?: string[]) => {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, all: !ids }),
      })
      if (!res.ok) throw new Error('Failed to update notifications')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    },
  })

  return {
    notifications,
    unread,
    isLoading,
    markAsRead: (ids?: string[]) => markReadMutation.mutate(ids),
    markAllRead: () => markReadMutation.mutate(undefined),
  }
}
