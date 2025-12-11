'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const { data: session, status } = useSession()
  const callbackUrl = params?.get('callbackUrl') ?? '/'
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [ssoLoading, setSsoLoading] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
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
        redirect: false
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

  const handleSsoSignIn = async (provider: 'google' | 'slack' | 'azure-ad') => {
    setFormError(null)
    setSsoLoading(provider)
    try {
      await signIn(provider, { callbackUrl })
    } catch (error) {
      console.error('sso sign-in failed', error)
      setFormError('SSO sign-in failed. Try again or use your credentials.')
      setSsoLoading(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* SSO Buttons */}
      <div className="grid grid-cols-3 gap-3">
        <SsoButton
          provider="google"
          loading={ssoLoading === 'google'}
          disabled={!!ssoLoading}
          onClick={() => handleSsoSignIn('google')}
          icon={<GoogleIcon />}
        />
        <SsoButton
          provider="slack"
          loading={ssoLoading === 'slack'}
          disabled={!!ssoLoading}
          onClick={() => handleSsoSignIn('slack')}
          icon={<SlackIcon />}
        />
        <SsoButton
          provider="microsoft"
          loading={ssoLoading === 'azure-ad'}
          disabled={!!ssoLoading}
          onClick={() => handleSsoSignIn('azure-ad')}
          icon={<MicrosoftIcon />}
        />
      </div>

      {/* Divider */}
      <div className="relative flex items-center justify-center">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-700/50"></div>
        </div>
        <span className="relative bg-slate-900 px-4 text-xs text-slate-500 uppercase tracking-wider">
          or continue with email
        </span>
      </div>

      {/* Email/Password Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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

// SSO Button Component
function SsoButton({ 
  provider, 
  loading, 
  disabled, 
  onClick, 
  icon 
}: { 
  provider: string
  loading: boolean
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 flex items-center justify-center rounded-lg border transition-all duration-200",
        "bg-slate-800/50 border-slate-700",
        "hover:bg-slate-800 hover:border-slate-600",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title={`Sign in with ${provider}`}
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-slate-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        icon
      )}
    </button>
  )
}

// SVG Icons for SSO providers
function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  )
}

function SlackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z"/>
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z"/>
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z"/>
      <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z"/>
    </svg>
  )
}

function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#F25022" d="M1 1h10v10H1z"/>
      <path fill="#00A4EF" d="M1 13h10v10H1z"/>
      <path fill="#7FBA00" d="M13 1h10v10H13z"/>
      <path fill="#FFB900" d="M13 13h10v10H13z"/>
    </svg>
  )
}
