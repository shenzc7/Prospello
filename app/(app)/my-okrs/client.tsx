'use client'

import { Suspense, useState } from 'react'
import { CheckCircle2, Clock, Target, TrendingUp, Calendar, Plus } from 'lucide-react'

import { QuickCheckInRow } from '@/components/check-ins/QuickCheckInRow'
import { HistoryPanel } from '@/components/check-ins/HistoryPanel'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { strings } from '@/config/strings'
import { useObjectives } from '@/hooks/useObjectives'
import { SkeletonRow } from '@/components/ui/SkeletonRow'
import { ObjectiveStatusBadge } from '@/components/okrs/ObjectiveStatusBadge'
import { cn } from '@/lib/ui'

function MyOkrsContent() {
  const { data, isLoading, isError, error } = useObjectives({})
  const [activeTab, setActiveTab] = useState('checkins')

  if (isLoading)
    return (
      <div className="space-y-6" aria-live="polite">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 rounded-full bg-muted/50 mb-2" />
            <div className="h-4 w-64 rounded-full bg-muted/50" />
          </div>
        </div>
        <SkeletonRow lines={4} />
        <SkeletonRow lines={4} />
      </div>
    )

  if (isError) return <div className="text-destructive">{error?.message || strings.errors.objectivesLoad}</div>

  const objectives = data?.objectives ?? []
  const totalObjectives = objectives.length
  const completedObjectives = objectives.filter(obj => obj.status === 'DONE').length
  const avgProgress = objectives.length > 0
    ? objectives.reduce((sum, obj) => sum + obj.progress, 0) / objectives.length
    : 0

  const pendingCheckIns = objectives.flatMap(obj =>
    obj.keyResults.filter(kr => {
      // Mock logic - in real app, check if check-in is needed this week
      return kr.progress < 100
    })
  )

  return (
    <div className="space-y-8" data-testid="my-okrs-page">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">My OKRs</h1>
          <p className="text-muted-foreground">
            Track your progress and update weekly check-ins
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Objective
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Objectives</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalObjectives}</div>
            <p className="text-xs text-muted-foreground">
              {completedObjectives} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Progress</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(avgProgress)}%</div>
            <Progress value={avgProgress} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Check-ins</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCheckIns.length}</div>
            <p className="text-xs text-muted-foreground">
              This week&apos;s updates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedObjectives}</div>
            <p className="text-xs text-muted-foreground">
              {totalObjectives > 0 ? Math.round((completedObjectives / totalObjectives) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="checkins" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Weekly Check-ins
            {pendingCheckIns.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                {pendingCheckIns.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="objectives" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            My Objectives
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Progress History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Weekly Check-ins</h2>
            {pendingCheckIns.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle2 className="h-12 w-12 text-green-500 mb-4" />
                  <h3 className="text-lg font-medium mb-2">All caught up!</h3>
                  <p className="text-muted-foreground text-center">
                    You&apos;ve completed all your check-ins for this week.
                    Great job staying on top of your goals!
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {objectives.map((obj) => (
                  <Card key={obj.id}>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{obj.title}</CardTitle>
                          <CardDescription className="flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            {obj.cycle}
                            <ObjectiveStatusBadge status={obj.status} />
                          </CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold">{obj.progress}%</div>
                          <Progress value={obj.progress} className="w-24 mt-1" />
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {obj.keyResults.map((kr) => (
                        <div key={kr.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{kr.title}</h4>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>{Math.round(kr.progress)}% of {kr.target}{kr.unit && ` ${kr.unit}`}</span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round((kr.current / kr.target) * 100)}%
                              </Badge>
                            </div>
                          </div>
                          <QuickCheckInRow
                            keyResultId={kr.id}
                            current={kr.current}
                            unit={kr.unit}
                          />
                          <HistoryPanel keyResultId={kr.id} />
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="objectives" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">My Objectives</h2>
            <div className="grid gap-4">
              {objectives.map((obj) => (
                <Card key={obj.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-lg">{obj.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {obj.cycle}
                          {obj.team && <Badge variant="secondary">{obj.team.name}</Badge>}
                        </CardDescription>
                      </div>
                      <ObjectiveStatusBadge status={obj.status} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium">Overall Progress</span>
                          <span className="text-muted-foreground">{obj.progress}%</span>
                        </div>
                        <Progress value={obj.progress} />
                      </div>
                      <div className="grid gap-3">
                        <h5 className="font-medium text-sm">Key Results</h5>
                        {obj.keyResults.map((kr) => (
                          <div key={kr.id} className="flex items-center justify-between text-sm">
                            <span className="truncate flex-1 mr-4">{kr.title}</span>
                            <div className="flex items-center gap-2">
                              <Progress value={kr.progress} className="w-16 h-1" />
                              <span className="text-muted-foreground min-w-[3rem] text-right">
                                {Math.round(kr.progress)}%
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Progress History</h2>
            <Card>
              <CardContent className="py-8">
                <div className="text-center text-muted-foreground">
                  <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Progress tracking coming soon</h3>
                  <p>Historical progress charts and trends will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export function MyOkrsClient() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="h-8 w-48 rounded-full bg-muted/50 mb-2" />
              <div className="h-4 w-64 rounded-full bg-muted/50" />
            </div>
          </div>
          <SkeletonRow lines={4} />
        </div>
      }
    >
      <MyOkrsContent />
    </Suspense>
  )
}
