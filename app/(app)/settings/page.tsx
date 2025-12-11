'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, User, Shield, Palette, Globe } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { UserSwitcher } from '@/components/admin/UserSwitcher'
import { featureFlags, isFeatureEnabled } from '@/config/features'

function ProfileSettings() {
  const { data: session } = useSession()
  const user = session?.user

  const getInitials = (name?: string | null, email?: string) => {
    if (name) {
      const parts = name.split(' ').filter(Boolean).slice(0, 2)
      if (parts.length) {
        return parts.map((part) => part[0]?.toUpperCase()).join('')
      }
    }
    if (email) {
      return email.slice(0, 2).toUpperCase()
    }
    return 'U'
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>
            Update your personal information and profile details
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user?.image || ''} />
              <AvatarFallback className="text-lg">
                {getInitials(user?.name, user?.email)}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <Button variant="outline" size="sm">
                Change Avatar
              </Button>
              <p className="text-sm text-muted-foreground">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" defaultValue={user?.name || ''} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" defaultValue={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed. Contact admin to update.
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="flex items-center gap-2">
              <Badge variant={
                user?.role === 'ADMIN' ? 'default' :
                user?.role === 'MANAGER' ? 'secondary' : 'outline'
              }>
                {user?.role || 'EMPLOYEE'}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {user?.role === 'ADMIN' && 'Full system access and user management'}
                {user?.role === 'MANAGER' && 'Team oversight and goal alignment'}
                {user?.role === 'EMPLOYEE' && 'Personal OKRs and check-ins'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>
            Update your password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current Password</Label>
            <Input id="current-password" type="password" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input id="new-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input id="confirm-password" type="password" />
            </div>
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationSettings() {
  const [settings, setSettings] = useState({
    emailCheckInReminders: true,
    emailWeeklyDigest: true,
    emailObjectiveUpdates: false,
    pushCheckInReminders: true,
    pushObjectiveComments: true,
    pushDeadlineAlerts: true,
  })

  const updateSetting = (key: string, value: boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Email Notifications
          </CardTitle>
          <CardDescription>
            Choose what emails you&apos;d like to receive
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Check-in Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Weekly reminders to update your OKR progress
              </p>
            </div>
            <Switch
              checked={settings.emailCheckInReminders}
              onCheckedChange={(checked) => updateSetting('emailCheckInReminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Weekly Digest</Label>
              <p className="text-sm text-muted-foreground">
                Summary of team progress and updates
              </p>
            </div>
            <Switch
              checked={settings.emailWeeklyDigest}
              onCheckedChange={(checked) => updateSetting('emailWeeklyDigest', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Objective Updates</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when objectives you own are updated
              </p>
            </div>
            <Switch
              checked={settings.emailObjectiveUpdates}
              onCheckedChange={(checked) => updateSetting('emailObjectiveUpdates', checked)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Push Notifications</CardTitle>
          <CardDescription>
            Browser notifications for important updates
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Check-in Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Browser notifications for weekly check-ins
              </p>
            </div>
            <Switch
              checked={settings.pushCheckInReminders}
              onCheckedChange={(checked) => updateSetting('pushCheckInReminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Objective Comments</Label>
              <p className="text-sm text-muted-foreground">
                Notifications when someone comments on your objectives
              </p>
            </div>
            <Switch
              checked={settings.pushObjectiveComments}
              onCheckedChange={(checked) => updateSetting('pushObjectiveComments', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Deadline Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Alerts for upcoming objective deadlines
              </p>
            </div>
            <Switch
              checked={settings.pushDeadlineAlerts}
              onCheckedChange={(checked) => updateSetting('pushDeadlineAlerts', checked)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AppearanceSettings() {
  const [theme, setTheme] = useState('system')
  const [language, setLanguage] = useState('en')

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Appearance
          </CardTitle>
          <CardDescription>
            Customize how OKR Builder looks and feels
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Theme</Label>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Español</SelectItem>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="de">Deutsch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function IntegrationSettings() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Integrations
          </CardTitle>
          <CardDescription>
            Connect OKR Builder with your favorite tools
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Google Workspace</Label>
              <p className="text-sm text-muted-foreground">
                Sync with Google Calendar and Drive
              </p>
            </div>
            <Button variant="outline">Connect</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Slack</Label>
              <p className="text-sm text-muted-foreground">
                Get notifications in Slack channels
              </p>
            </div>
            <Button variant="outline">Connect</Button>
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-1">
              <Label>Microsoft Teams</Label>
              <p className="text-sm text-muted-foreground">
                Integrate with Microsoft Teams
              </p>
            </div>
            <Button variant="outline">Connect</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function AdminSettings() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">Admin Access Required</h3>
          <p className="text-muted-foreground">
            Only administrators can access these settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            User Management
          </CardTitle>
          <CardDescription>
            Manage users, roles, and permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base">User Switcher (Testing)</Label>
                <p className="text-sm text-muted-foreground">
                  Switch between user accounts for testing different roles
                </p>
              </div>
              <UserSwitcher />
            </div>

            <Separator />

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base">Invite Users</Label>
                <p className="text-sm text-muted-foreground">
                  Send invitations to new team members
                </p>
              </div>
              <Button variant="outline">Invite Users</Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base">Team Management</Label>
                <p className="text-sm text-muted-foreground">
                  Create and manage teams
                </p>
              </div>
              <Button variant="outline">Manage Teams</Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base">User Administration</Label>
                <p className="text-sm text-muted-foreground">
                  View all users and manage permissions
                </p>
              </div>
              <Button variant="outline" onClick={() => window.open('/admin/users', '_blank')}>
                Open Admin Panel
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const showNotificationsTab = !featureFlags.prdMode || isFeatureEnabled('notificationFeed')
  const showAppearanceTab = isFeatureEnabled('appearanceSettings')
  const showIntegrationsTab = isFeatureEnabled('integrations')
  const showAdminTab = isAdmin && isFeatureEnabled('adminExtras')

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account details and role access
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">SSO</p>
          <p className="text-sm font-semibold">Google, Slack, Microsoft Teams</p>
          <p className="text-xs text-muted-foreground">Enable secure sign-in and reminders.</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Notifications</p>
          <p className="text-sm font-semibold">Weekly check-in reminders</p>
          <p className="text-xs text-muted-foreground">Traffic-light updates for owners.</p>
        </div>
        <div className="rounded-xl border border-border/70 bg-card/70 p-4 shadow-soft">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Roles</p>
          <p className="text-sm font-semibold">Admin • Manager • Employee</p>
          <p className="text-xs text-muted-foreground">Role-based access and dashboards.</p>
        </div>
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="h-4 w-4" />
            Profile
          </TabsTrigger>
          {showNotificationsTab && (
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
          )}
          {showAppearanceTab && (
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
          )}
          {showIntegrationsTab && (
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Integrations
            </TabsTrigger>
          )}
          {showAdminTab && (
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Admin
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="profile">
          <ProfileSettings />
        </TabsContent>

        {showNotificationsTab && (
          <TabsContent value="notifications">
            <NotificationSettings />
          </TabsContent>
        )}

        {showAppearanceTab && (
          <TabsContent value="appearance">
            <AppearanceSettings />
          </TabsContent>
        )}

        {showIntegrationsTab && (
          <TabsContent value="integrations">
            <IntegrationSettings />
          </TabsContent>
        )}

        {showAdminTab && (
          <TabsContent value="admin">
            <AdminSettings />
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
