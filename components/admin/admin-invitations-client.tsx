'use client'

import * as React from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Role } from '@prisma/client'
import { useSession } from 'next-auth/react'
import { Copy, Link2, Clock3 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { useDemoMode } from '@/components/demo/DemoProvider'
import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

const formSchema = z.object({
  email: z.string().email('Enter a valid work email'),
  role: z.nativeEnum(Role).default('EMPLOYEE'),
  expiresInDays: z.coerce.number().int().min(1).max(90).default(14),
})

type FormValues = z.infer<typeof formSchema>

type InvitationResult = {
  email: string
  role: Role
  expiresAt?: string
  inviteUrl: string
}

const ROLE_OPTIONS: Role[] = ['ADMIN', 'MANAGER', 'EMPLOYEE']

function extractInvitation(body: unknown): InvitationResult | null {
  if (!body || typeof body !== 'object') return null

  const wrapper = body as Record<string, unknown>
  const payload = wrapper.data && typeof wrapper.data === 'object'
    ? (wrapper.data as Record<string, unknown>)
    : wrapper

  const invite = payload.invitation && typeof payload.invitation === 'object'
    ? (payload.invitation as Record<string, unknown>)
    : payload

  const inviteUrl = typeof invite.inviteUrl === 'string' ? invite.inviteUrl : null
  if (!inviteUrl) return null

  return {
    email: typeof invite.email === 'string' ? invite.email : '',
    role: (invite.role as Role) ?? 'EMPLOYEE',
    expiresAt: typeof invite.expiresAt === 'string' ? invite.expiresAt : undefined,
    inviteUrl,
  }
}

export function AdminInvitationsClient() {
  const { data: session } = useSession()
  const { enabled: demoEnabled } = useDemoMode()
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [invite, setInvite] = React.useState<InvitationResult | null>(null)
  const [error, setError] = React.useState<string | null>(null)
  const [copied, setCopied] = React.useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      role: 'EMPLOYEE',
      expiresInDays: 14,
    },
  })

  const isAdmin = session?.user?.role === 'ADMIN' || demoEnabled

  const onSubmit = async (values: FormValues) => {
    setError(null)
    setIsSubmitting(true)
    setInvite(null)
    setCopied(false)

    if (demoEnabled) {
      toast.info('Demo mode is read-only. Disable demo to send invitations.')
      setIsSubmitting(false)
      return
    }

    try {
      const res = await fetch('/api/invitations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          role: values.role,
          expiresInDays: values.expiresInDays,
        }),
      })

      const body = await res.json().catch(() => null)
      if (!res.ok || !body?.ok) {
        const message = body?.error?.msg || 'Failed to create invitation'
        throw new Error(message)
      }

      const result = extractInvitation(body)
      if (!result) {
        throw new Error('Invite created but link missing from response')
      }

      setInvite(result)
      toast.success('Invitation created')
      form.reset({ email: '', role: values.role, expiresInDays: values.expiresInDays })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to create invite'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCopy = async () => {
    if (!invite?.inviteUrl) return
    try {
      await navigator.clipboard.writeText(invite.inviteUrl)
      setCopied(true)
      toast.success('Invite link copied')
      setTimeout(() => setCopied(false), 1500)
    } catch {
      toast.error('Copy failed. Please copy the link manually.')
    }
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        Invitations are restricted to administrators.
      </Alert>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle>Send an invitation</CardTitle>
          <CardDescription>
            Create a shareable link to invite teammates to your workspace. Links expire after the set number of days.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="sm:col-span-2">
                      <FormLabel>Invitee email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="teammate@company.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role on join</FormLabel>
                      <FormControl>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                          <SelectContent>
                            {ROLE_OPTIONS.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role.charAt(0) + role.slice(1).toLowerCase()}
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
                  control={form.control}
                  name="expiresInDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Expires in (days)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min={1}
                          max={90}
                          inputMode="numeric"
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const value = e.target.value
                            field.onChange(value === '' ? '' : Number(value))
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {error ? (
                <Alert variant="destructive">{error}</Alert>
              ) : null}

              <Button type="submit" disabled={isSubmitting || demoEnabled}>
                {isSubmitting ? 'Creating…' : 'Generate invite link'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {invite ? (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle>Invitation ready</CardTitle>
            <CardDescription>
              Share this link with {invite.email}. They&apos;ll be asked to set a password on signup.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex-1 rounded-lg border bg-muted/50 px-3 py-2 text-sm break-all">
                {invite.inviteUrl}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" onClick={handleCopy}>
                  <Copy className="mr-2 h-4 w-4" />
                  {copied ? 'Copied' : 'Copy'}
                </Button>
                <Button asChild variant="secondary">
                  <a href={invite.inviteUrl} target="_blank" rel="noreferrer">
                    <Link2 className="mr-2 h-4 w-4" />
                    Open
                  </a>
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                Role: {invite.role}
              </span>
              {invite.expiresAt ? (
                <span className="inline-flex items-center gap-1 rounded-full border px-2 py-1">
                  <Clock3 className="h-3.5 w-3.5" />
                  Expires {new Date(invite.expiresAt).toLocaleString()}
                </span>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  )
}
