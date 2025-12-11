'use client'

import * as React from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Role } from '@prisma/client'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserRow } from './admin-users-row'
import { useTeams } from '@/hooks/useObjectives'
import { maybeHandleDemoRequest } from '@/lib/demo/api'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: string
  updatedAt: string
  teams?: Array<{ id: string; name: string }>
}

type UsersResponse = {
  users: AdminUser[]
  pagination?: {
    total: number
    limit: number
    offset: number
    hasMore: boolean
  }
}

export const ROLE_OPTIONS: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE']

async function fetchUsers(search: string): Promise<UsersResponse> {
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  const demoPayload = maybeHandleDemoRequest<UsersResponse>(`/api/admin/users${qs}`)
  if (demoPayload !== null) {
    return demoPayload
  }
  const res = await fetch(`/api/admin/users${qs}`, {
    credentials: 'include',
    cache: 'no-store'
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Unable to load users')
  }

  return res.json()
}

async function patchUser(input: { userId: string; role?: Role; teamIds?: string[] }) {
  const demoPayload = maybeHandleDemoRequest(`/api/admin/users/${input.userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ role: input.role, teamIds: input.teamIds })
  })
  if (demoPayload !== null) {
    return demoPayload
  }
  const res = await fetch(`/api/admin/users/${input.userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ role: input.role, teamIds: input.teamIds })
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Failed to update user')
  }

  return res.json()
}

