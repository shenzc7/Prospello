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

export type AdminUser = {
  id: string
  email: string
  name: string | null
  role: Role
  createdAt: string
  updatedAt: string
}

type UsersResponse = {
  users: AdminUser[]
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

  return res.json()
}

async function patchUserRole(input: { userId: string; role: Role }) {
  const res = await fetch(`/api/admin/users/${input.userId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ role: input.role })
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
  const queryClient = useQueryClient()

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

  const updateRole = useMutation({
    mutationFn: patchUserRole,
    onSuccess: () => {
      setAlert({ variant: 'success', message: 'Role updated' })
      queryClient.invalidateQueries({ queryKey: ['admin-users'] })
    },
    onError: (error: Error) => {
      setAlert({ variant: 'destructive', message: error?.message ?? 'Role update failed' })
    }
  })

  const handleUpdateRole = React.useCallback(
    async (userId: string, role: Role) => {
      setAlert(null)
      setPendingId(userId)
      try {
        await updateRole.mutateAsync({ userId, role })
      } finally {
        setPendingId(null)
      }
    },
    [updateRole]
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Users</h1>
        <p className="text-sm text-muted-foreground">Manage access across your organisation.</p>
      </div>

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
              <TableHead className="text-right">Actions</TableHead>
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

            {usersQuery.data?.users?.length ? (
              usersQuery.data.users.map((user) => (
                <UserRow
                  key={user.id}
                  user={user}
                  onUpdate={handleUpdateRole}
                  pendingId={pendingId}
                  isSaving={updateRole.isPending}
                />
              ))
            ) : usersQuery.isLoading || usersQuery.isError ? null : (
              <TableRow>
                <TableCell colSpan={4}>No users found for “{searchTerm}”.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
