'use client'

import { Users, Target, TrendingUp } from 'lucide-react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useObjectives } from '@/hooks/useObjectives'

export function TeamProgressWidget() {
  const { data: objectivesData } = useObjectives({})
  const objectives = objectivesData?.objectives ?? []

  // Group objectives by team
  const teamStats = objectives.reduce((acc, obj) => {
    const teamName = obj.team?.name || 'No Team'
    if (!acc[teamName]) {
      acc[teamName] = {
        name: teamName,
        objectives: [],
        totalProgress: 0,
        completedCount: 0,
        atRiskCount: 0
      }
    }

    acc[teamName].objectives.push(obj)
    acc[teamName].totalProgress += obj.progress

    if (obj.status === 'DONE') {
      acc[teamName].completedCount++
    }
    if (obj.status === 'AT_RISK') {
      acc[teamName].atRiskCount++
    }

    return acc
  }, {} as Record<string, {
    name: string
    objectives: typeof objectives
    totalProgress: number
    completedCount: number
    atRiskCount: number
  }>)

  const teams = Object.values(teamStats)
    .map(team => ({
      ...team,
      avgProgress: team.objectives.length > 0 ? Math.round(team.totalProgress / team.objectives.length) : 0,
      memberCount: new Set(team.objectives.map(obj => obj.owner.email)).size
    }))
    .sort((a, b) => b.avgProgress - a.avgProgress)
    .slice(0, 4)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Team Progress
        </CardTitle>
        <CardDescription>
          Progress overview by team
        </CardDescription>
      </CardHeader>
      <CardContent>
        {teams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50 mb-2" />
            <p className="text-sm text-muted-foreground">
              No team data available
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {teams.map((team) => (
              <div key={team.name} className="flex items-center justify-between p-3 rounded-lg border">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {team.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm truncate">{team.name}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{team.objectives.length} objectives</span>
                      <span>•</span>
                      <span>{team.memberCount} members</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                  <div className="text-right">
                    <div className="text-sm font-medium">{team.avgProgress}%</div>
                    <Progress value={team.avgProgress} className="w-16 h-1 mt-1" />
                  </div>

                  <div className="flex gap-1">
                    {team.completedCount > 0 && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                        {team.completedCount} ✓
                      </Badge>
                    )}
                    {team.atRiskCount > 0 && (
                      <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                        {team.atRiskCount} ⚠️
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall Progress</span>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 progress-high" />
                  <span className="font-medium">
                    {teams.length > 0
                      ? Math.round(teams.reduce((sum, team) => sum + team.avgProgress, 0) / teams.length)
                      : 0
                    }%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
