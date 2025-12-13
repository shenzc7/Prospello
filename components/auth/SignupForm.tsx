'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { SsoButtons, type SsoProvider } from '@/components/auth/SsoButtons'

const createSchema = (hasInvite: boolean) => z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Please confirm your password'),
  orgName: hasInvite 
    ? z.string().optional()
    : z.string().min(2, 'Organization name must be at least 2 characters').optional(),
}).refine((values) => values.password === values.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords do not match',
})

export function SignupForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params?.get('callbackUrl') ?? '/'
  const inviteToken = params?.get('invite')
  const inviteEmail = params?.get('email')
  const orgSlug = params?.get('org')
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [ssoLoading, setSsoLoading] = React.useState<SsoProvider | null>(null)

  const schema = React.useMemo(() => createSchema(!!inviteToken), [inviteToken])
  type FormValues = z.infer<typeof schema>

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      email: inviteEmail || '',
      password: '',
      confirmPassword: '',
      orgName: '',
    },
  })

  const { register, handleSubmit, formState: { errors } } = form

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: values.name,
          email: values.email,
          password: values.password,
          orgName: inviteToken ? undefined : (values.orgName || undefined),
          inviteToken: inviteToken || undefined,
        }),
      })

      const body = await res.json()
      if (!res.ok || !body?.ok) {
        throw new Error(body?.error?.msg || 'Unable to create account')
      }

      toast.success('Account created. Signing you in…')
      await signIn('credentials', { email: values.email, password: values.password, callbackUrl })
      router.push(callbackUrl)
      router.refresh()
    } catch (error: unknown) {
      console.error('signup failed', error)
      const message = error instanceof Error ? error.message : 'Unable to sign up right now. Please try again.'
      setFormError(message)
      setIsSubmitting(false)
    }
  }

  const handleSsoSignIn = async (provider: SsoProvider) => {
    setFormError(null)
    setSsoLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error('sso sign-in failed', error)
      setFormError('SSO sign-in failed. Try again or use email.')
      setSsoLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      <SsoButtons loadingProvider={ssoLoading} onSelect={handleSsoSignIn} />

      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700/50"></div>
        </div>
        <span className="relative bg-slate-900 px-4 text-xs text-slate-500 uppercase tracking-wider">
          or create with email
        </span>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-300 mb-2">
              Full name
            </label>
            <input
              {...register('name')}
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name"
              className={cn(
                "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                "text-white placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                "hover:border-slate-600",
                errors.name ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.name && (
              <p className="mt-1.5 text-xs text-red-400">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Work email
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              placeholder="name@company.com"
              disabled={!!inviteToken}
              className={cn(
                "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                "text-white placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                "hover:border-slate-600",
                inviteToken && "opacity-60 cursor-not-allowed",
                errors.email ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
            {inviteToken && (
              <p className="mt-1.5 text-xs text-slate-400">Email is pre-filled from your invitation</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(
                  "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                  "hover:border-slate-600",
                  errors.password ? "border-red-500/50" : "border-slate-700"
                )}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-400">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-300 mb-2">
                Confirm password
              </label>
              <input
                {...register('confirmPassword')}
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                className={cn(
                  "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                  "hover:border-slate-600",
                  errors.confirmPassword ? "border-red-500/50" : "border-slate-700"
                )}
              />
              {errors.confirmPassword && (
                <p className="mt-1.5 text-xs text-red-400">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          {!inviteToken && (
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-slate-300 mb-2">
                Organization (optional)
              </label>
              <input
                {...register('orgName')}
                id="orgName"
                type="text"
                placeholder="e.g., TechFlow"
                className={cn(
                  "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                  "text-white placeholder:text-slate-500",
                  "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                  "hover:border-slate-600",
                  errors.orgName ? "border-red-500/50" : "border-slate-700"
                )}
              />
              {errors.orgName && (
                <p className="mt-1.5 text-xs text-red-400">{errors.orgName.message}</p>
              )}
            </div>
          )}
          {inviteToken && orgSlug && (
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <p className="text-sm text-emerald-400">
                You&apos;re joining <strong>{orgSlug}</strong> organization
              </p>
            </div>
          )}
        </div>

        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-400">{formError}</p>
          </div>
        )}

        <ButtonRow isSubmitting={isSubmitting} />
      </form>
    </div>
  )
}

function ButtonRow({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className={cn(
        "w-full h-12 rounded-lg font-semibold text-sm transition-all duration-200",
        "bg-emerald-500 text-white",
        "hover:bg-emerald-400",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:ring-offset-2 focus:ring-offset-slate-900",
        "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-500",
        "shadow-lg shadow-emerald-500/20"
      )}
    >
      {isSubmitting ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Creating account…
        </span>
      ) : (
        'Create account'
      )}
    </button>
  )
}
