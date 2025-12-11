'use client'

import * as React from 'react'
import { useForm } from 'react-hook-form'
import type { Role } from '@prisma/client'

import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form'
import { TableCell, TableRow } from '@/components/ui/table'
import { strings } from '@/config/strings'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

import type { AdminUser } from './admin-users-client'
import { ROLE_OPTIONS } from './admin-users-client'

type Props = {
  user: AdminUser
  onUpdate: (userId: string, role: Role) => Promise<void>
  onUpdateTeams: (userId: string, teamIds: string[]) => Promise<void>
  availableTeams: Array<{ id: string; name: string }>
  pendingId?: string | null
  isSaving: boolean
}

export function UserRow({ user, onUpdate, onUpdateTeams, availableTeams, pendingId, isSaving }: Props) {
  const form = useForm<{ role: Role }>({
    defaultValues: { role: user.role }
  })
  const [selectedTeam, setSelectedTeam] = React.useState('')

  React.useEffect(() => {
    form.reset({ role: user.role })
  }, [user.role, form])

  const dirty = form.formState.isDirty
  const saving = isSaving && pendingId === user.id

  const onSubmit = form.handleSubmit(async (values) => {
    await onUpdate(user.id, values.role)
    form.reset(values)
  })

  const currentTeamIds = user.teams?.map((team) => team.id) ?? []

  return (
    <TableRow data-testid={`admin-users-row-${user.id}`}>
      <TableCell data-testid={`admin-users-email-${user.id}`}>{user.email}</TableCell>
      <TableCell>{user.name ?? '—'}</TableCell>
      <TableCell>
        <Form {...form}>
          <form onSubmit={onSubmit} className="flex flex-col gap-2">
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
            <div className="flex items-center gap-2">
              <Button
                data-testid={`admin-users-save-${user.id}`}
                type="submit"
                disabled={!dirty || saving}
              >
                {saving ? strings.buttons.saving : strings.buttons.save}
              </Button>
              <div className="flex flex-wrap gap-2">
                {user.teams?.map((team) => (
                  <Badge key={team.id} variant="outline" className="flex items-center gap-1">
                    {team.name}
                    <button
                      type="button"
                      aria-label={`Remove ${team.name}`}
                      className="text-[10px] leading-none"
                      onClick={() => onUpdateTeams(user.id, currentTeamIds.filter((id) => id !== team.id))}
                    >
                      ✕
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTeam} onValueChange={setSelectedTeam}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Assign to team" />
                </SelectTrigger>
                <SelectContent>
                  {availableTeams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  if (selectedTeam) {
                    onUpdateTeams(user.id, Array.from(new Set([...currentTeamIds, selectedTeam])))
                    setSelectedTeam('')
                  }
                }}
                disabled={!selectedTeam || saving}
              >
                Add team
              </Button>
            </div>
          </form>
        </Form>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(user.createdAt).toLocaleDateString()}
      </TableCell>
      <TableCell className="text-right text-xs text-muted-foreground">
        Updated {new Date(user.updatedAt).toLocaleDateString()}
      </TableCell>
    </TableRow>
  )
}
