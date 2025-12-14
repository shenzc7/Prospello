'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { cn } from '@/lib/utils'
import { SsoButtons, type SsoProvider } from '@/components/auth/SsoButtons'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type FormValues = z.infer<typeof schema>

type LoginFormProps = {
  initialOrgSlug?: string
  inviteToken?: string
  initialEmail?: string
}

export function LoginForm({ initialOrgSlug, inviteToken, initialEmail }: LoginFormProps) {
  const router = useRouter()
  const params = useSearchParams()
  const { data: session, status } = useSession()
  const callbackUrl = params?.get('callbackUrl') ?? '/'
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [ssoLoading, setSsoLoading] = React.useState<SsoProvider | null>(null)
  const [hydrated, setHydrated] = React.useState(false)
  const [workspaceSlug, setWorkspaceSlug] = React.useState(initialOrgSlug || '')

  React.useEffect(() => {
    setHydrated(true)
  }, [])

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: initialEmail || '',
      password: ''
    }
  })

  const { register, handleSubmit, formState: { errors } } = form

  // Redirect to callback URL when session becomes available
  React.useEffect(() => {
    if (session?.user && status === 'authenticated') {
      router.push(callbackUrl)
      router.refresh()
    }
  }, [session, status, router, callbackUrl])

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await signIn('credentials', {
        email: values.email,
        password: values.password,
        callbackUrl: callbackUrl,
        redirect: false,
        org: workspaceSlug || undefined,
        invite: inviteToken || undefined,
      })

      if (result?.error) {
        setFormError('Invalid email or password')
        setIsSubmitting(false)
        return
      }

      router.push(callbackUrl)
      router.refresh()
    } catch (error) {
      console.error('login failed', error)
      setFormError('Unable to sign in right now. Please try again.')
      setIsSubmitting(false)
    }
  }

  const handleSsoSignIn = async (provider: SsoProvider) => {
    setFormError(null)
    setSsoLoading(provider)
    try {
      await signIn(provider, { callbackUrl, org: workspaceSlug || undefined })
    } catch (error) {
      console.error('sso sign-in failed', error)
      setFormError('SSO sign-in failed. Try again or use your credentials.')
      setSsoLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* SSO Buttons */}
      <SsoButtons loadingProvider={ssoLoading} onSelect={handleSsoSignIn} />

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-600/60"></div>
        </div>
        <span className="relative bg-slate-900 px-4 text-xs text-slate-200 uppercase tracking-wider">
          or continue with email
        </span>
      </div>

      {/* Email/Password Form */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
        data-testid="login-form"
        data-hydrated={hydrated ? 'true' : 'false'}
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-300 mb-2">
              Email address
            </label>
            <input
              {...register('email')}
              id="email"
              type="email"
              autoComplete="email"
              data-testid="login-email"
              placeholder="name@company.com"
              className={cn(
                "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                "text-white placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                "hover:border-slate-600",
                errors.email ? "border-red-500/50" : "border-slate-700"
              )}
            />
            {errors.email && (
              <p className="mt-1.5 text-xs text-red-400">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-300 mb-2">
              Password
            </label>
            <input
              {...register('password')}
              id="password"
              type="password"
              autoComplete="current-password"
              data-testid="login-password"
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
            <label htmlFor="workspace" className="block text-sm font-medium text-slate-300 mb-2">
              Workspace slug <span className="text-slate-500">(optional)</span>
            </label>
            <input
              id="workspace"
              type="text"
              autoComplete="organization"
              placeholder="e.g. techflow-solutions"
              value={workspaceSlug}
              onChange={(e) => setWorkspaceSlug(e.target.value.trim())}
              className={cn(
                "w-full h-12 px-4 text-sm bg-slate-800/50 border rounded-lg transition-all duration-200",
                "text-white placeholder:text-slate-500",
                "focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500",
                "hover:border-slate-600",
                "border-slate-700"
              )}
            />
            <p className="mt-1.5 text-xs text-slate-400">
              Provided in invite links; used for org-scoped SSO.
            </p>
          </div>
        </div>

        {/* Error message */}
        {formError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
            <svg className="w-4 h-4 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-red-400">{formError}</p>
          </div>
        )}

        {/* Submit button */}
        <button
          type="submit"
          disabled={isSubmitting}
          data-testid="login-submit"
          className={cn(
            "w-full h-12 rounded-lg font-semibold text-sm transition-all duration-200",
            "bg-emerald-700 text-white",
            "hover:bg-emerald-600",
            "focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:ring-offset-2 focus:ring-offset-slate-900",
            "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:bg-emerald-700",
            "shadow-lg shadow-emerald-500/25"
          )}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Signing in...
            </span>
          ) : (
            'Sign in'
          )}
        </button>
      </form>
    </div>
  )
}
