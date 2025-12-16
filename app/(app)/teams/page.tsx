'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { Users, Target, PlusCircle } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { useObjectives, useTeams, useUserOptions } from '@/hooks/useObjectives'
import { useSession } from 'next-auth/react'
import { UserRole } from '@/lib/rbac'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { HeatMap } from '@/components/analytics/HeatMap'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type ObjectiveData = {
  progress: number
  team?: { id: string; name: string }
  owner?: { email?: string }
}

type TeamCardProps = {
  team: { id: string; name: string; progress?: number; memberCount?: number; members?: Array<{ id: string; name?: string | null; email: string }> }
  objectives: ObjectiveData[]
  canManage?: boolean
  onRename?: (teamId: string, name: string) => Promise<void>
  onUpdateMembers?: (teamId: string, memberIds: string[]) => Promise<void>
  userOptions?: Array<{ id: string; name?: string | null; email: string; role: string }>
  onSearchUsers?: (value: string) => void
}

function TeamCard({ team, objectives, canManage, onRename, onUpdateMembers, userOptions = [], onSearchUsers }: TeamCardProps) {
  const teamObjectives = objectives.filter(obj => obj.team?.id === team.id)
  const avgProgress = typeof team.progress === 'number'
    ? team.progress
    : teamObjectives.length > 0
      ? teamObjectives.reduce((sum, obj) => sum + obj.progress, 0) / teamObjectives.length
      : 0

  const getStatusBadge = (progress: number) => {
    const status = calculateTrafficLightStatus(progress)
    const classes = getTrafficLightClasses(status)

    const label = status === 'green' ? 'On Track' :
                  status === 'yellow' ? 'At Risk' :
                  status === 'red' ? 'Off Track' : 'No Progress'

    return <Badge className={`${classes.bg} ${classes.text}`}>{label}</Badge>
  }

  const [renameValue, setRenameValue] = useState(team.name)
  const [selectedUser, setSelectedUser] = useState('')
  const [searchTerm, setSearchTerm] = useState('')

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{team.name}</CardTitle>
          {getStatusBadge(avgProgress)}
        </div>
        <CardDescription>
          {teamObjectives.length} active objectives
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Progress</span>
          <span className="text-sm font-medium">{Math.round(avgProgress)}%</span>
        </div>
        <Progress value={avgProgress} className="h-2" />

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            {teamObjectives.length}
          </div>
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {team.memberCount ?? 0}
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/teams/${team.id}`}>View Details</Link>
        </Button>

        {canManage && (
          <div className="space-y-3 border-t pt-3 mt-3">
            <div className="flex items-center gap-2">
              <Input
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                placeholder="Rename team"
              />
              <Button
                size="sm"
                variant="secondary"
                disabled={!renameValue || renameValue === team.name}
                onClick={() => onRename?.(team.id, renameValue)}
              >
                Save
              </Button>
            </div>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {team.members?.map((member) => (
                  <Badge key={member.id} variant="outline" className="flex items-center gap-1">
                    {member.name || member.email}
                    <button
                      type="button"
                      className="text-[10px]"
                      onClick={() => onUpdateMembers?.(team.id, team.members!.filter((m) => m.id !== member.id).map((m) => m.id))}
                      aria-label={`Remove ${member.email}`}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex flex-col gap-2">
                <Input
                  placeholder="Search users to add"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value)
                    onSearchUsers?.(e.target.value)
                  }}
                />
                <Select value={selectedUser} onValueChange={setSelectedUser}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select user" />
                  </SelectTrigger>
                  <SelectContent>
                    {userOptions.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name || u.email} • {u.role}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={!selectedUser}
                  onClick={() => {
                    const memberIds = Array.from(new Set([...(team.members?.map((m) => m.id) ?? []), selectedUser]))
                    onUpdateMembers?.(team.id, memberIds)
                    setSelectedUser('')
                  }}
                >
                  Add member
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function TeamOverview({ userRole }: { userRole: UserRole }) {
  const { data: objectivesData } = useObjectives({})
  const { data: teamsData } = useTeams('')
  const queryClient = useQueryClient()
  const [newTeamName, setNewTeamName] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const userOptionsQuery = useUserOptions(userSearch)
  const objectives = useMemo(() => objectivesData?.objectives ?? [], [objectivesData?.objectives])

  const objectiveTeamMap = useMemo(() => {
    const teamMap = new Map<string, ObjectiveData[]>()
    objectives.forEach((obj) => {
      if (obj.team) {
        const list = teamMap.get(obj.team.id) ?? []
        list.push(obj)
        teamMap.set(obj.team.id, list)
      }
    })
    return teamMap
  }, [objectives])

  const teams = useMemo(() => {
    const fromApi = teamsData?.teams ?? []
    return fromApi.map((team) => {
      const teamObjectives = objectiveTeamMap.get(team.id) ?? []
      const avgProgress = teamObjectives.length
        ? teamObjectives.reduce((sum, obj) => sum + obj.progress, 0) / teamObjectives.length
        : 0
      return {
        ...team,
        objectives: teamObjectives,
        progress: Math.round(avgProgress),
        memberCount: team.members?.length ?? 0,
        members: team.members ?? [],
      }
    })
  }, [teamsData?.teams, objectiveTeamMap])

  const heatmapData = useMemo(() => teams.map((team) => {
    const progress = typeof team.progress === 'number'
      ? team.progress
      : team.objectives?.length
        ? Math.round(team.objectives.reduce((sum: number, obj: ObjectiveData) => sum + obj.progress, 0) / team.objectives.length)
        : 0
    return {
      teamId: team.id,
      teamName: team.name,
      progress,
      status: calculateTrafficLightStatus(progress),
      objectiveCount: team.objectives?.length || 0,
      memberCount: team.members?.length || new Set(team.objectives?.map((obj: ObjectiveData) => obj.owner?.email)).size || 0,
    }
  }), [teams])

  const stats = useMemo(() => {
    const totalTeams = teams.length
    const totalObjectives = objectives.length
    const avgProgress = objectives.length > 0
      ? objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length
      : 0
    const atRiskTeams = teams.filter(team => {
      const teamAvg = team.objectives?.length > 0
        ? team.objectives.reduce((sum: number, obj: ObjectiveData) => sum + obj.progress, 0) / team.objectives.length
        : 0
      return teamAvg < 50
    }).length

    return { totalTeams, totalObjectives, avgProgress, atRiskTeams }
  }, [teams, objectives])

  const createTeam = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTeamName }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Failed to create team')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Team created')
      setNewTeamName('')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    onError: (err: Error) => toast.error(err?.message || 'Unable to create team'),
  })

  const updateTeam = useMutation({
    mutationFn: async ({ id, name, memberIds }: { id: string; name?: string; memberIds?: string[] }) => {
      const res = await fetch(`/api/teams/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, memberIds }),
      })
      if (!res.ok) {
        const body = await res.text()
        throw new Error(body || 'Failed to update team')
      }
      return res.json()
    },
    onSuccess: () => {
      toast.success('Team updated')
      queryClient.invalidateQueries({ queryKey: ['teams'] })
    },
    onError: (err: Error) => toast.error(err?.message || 'Unable to update team'),
  })

  const handleRenameTeam = async (teamId: string, name: string) => {
    await updateTeam.mutateAsync({ id: teamId, name })
  }

  const handleUpdateMembers = async (teamId: string, memberIds: string[]) => {
    await updateTeam.mutateAsync({ id: teamId, memberIds })
  }

  if (userRole === 'EMPLOYEE') {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="text-lg font-medium mb-2">Team Overview</h3>
        <p className="text-muted-foreground">
          Access team information through your manager or admin.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border/70 bg-card/70 p-4">
          <Input
            placeholder="New team name"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
            className="w-64"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={() => createTeam.mutate()}
            disabled={!newTeamName || createTeam.isPending}
          >
            <PlusCircle className="h-4 w-4 mr-1" />
            Create team
          </Button>
        </div>
      )}

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Teams</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active Objectives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalObjectives}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(stats.avgProgress)}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Teams At Risk</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.atRiskTeams}</div>
          </CardContent>
        </Card>
      </div>

      {/* Team Heatmap */}
      <HeatMap
        type="teams"
        title="Team Performance Heatmap"
        description="Click on any team to drill down into their objectives"
        data={heatmapData}
      />

      {teams.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <TeamCard
              key={team.id}
              team={team}
              objectives={team.objectives}
              canManage={userRole === 'ADMIN' || userRole === 'MANAGER'}
              onRename={handleRenameTeam}
              onUpdateMembers={handleUpdateMembers}
              userOptions={userOptionsQuery.data?.users ?? []}
              onSearchUsers={setUserSearch}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function TeamsPage() {
  const { data: session } = useSession()
  const userRole = session?.user?.role as UserRole

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
            Teams
          </h1>
          <p className="text-muted-foreground">
            Monitor team performance and alignment across objectives
          </p>
        </div>
        {(userRole === 'ADMIN' || userRole === 'MANAGER') && (
          <Button asChild>
            <Link href="/okrs/new">Create Team Objective</Link>
          </Button>
        )}
      </div>

      {/* Content */}
      <TeamOverview userRole={userRole} />
    </div>
  )
}
