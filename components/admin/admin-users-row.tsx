'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import type { Role } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { TableCell, TableRow } from '@/components/ui/table'
import { strings } from '@/config/strings'

import type { AdminUser } from './admin-users-client'
import { ROLE_OPTIONS } from './admin-users-client'

type Props = {
  user: AdminUser
  onUpdate: (userId: string, role: Role) => Promise<void>
  pendingId?: string | null
  isSaving: boolean
}

export function UserRow({ user, onUpdate, pendingId, isSaving }: Props) {
  const form = useForm<{ role: Role }>({
    defaultValues: { role: user.role }
  })

  React.useEffect(() => {
    form.reset({ role: user.role })
  }, [user.role, form])

  const dirty = form.formState.isDirty
  const saving = isSaving && pendingId === user.id

  const onSubmit = form.handleSubmit(async (values) => {
    await onUpdate(user.id, values.role)
    form.reset(values)
  })

  return (
    <TableRow data-testid={`admin-users-row-${user.id}`}>
      <TableCell data-testid={`admin-users-email-${user.id}`}>{user.email}</TableCell>
      <TableCell>{user.name ?? '—'}</TableCell>
      <TableCell>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="min-w-[150px]">
                  <FormControl>
                    <select
                      {...field}
                      data-testid={`admin-users-role-${user.id}`}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              data-testid={`admin-users-save-${user.id}`}
              type="submit"
              disabled={!dirty || saving}
            >
              {saving ? strings.buttons.saving : strings.buttons.save}
            </Button>
          </form>
        </Form>
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">
        Updated {new Date(user.updatedAt).toLocaleDateString()}
      </TableCell>
    </TableRow>
  )
}
