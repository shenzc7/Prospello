'use client'

import * as React from 'react'
import { useSession } from 'next-auth/react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import type { Role } from '@prisma/client'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { UserRow } from './admin-users-row'
import { fetchJSON, useTeams } from '@/hooks/useObjectives'
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
  const res = await fetch(`/api/admin/users${qs}`, {
    credentials: 'include',
    cache: 'no-store'
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error ?? 'Unable to load users')
  }

  const body = await res.json().catch(() => ({}))
  return (body as { data?: UsersResponse }).data ?? (body as UsersResponse)
}

async function patchUser(input: { userId: string; role?: Role; teamIds?: string[] }) {
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

  const body = await res.json().catch(() => ({}))
  return (body as { data?: unknown }).data ?? body
}

export function AdminUsersClient() {
  const [searchTerm, setSearchTerm] = React.useState('')
  const [debouncedSearch, setDebouncedSearch] = React.useState('')
  const [alert, setAlert] = React.useState<{ variant: 'success' | 'destructive'; message: string } | null>(null)
  const [pendingId, setPendingId] = React.useState<string | null>(null)
  const [roleFilter, setRoleFilter] = React.useState<Role | 'ALL'>('ALL')
  const [teamFilter, setTeamFilter] = React.useState<string>('ALL')
  const [userToDelete, setUserToDelete] = React.useState<AdminUser | null>(null)
  const { data: session } = useSession()
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

  const deleteUser = useMutation({
    mutationFn: async (userId: string) =>
      fetchJSON<{ message: string }>(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      setAlert({ variant: 'success', message: 'User deleted' })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      setUserToDelete(null)
    },
    onError: (error: Error) => {
      setAlert({ variant: 'destructive', message: error?.message ?? 'Delete failed' })
    },
  })

  // Use both state and ref to persist credentials across re-renders
  const [newUserCredentials, setNewUserCredentials] = React.useState<{
    email: string
    tempPassword: string
    emailSent: boolean
  } | null>(null)
  
  // Ref to persist credentials even if component re-renders
  const credentialsRef = React.useRef<{
    email: string
    tempPassword: string
    emailSent: boolean
  } | null>(null)
  
  // Sync ref with state
  React.useEffect(() => {
    if (newUserCredentials) {
      credentialsRef.current = newUserCredentials
    }
  }, [newUserCredentials])
  
  // Restore from ref if state was lost
  React.useEffect(() => {
    if (!newUserCredentials && credentialsRef.current) {
      setNewUserCredentials(credentialsRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const createUser = useMutation({
    mutationFn: async (input: { email: string; name?: string; role: Role; teamIds?: string[] }) => {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        const message =
          typeof body?.error === 'string'
            ? body.error
            : body?.error?.msg ?? 'Failed to create user'
        throw new Error(message)
      }
      const body = await res.json().catch(() => ({}))
      return (body as { data?: { user?: { email?: string }; tempPassword?: string; emailSent?: boolean } }).data ?? body
    },
    onSuccess: (data?: { user?: { email?: string }; tempPassword?: string; emailSent?: boolean }) => {
      // Set credentials FIRST before any re-renders
      if (data?.tempPassword) {
        setNewUserCredentials({
          email: data.user?.email || '',
          tempPassword: data.tempPassword,
          emailSent: data.emailSent ?? false,
        })
        if (data.emailSent) {
          toast.success('User created! Welcome email sent with login credentials.')
        } else {
          toast.success('User created! Share the credentials below with them.')
        }
      } else {
        setAlert({ variant: 'success', message: 'User created' })
      }
      // Invalidate queries AFTER setting state (delayed slightly to ensure state is set)
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['admin-users'] })
      }, 100)
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
              const trimmedName = values.name?.trim()
              await createUser.mutateAsync({
                email: values.email,
                name: trimmedName || undefined,
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

      {/* New User Credentials Display */}
      {newUserCredentials ? (
        <Card className="border-2 border-primary bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              ✅ User Created Successfully
            </CardTitle>
            <CardDescription>
              {newUserCredentials.emailSent
                ? 'A welcome email has been sent with these credentials.'
                : 'Share these credentials with the new user (email not configured).'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 p-3 rounded-lg bg-background border">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Email:</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{newUserCredentials.email}</code>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Temporary Password:</span>
                <code className="text-sm font-mono bg-muted px-2 py-1 rounded">{newUserCredentials.tempPassword}</code>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Email: ${newUserCredentials.email}\nPassword: ${newUserCredentials.tempPassword}`
                  )
                  toast.success('Credentials copied to clipboard')
                }}
              >
                Copy credentials
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setNewUserCredentials(null)
                  credentialsRef.current = null
                }}
              >
                Dismiss
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              The user should change their password after first login.
            </p>
          </CardContent>
        </Card>
      ) : null}

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
                  onRequestDelete={(target) => {
                    setAlert(null)
                    setUserToDelete(target)
                  }}
                  canDelete={Boolean(session?.user?.id) && user.id !== session.user.id}
                  isSelf={Boolean(session?.user?.id) && user.id === session.user.id}
                  isDeleting={deleteUser.isPending && userToDelete?.id === user.id}
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

      <ConfirmDialog
        open={Boolean(userToDelete)}
        title="Delete user?"
        description={userToDelete ? `This will permanently remove ${userToDelete.email} and all associated data.` : undefined}
        confirmLabel="Delete user"
        confirmingLabel="Deleting…"
        cancelLabel="Cancel"
        isConfirming={deleteUser.isPending}
        onCancel={() => {
          if (!deleteUser.isPending) {
            setUserToDelete(null)
          }
        }}
        onConfirm={() => {
          if (!deleteUser.isPending && userToDelete) {
            deleteUser.mutate(userToDelete.id)
          }
        }}
      />
    </div>
  )
}
