'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import { Users, Target } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { useObjectives } from '@/hooks/useObjectives'
import { useSession } from 'next-auth/react'
import { UserRole } from '@/lib/rbac'
import { calculateTrafficLightStatus, getTrafficLightClasses } from '@/lib/utils'
import { HeatMap } from '@/components/analytics/HeatMap'

type ObjectiveData = {
  progress: number
  team?: { id: string; name: string }
  owner?: { email?: string }
}

function TeamCard({ team, objectives }: { team: { id: string; name: string }; objectives: ObjectiveData[] }) {
  const teamObjectives = objectives.filter(obj => obj.team?.id === team.id)
  const avgProgress = teamObjectives.length > 0
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
            {/* Mock team member count */}
            {Math.floor(Math.random() * 8) + 3}
          </div>
        </div>

        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href={`/teams/${team.id}`}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  )
}

function TeamOverview({ userRole }: { userRole: UserRole }) {
  const { data: objectivesData } = useObjectives({})
  const objectives = useMemo(() => objectivesData?.objectives ?? [], [objectivesData?.objectives])

  const teams = useMemo(() => {
    const teamMap = new Map()
    objectives.forEach(obj => {
      if (obj.team) {
        if (!teamMap.has(obj.team.id)) {
          teamMap.set(obj.team.id, { ...obj.team, objectives: [] })
        }
        teamMap.get(obj.team.id).objectives.push(obj)
      }
    })
    return Array.from(teamMap.values())
  }, [objectives])
  const heatmapData = useMemo(() => teams.map((team: any) => {
    const progress = team.objectives?.length
      ? Math.round(team.objectives.reduce((sum: number, obj: ObjectiveData) => sum + obj.progress, 0) / team.objectives.length)
      : 0
    return {
      teamId: team.id,
      teamName: team.name,
      progress,
      status: calculateTrafficLightStatus(progress),
      objectiveCount: team.objectives?.length || 0,
      memberCount: new Set(team.objectives?.map((obj: ObjectiveData) => obj.owner?.email)).size || 0,
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
            <TeamCard key={team.id} team={team} objectives={team.objectives} />
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
