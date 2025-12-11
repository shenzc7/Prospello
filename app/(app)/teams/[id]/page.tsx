'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft, Users, Clock } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function TeamDetailPage() {
  const router = useRouter()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Teams
        </Button>
      </div>

      {/* Coming Soon Content */}
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Team Details Coming Soon</CardTitle>
          <CardDescription className="text-lg">
            Detailed team insights and management features are under development
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          <div className="grid gap-4 md:grid-cols-3 max-w-2xl mx-auto">
            <div className="p-4 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Team Members</h3>
              <p className="text-sm text-muted-foreground">View and manage team composition</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Clock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Performance Metrics</h3>
              <p className="text-sm text-muted-foreground">Track team progress and velocity</p>
            </div>
            <div className="p-4 border rounded-lg">
              <Users className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
              <h3 className="font-medium mb-1">Collaboration Tools</h3>
              <p className="text-sm text-muted-foreground">Enhanced team communication features</p>
            </div>
          </div>

          <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
            <p className="text-sm text-muted-foreground">
              This feature is currently being built. We&apos;ll notify you when team details and management tools become available.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}


