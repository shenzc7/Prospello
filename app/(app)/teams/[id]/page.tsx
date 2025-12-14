'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Users, Plus, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { fetchJSON, useUserOptions } from '@/hooks/useObjectives'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { toast } from 'sonner'

type TeamDetail = {
  id: string
  name: string
  members: Array<{ id: string; name?: string | null; email: string; role: string }>
  objectives: Array<{ id: string; title: string; status: string; progress: number }>
}

export default function TeamDetailPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params?.id
  const queryClient = useQueryClient()
  const [selectedUser, setSelectedUser] = useState<string>('')
  const [teamName, setTeamName] = useState('')
  const { data: userOptions } = useUserOptions('')

  const teamQuery = useQuery<{ team: TeamDetail }>({
    queryKey: ['team', id],
    queryFn: () => fetchJSON(`/api/teams/${id}`),
    enabled: Boolean(id),
  })

  useEffect(() => {
    if (teamQuery.data?.team?.name) {
      setTeamName(teamQuery.data.team.name)
    }
  }, [teamQuery.data?.team?.name])

  const updateTeam = useMutation({
    mutationFn: (payload: { name?: string; memberIds?: string[] }) =>
      fetchJSON(`/api/teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team', id] })
      queryClient.invalidateQueries({ queryKey: ['teams'] })
      toast.success('Team updated')
    },
    onError: (err: Error) => toast.error(err?.message || 'Unable to update team'),
  })

  const handleAddMember = () => {
    if (!selectedUser || !teamQuery.data?.team) return
    const existingIds = teamQuery.data.team.members.map((m) => m.id)
    if (existingIds.includes(selectedUser)) {
      toast.info('User already on the team')
      return
    }
    updateTeam.mutate({ memberIds: [...existingIds, selectedUser] })
    setSelectedUser('')
  }

  const handleRemoveMember = (userId: string) => {
    const remaining = teamQuery.data?.team.members.filter((m) => m.id !== userId).map((m) => m.id) || []
    updateTeam.mutate({ memberIds: remaining })
  }

  const avgProgress = useMemo(() => {
    const objectives = teamQuery.data?.team.objectives ?? []
    if (!objectives.length) return 0
    return Math.round(objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length)
  }, [teamQuery.data?.team.objectives])

  const status = calculateTrafficLightStatus(avgProgress)
  const statusClasses = getTrafficLightClasses(status)

  if (teamQuery.isLoading) {
    return <p className="text-sm text-muted-foreground">Loading team…</p>
  }

  const loadError = teamQuery.error instanceof Error ? teamQuery.error.message : 'Unable to load team.'

  if (teamQuery.isError || !teamQuery.data?.team) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-destructive">{loadError}</p>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => teamQuery.refetch()} disabled={teamQuery.isFetching}>
            Retry
          </Button>
          <Button size="sm" variant="ghost" onClick={() => router.push('/teams')}>
            Back to teams
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
        <Badge className={`${statusClasses.bg} ${statusClasses.text}`}>Avg {avgProgress}%</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Users className="h-5 w-5" />
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                onBlur={() => updateTeam.mutate({ name: teamName })}
                className="border-none text-xl font-semibold focus-visible:ring-0"
              />
            </CardTitle>
            <CardDescription>Manage members and OKRs owned by this team.</CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Add member" />
              </SelectTrigger>
              <SelectContent>
                {(userOptions?.users ?? []).map((user) => (
                  <SelectItem key={user.id} value={user.id}>
                    {user.name || user.email} ({user.role})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleAddMember} disabled={!selectedUser || updateTeam.isPending}>
              <Plus className="h-4 w-4 mr-1" />
              Add to team
            </Button>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Members</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {teamQuery.data?.team.members.map((member) => (
                <div key={member.id} className="flex items-center justify-between rounded-lg border border-border/70 p-3">
                  <div>
                    <p className="font-semibold">{member.name || member.email}</p>
                    <p className="text-xs text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{member.role}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive"
                      onClick={() => handleRemoveMember(member.id)}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {!teamQuery.data?.team.members.length && (
                <p className="text-sm text-muted-foreground">No members yet.</p>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Objectives</h3>
            <div className="grid gap-2 md:grid-cols-2">
              {teamQuery.data?.team.objectives.map((obj) => {
                const classes = getTrafficLightClasses(calculateTrafficLightStatus(obj.progress))
                return (
                  <div key={obj.id} className="rounded-lg border border-border/70 p-3">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{obj.title}</p>
                      <Badge className={`${classes.bg} ${classes.text}`}>{obj.progress}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">{obj.status}</p>
                  </div>
                )
              })}
              {!teamQuery.data?.team.objectives.length && (
                <p className="text-sm text-muted-foreground">No objectives assigned to this team.</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
