'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, TrendingUp, CheckCircle2, BarChart3 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { HeatMap } from '@/components/analytics/HeatMap'
import { Badge } from '@/components/ui/badge'

function WeeklyCheckIns() {
  const mockCheckIns = [
    {
      id: '1',
      keyResult: 'API Response Time < 200ms',
      objective: 'Improve API Performance',
      owner: 'John Doe',
      lastCheckIn: '2 days ago',
      progress: 85,
      status: 'green' as const,
      comment: 'Made good progress this week with caching improvements'
    },
    {
      id: '2',
      keyResult: 'User Adoption Rate > 80%',
      objective: 'Increase Product Adoption',
      owner: 'Jane Smith',
      lastCheckIn: '1 day ago',
      progress: 65,
      status: 'yellow' as const,
      comment: 'Onboarding flow improvements showing results'
    },
    {
      id: '3',
      keyResult: 'NPS Score > 70',
      objective: 'Improve Customer Satisfaction',
      owner: 'Mike Johnson',
      lastCheckIn: '3 days ago',
      progress: 72,
      status: 'green' as const,
      comment: 'Customer feedback survey results positive'
    }
  ]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'green':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />
      case 'yellow':
        return <TrendingUp className="h-4 w-4 text-yellow-600" />
      default:
        return <Calendar className="h-4 w-4 text-red-600" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Recent Check-ins</h3>
          <p className="text-sm text-muted-foreground">
            Latest progress updates from your team
          </p>
        </div>
        <Button>
          <Calendar className="h-4 w-4 mr-2" />
          Schedule Check-in
        </Button>
      </div>

      <div className="space-y-4">
        {mockCheckIns.map((checkIn) => (
          <Card key={checkIn.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(checkIn.status)}
                    <h4 className="font-medium">{checkIn.keyResult}</h4>
                    <Badge variant="outline" className="text-xs">
                      {checkIn.progress}%
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {checkIn.objective} • by {checkIn.owner}
                  </p>
                  <p className="text-sm">{checkIn.comment}</p>
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  {checkIn.lastCheckIn}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function CheckInAnalytics() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold">Check-in Analytics</h3>
        <p className="text-sm text-muted-foreground">
          Track engagement and progress patterns
        </p>
      </div>

      {/* Progress Heat Map - PRD Requirement */}
      <HeatMap
        type="progress"
        title="Progress Heat Map"
        description="Weekly check-in progress for key results over the last 5 weeks"
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Check-in Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-muted-foreground">
              +5% from last week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">74%</div>
            <p className="text-xs text-muted-foreground">
              +8% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">On Track KR&apos;s</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23</div>
            <p className="text-xs text-muted-foreground">
              of 31 total KR&apos;s
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckinsPage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-right">
          <h1 className="text-2xl font-bold">Check-ins & Progress</h1>
          <p className="text-sm text-muted-foreground">
            Track weekly progress and analyze trends
          </p>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="checkins" className="space-y-6">
        <TabsList>
          <TabsTrigger value="checkins" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Weekly Check-ins
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Progress Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="checkins">
          <WeeklyCheckIns />
        </TabsContent>

        <TabsContent value="analytics">
          <CheckInAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  )
}