export function AdminUsersClient() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [alert, setAlert] = React.useState<{ variant: 'success' | 'destructive'; message: string } | null>(null)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [roleFilter, setRoleFilter] = React.useState<Role | 'ALL'>('ALL')
  const [teamFilter, setTeamFilter] = React.useState<string>('ALL')
  const queryClient = useQueryClient()
  const teamsQuery = useTeams('')

  const searchForm = useForm<{ search: string }>({
    defaultValues: { search: '' }
  })

  const searchValue = searchForm.watch('search')

  React.useEffect(() => {
    setSearchTerm(searchValue ?? '')
    const timeout = setTimeout(() => setDebouncedSearch(searchValue ?? ''), 300)
    return () => clearTimeout(timeout)
  }, [searchValue])

  const usersQuery = useQuery({
    queryKey: ['admin-users', debouncedSearch],
    queryFn: () => fetchUsers(debouncedSearch)
  })

  const updateUser = useMutation({
    mutationFn: patchUser,
    onSuccess: () => {
      setAlert({ variant: 'success', message: 'Updated user' })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: Error) => {
      setAlert({ variant: 'destructive', message: error?.message ?? 'Update failed' })
    }
  })

  const createUser = useMutation({
    mutationFn: async (input: { email: string; name?: string; role: Role; teamIds?: string[] }) => {
      const demoPayload = maybeHandleDemoRequest('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (demoPayload !== null) {
        return demoPayload
      }
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.error ?? 'Failed to create user')
      }
      return res.json()
    },
    onSuccess: (data?: { tempPassword?: string }) => {
      setAlert({ variant: 'success', message: 'User created' })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      if (data?.tempPassword) {
        toast.info(`Temporary password: ${data.tempPassword}`)
      }
    },
    onError: (error: Error) => {
      setAlert({ variant: 'destructive', message: error?.message ?? 'Create failed' })
    }
  })

  const createForm = useForm<{ email: string; name: string; role: Role; teamId?: string }>({
    defaultValues: { email: '', name: '', role: 'EMPLOYEE', teamId: undefined },
  })

  const handleUpdateRole = React.useCallback(
    async (userId: string, role: Role) => {
      setAlert(null)
      setPendingId(userId)
      try {
        await updateUser.mutateAsync({ userId, role })
      } finally {
        setPendingId(null)
      }
    },
    [updateUser]
  )

  const handleUpdateTeams = React.useCallback(
    async (userId: string, teamIds: string[]) => {
      setAlert(null)
      setPendingId(userId)
      try {
        await updateUser.mutateAsync({ userId, teamIds })
      } finally {
        setPendingId(null)
      }
    },
    [updateUser]
  )

  const filteredUsers = React.useMemo(() => {
    let users = usersQuery.data?.users ?? []
    if (roleFilter !== 'ALL') {
      users = users.filter((u) => u.role === roleFilter)
    }
    if (teamFilter !== 'ALL') {
      users = users.filter((u) => u.teams?.some((t) => t.id === teamFilter))
    }
    return users
  }, [usersQuery.data?.users, roleFilter, teamFilter])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage access across your organisation.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        <Form {...searchForm}>
          <form className="flex flex-col gap-3 sm:flex-row" role="search">
            <FormField
              control={searchForm.control}
              name="search"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormControl>
                    <Input
                      {...field}
                      data-testid="admin-users-search"
                      placeholder="Search by name or email"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="button" variant="outline" onClick={() => searchForm.reset({ search: '' })}>
              Clear
            </Button>
          </form>
        </Form>

        <div className="grid gap-2 sm:grid-cols-2">
          <Select value={roleFilter} onValueChange={(v) => setRoleFilter(v as Role | 'ALL')}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All roles</SelectItem>
              {ROLE_OPTIONS.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={teamFilter} onValueChange={(v) => setTeamFilter(v)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Filter by team" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All teams</SelectItem>
              {teamsQuery.data?.teams?.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="border">
        <CardHeader>
          <CardTitle>Create / Invite User</CardTitle>
          <CardDescription>Add a new member with role and optional team.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...createForm}>
            <form
              className="grid gap-3 md:grid-cols-4 md:items-end"
              onSubmit={createForm.handleSubmit(async (values) => {
                setAlert(null)
                const teamIds = values.teamId && values.teamId !== '__none__' ? [values.teamId] : undefined
                await createUser.mutateAsync({
                  email: values.email,
                  name: values.name,
                  role: values.role,
                  teamIds,
                })
                createForm.reset({ email: '', name: '', role: 'EMPLOYEE', teamId: undefined })
              })}
            >
              <FormField
                control={createForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Email" {...field} required />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input placeholder="Name (optional)" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={field.value} onValueChange={(v) => field.onChange(v as Role)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map((role) => (
                            <SelectItem key={role} value={role}>
                              {role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={createForm.control}
                name="teamId"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Assign to team (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">No team</SelectItem>
                          {teamsQuery.data?.teams?.map((team) => (
                            <SelectItem key={team.id} value={team.id}>
                              {team.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-4 flex gap-2">
                <Button type="submit" disabled={createUser.isPending}>
                  {createUser.isPending ? 'Creating...' : 'Create user'}
                </Button>
                {createUser.isPending && <span className="text-xs text-muted-foreground">Processing…</span>}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {alert ? (
        <Alert data-testid={`alert-${alert.variant === 'success' ? 'success' : 'error'}`} variant={alert.variant}>
          {alert.message}
        </Alert>
      ) : null}

      <div className="rounded-lg border">
        <Table data-testid="admin-users-table">
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Updated / Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersQuery.isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading users…</TableCell>
              </TableRow>
            ) : null}

            {usersQuery.isError ? (
              <TableRow>
                <TableCell colSpan={4} className="text-destructive">
                  {(usersQuery.error as Error)?.message ?? 'Unable to load users'}
                </TableCell>
              </TableRow>
            ) : null}

            {filteredUsers.length ? (
              filteredUsers.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onUpdate={handleUpdateRole}
                  onUpdateTeams={handleUpdateTeams}
                  availableTeams={teamsQuery.data?.teams ?? []}
                  pendingId={pendingId}
                  isSaving={updateUser.isPending}
                />
              ))
            ) : usersQuery.isLoading || usersQuery.isError ? null : (
              <TableRow>
                <TableCell colSpan={5}>No users found for “{searchTerm}”.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
