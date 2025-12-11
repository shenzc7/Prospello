'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { Bell, User, Shield, Palette, Globe, CalendarDays, SlidersHorizontal, Gauge } from 'lucide-react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useSearchParams } from 'next/navigation'

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
import { fetchJSON } from '@/hooks/useObjectives'
import { DEFAULT_NOTIFICATION_SETTINGS } from '@/lib/notifications'
import { mergeOrgSettings, defaultOrgLocaleSettings, type OrgLocaleSettings } from '@/lib/orgSettings'
import { DemoToggle } from '@/components/demo/DemoToggle'
import { useDemoMode } from '@/components/demo/DemoProvider'

function ProfileSettings() {
  const { data: session } = useSession()
  const user = session?.user
  const [name, setName] = useState(user?.name || '')
  const [savingProfile, setSavingProfile] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    setName(user?.name || '')
  }, [user?.name])

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
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
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

          <Button
            variant="secondary"
            size="sm"
            disabled={!name || savingProfile}
            onClick={async () => {
              setSavingProfile(true)
              try {
                await fetchJSON('/api/settings/profile', {
                  method: 'PATCH',
                  body: JSON.stringify({ name }),
                })
                toast.success('Profile updated')
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unable to update profile'
                toast.error(message)
              } finally {
                setSavingProfile(false)
              }
            }}
          >
            {savingProfile ? 'Saving…' : 'Save profile'}
          </Button>
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
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <Button
            disabled={savingPassword}
            onClick={async () => {
              if (newPassword !== confirmPassword) {
                toast.error('New password and confirm password must match')
                return
              }
              setSavingPassword(true)
              try {
                await fetchJSON('/api/settings/password', {
                  method: 'PATCH',
                  body: JSON.stringify({ currentPassword, newPassword }),
                })
                toast.success('Password updated')
                setCurrentPassword('')
                setNewPassword('')
                setConfirmPassword('')
              } catch (error: unknown) {
                const message = error instanceof Error ? error.message : 'Unable to update password'
                toast.error(message)
              } finally {
                setSavingPassword(false)
              }
            }}
          >
            {savingPassword ? 'Updating…' : 'Update Password'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

function NotificationSettings() {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery<{ settings: typeof DEFAULT_NOTIFICATION_SETTINGS }>({
    queryKey: ['notification-settings'],
    queryFn: () => fetchJSON('/api/settings/notifications'),
  })
  const [settings, setSettings] = useState(DEFAULT_NOTIFICATION_SETTINGS)
  const mutation = useMutation({
    mutationFn: (payload: Partial<typeof DEFAULT_NOTIFICATION_SETTINGS>) =>
      fetchJSON('/api/settings/notifications', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Notification preferences saved')
      queryClient.invalidateQueries({ queryKey: ['notification-settings'] })
    },
    onError: (error: Error) => toast.error(error?.message || 'Unable to update notifications'),
  })

  useEffect(() => {
    if (data?.settings) {
      setSettings({ ...DEFAULT_NOTIFICATION_SETTINGS, ...data.settings })
    }
  }, [data?.settings])

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    mutation.mutate({ [key]: value } as Partial<typeof DEFAULT_NOTIFICATION_SETTINGS>)
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
          {isLoading ? <p className="text-sm text-muted-foreground">Loading preferences…</p> : null}
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
          <CardTitle>Mobile & Messaging</CardTitle>
          <CardDescription>
            Reach users where they are: SMS and WhatsApp for check-ins
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>WhatsApp Check-in Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Send weekly check-in nudges over WhatsApp
              </p>
            </div>
            <Switch
              checked={settings.whatsappCheckInReminders}
              onCheckedChange={(checked) => updateSetting('whatsappCheckInReminders', checked)}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>SMS Check-in Reminders</Label>
              <p className="text-sm text-muted-foreground">
                Fallback SMS for low-data users
              </p>
            </div>
            <Switch
              checked={settings.smsCheckInReminders}
              onCheckedChange={(checked) => updateSetting('smsCheckInReminders', checked)}
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

      <Card>
        <CardHeader>
          <CardTitle>Quiet Hours</CardTitle>
          <CardDescription>
            Prevent reminders outside your preferred hours
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Enable Quiet Hours</Label>
              <p className="text-sm text-muted-foreground">Mute all channels overnight</p>
            </div>
            <Switch
              checked={settings.quietHoursEnabled}
              onCheckedChange={(checked) => updateSetting('quietHoursEnabled', checked)}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="quiet-start">Quiet Hours Start (24h)</Label>
              <Input
                id="quiet-start"
                type="time"
                value={settings.quietHoursStart}
                onChange={(e) => updateSetting('quietHoursStart', e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="quiet-end">Quiet Hours End (24h)</Label>
              <Input
                id="quiet-end"
                type="time"
                value={settings.quietHoursEnd}
                onChange={(e) => updateSetting('quietHoursEnd', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function OrgLocaleSettings() {
  const { data, isLoading } = useQuery<{ settings: OrgLocaleSettings }>({
    queryKey: ['org-locale-settings'],
    queryFn: () => fetchJSON('/api/settings/locale'),
  })
  const queryClient = useQueryClient()
  const mutation = useMutation({
    mutationFn: (payload: OrgLocaleSettings) =>
      fetchJSON('/api/settings/locale', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      }),
    onSuccess: () => {
      toast.success('Organization settings saved')
      queryClient.invalidateQueries({ queryKey: ['org-locale-settings'] })
    },
    onError: (error: Error) => toast.error(error?.message || 'Unable to update organization settings'),
  })

  const settings = mergeOrgSettings(data?.settings)

  const setField = <K extends keyof OrgLocaleSettings>(key: K, value: OrgLocaleSettings[K]) => {
    const next = { ...settings, [key]: value }
    mutation.mutate(next)
  }

  const setLabel = (key: keyof OrgLocaleSettings['hierarchyLabels'], value: string) => {
    const next = {
      ...settings,
      hierarchyLabels: { ...settings.hierarchyLabels, [key]: value },
    }
    mutation.mutate(next)
  }

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Calendar & Cadence
          </CardTitle>
          <CardDescription>Fiscal year start and week start for check-ins</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading ? <p className="text-sm text-muted-foreground">Loading settings…</p> : null}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Fiscal Year Start Month</Label>
              <Select
                value={String(settings.fiscalYearStartMonth)}
                onValueChange={(value) => setField('fiscalYearStartMonth', Number(value))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((label, idx) => (
                    <SelectItem key={label} value={String(idx + 1)}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Defaults to April (India). Updates dashboard quarter labels and timelines.
              </p>
            </div>
            <div className="space-y-2">
              <Label>Week Start</Label>
              <Select
                value={settings.weekStart}
                onValueChange={(value) => setField('weekStart', value as OrgLocaleSettings['weekStart'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Aligns check-in cadence and reporting weeks.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SlidersHorizontal className="h-5 w-5" />
            Scoring & Labels
          </CardTitle>
          <CardDescription>Scale, locale, and goal hierarchy labels</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Scoring Scale</Label>
              <Select
                value={settings.scoringScale}
                onValueChange={(value) => setField('scoringScale', value as OrgLocaleSettings['scoringScale'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="percent">0-100%</SelectItem>
                  <SelectItem value="fraction">0.0-1.0</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Dual display shown everywhere; calculations honor this preference.
              </p>
            </div>
            <div className="space-y-2">
              <Label>High-contrast Status</Label>
              <div className="flex items-center justify-between rounded-lg border px-3 py-2">
                <p className="text-sm text-muted-foreground">
                  Adds outlines and text badges to traffic-light states.
                </p>
                <Switch
                  checked={Boolean(settings.highContrastStatus)}
                  onCheckedChange={(checked) => setField('highContrastStatus', checked)}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Number Locale</Label>
              <Select
                value={settings.numberLocale}
                onValueChange={(value) => setField('numberLocale', value as OrgLocaleSettings['numberLocale'])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en-IN">English (India)</SelectItem>
                  <SelectItem value="en-US">English (US)</SelectItem>
                  <SelectItem value="en-GB">English (UK)</SelectItem>
                  <SelectItem value="hi-IN">Hindi (India)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Applies to percentages and exports.</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Date Format</Label>
              <Input
                value={settings.dateFormat}
                onChange={(e) => setField('dateFormat', e.target.value || defaultOrgLocaleSettings.dateFormat)}
              />
              <p className="text-xs text-muted-foreground">Example: dd-mm-yyyy</p>
            </div>
            <div className="space-y-2">
              <Label>Hierarchy Labels</Label>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={settings.hierarchyLabels.company}
                  onChange={(e) => setLabel('company', e.target.value)}
                  placeholder="Company"
                />
                <Input
                  value={settings.hierarchyLabels.department}
                  onChange={(e) => setLabel('department', e.target.value)}
                  placeholder="Department"
                />
                <Input
                  value={settings.hierarchyLabels.team}
                  onChange={(e) => setLabel('team', e.target.value)}
                  placeholder="Team"
                />
                <Input
                  value={settings.hierarchyLabels.individual}
                  onChange={(e) => setLabel('individual', e.target.value)}
                  placeholder="Individual"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Updates creation forms, dashboards, and alignment tree labels.
              </p>
            </div>
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
  const [cycleDefault, setCycleDefault] = useState('Q4 2024')
  const [reminderCadence, setReminderCadence] = useState('Weekly')
  const [savingCycle, setSavingCycle] = useState(false)

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
            User & Access Controls
          </CardTitle>
          <CardDescription>
            Manage users, roles, teams, and PRD-required access
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
              <Button variant="outline" onClick={() => window.open('/admin/users', '_blank')}>
                Open Users
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex-1">
                <Label className="text-base">Team Management</Label>
                <p className="text-sm text-muted-foreground">
                  Create and manage teams, align to company goals
                </p>
              </div>
              <Button variant="outline" onClick={() => window.open('/teams', '_blank')}>
                Manage Teams
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            SSO Providers
          </CardTitle>
          <CardDescription>Configure Google, Slack, and Microsoft Teams per PRD</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Google Workspace</Label>
              <p className="text-xs text-muted-foreground">SSO + calendar/drive integration</p>
            </div>
            <Button variant="outline" disabled>Configure</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Slack</Label>
              <p className="text-xs text-muted-foreground">Notifications and reminders</p>
            </div>
            <Button variant="outline" disabled>Configure</Button>
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label>Microsoft Teams</Label>
              <p className="text-xs text-muted-foreground">SSO + channel reminders</p>
            </div>
            <Button variant="outline" disabled>Configure</Button>
          </div>
          <p className="text-xs text-muted-foreground">Connectors are gated in this build; enable server config to activate.</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Policies
          </CardTitle>
          <CardDescription>Admin-level defaults for reminders and digests</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border">
            <div>
              <Label>Reminder cadence</Label>
              <p className="text-xs text-muted-foreground">Weekly check-ins per PRD</p>
            </div>
            <Select value={reminderCadence} onValueChange={setReminderCadence}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Weekly">Weekly</SelectItem>
                <SelectItem value="Biweekly">Biweekly</SelectItem>
                <SelectItem value="Monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border">
            <div>
              <Label>Digest</Label>
              <p className="text-xs text-muted-foreground">Send weekly digest to managers and admins</p>
            </div>
            <Button
              variant="secondary"
              size="sm"
              onClick={async () => {
                try {
                  await fetchJSON('/api/settings/notifications', {
                    method: 'PATCH',
                    body: JSON.stringify({ cadence: reminderCadence }),
                  })
                  toast.success('Notification policy saved')
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : 'Failed to save notification policy'
                  toast.error(message)
                }
              }}
            >
              Save policy
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Cycle Defaults
          </CardTitle>
          <CardDescription>Define default cycle name and finalize cadence</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between p-3 rounded-lg border">
            <div className="space-y-1">
              <Label>Default cycle label</Label>
              <p className="text-xs text-muted-foreground">Shown in dashboards and admin actions</p>
            </div>
            <Input
              className="w-48"
              value={cycleDefault}
              onChange={(e) => setCycleDefault(e.target.value)}
              placeholder="e.g., Q4 2024"
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              size="sm"
              disabled={savingCycle || !cycleDefault}
              onClick={async () => {
                try {
                  setSavingCycle(true)
                  await fetchJSON('/api/settings/notifications', {
                    method: 'PATCH',
                    body: JSON.stringify({ defaultCycle: cycleDefault }),
                  })
                  toast.success('Cycle default saved')
                } catch (error: unknown) {
                  const message = error instanceof Error ? error.message : 'Unable to save cycle default'
                  toast.error(message)
                } finally {
                  setSavingCycle(false)
                }
              }}
            >
              {savingCycle ? 'Saving…' : 'Save defaults'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SettingsPage() {
  const { data: session } = useSession()
  const isAdmin = session?.user?.role === 'ADMIN'
  const { enabled: demoEnabled, role: demoRole } = useDemoMode()
  const params = useSearchParams()
  const showNotificationsTab = !featureFlags.prdMode || isFeatureEnabled('notificationFeed')
  const showAppearanceTab = isFeatureEnabled('appearanceSettings')
  const showIntegrationsTab = isFeatureEnabled('integrations')
  const showAdminTab = isAdmin && isFeatureEnabled('adminExtras')
  const showOrgLocaleTab = isAdmin
  const requestedTab = params?.get('tab') ?? 'profile'
  const defaultTab =
    requestedTab === 'notifications' && showNotificationsTab
      ? 'notifications'
      : requestedTab === 'integrations' && showIntegrationsTab
        ? 'integrations'
        : requestedTab === 'admin' && showAdminTab
          ? 'admin'
          : requestedTab === 'locale' && showOrgLocaleTab
            ? 'locale'
          : 'profile'

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
        {isFeatureEnabled('demoMode') && (
          <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 shadow-soft space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-primary">Demo mode</p>
                <p className="text-sm font-semibold text-foreground">Showcase-ready data</p>
                <p className="text-xs text-muted-foreground">
                  Session only. Current view: {demoEnabled ? demoRole : 'off'}.
                </p>
              </div>
              <DemoToggle compact />
            </div>
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue={defaultTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-6">
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
          {showOrgLocaleTab && (
            <TabsTrigger value="locale" className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4" />
              Locale & Calendar
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
        {showOrgLocaleTab && (
          <TabsContent value="locale">
            <OrgLocaleSettings />
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
