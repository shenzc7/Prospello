'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { signIn, useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Button } from '@/components/ui/button'
import { FormField, FormItem } from '@/components/ui/form'
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
  const callbackUrl = params?.get('callbackUrl') ?? '/okrs'
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [focusedField, setFocusedField] = React.useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: '',
      password: ''
    }
  })

  // Redirect to callback URL when session becomes available
  React.useEffect(() => {
    if (session?.user && status === 'authenticated') {
      router.push(callbackUrl)
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
        redirect: false // Handle redirect manually
      })

      if (result?.error) {
        setFormError('Invalid email or password')
        setIsSubmitting(false)
        return
      }

      // If signIn succeeds, the session will be updated and useEffect will handle the redirect
      // If for some reason the session doesn't update, we'll redirect manually after a short delay
      setTimeout(() => {
        if (status !== 'authenticated') {
          router.push(callbackUrl)
        }
      }, 100)
    } catch (error) {
      console.error('login failed', error)
      setFormError('Unable to sign in right now. Please try again.')
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Tab-like form container */}
        <div className="bg-slate-50/50 dark:bg-slate-800/50 rounded-2xl p-6 border border-slate-200/60 dark:border-slate-700/60">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="relative">
                    <input
                      {...field}
                      data-testid="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder=" "
                      onFocus={() => setFocusedField('email')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full h-12 px-4 pt-4 pb-2 text-sm text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 transition-all duration-200 outline-none",
                        "focus:border-slate-900 dark:focus:border-white focus:ring-0",
                        "hover:border-slate-400 dark:hover:border-slate-500",
                        (field.value || focusedField === 'email') && "pt-4 pb-2"
                      )}
                    />
                    <label className={cn(
                      "absolute left-4 transition-all duration-200 pointer-events-none",
                      "text-slate-500 dark:text-slate-400",
                      (field.value || focusedField === 'email')
                        ? "top-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                        : "top-1/2 -translate-y-1/2 text-sm"
                    )}>
                      Email address
                    </label>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <div className="relative">
                    <input
                      {...field}
                      data-testid="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder=" "
                      onFocus={() => setFocusedField('password')}
                      onBlur={() => setFocusedField(null)}
                      className={cn(
                        "w-full h-12 px-4 pt-4 pb-2 text-sm text-slate-900 dark:text-white bg-transparent border-b border-slate-300 dark:border-slate-600 transition-all duration-200 outline-none",
                        "focus:border-slate-900 dark:focus:border-white focus:ring-0",
                        "hover:border-slate-400 dark:hover:border-slate-500",
                        (field.value || focusedField === 'password') && "pt-4 pb-2"
                      )}
                    />
                    <label className={cn(
                      "absolute left-4 transition-all duration-200 pointer-events-none",
                      "text-slate-500 dark:text-slate-400",
                      (field.value || focusedField === 'password')
                        ? "top-1 text-xs font-medium text-slate-700 dark:text-slate-300"
                        : "top-1/2 -translate-y-1/2 text-sm"
                    )}>
                      Password
                    </label>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        {formError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-3">
              <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-xs">!</span>
              </div>
              <p className="text-sm text-red-700 dark:text-red-300 font-medium">{formError}</p>
            </div>
          </div>
        )}

        <Button
          data-testid="login-submit"
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "w-full h-12 rounded-xl font-medium text-sm transition-all duration-200",
            "bg-slate-900 dark:bg-white text-white dark:text-slate-900",
            "hover:bg-slate-800 dark:hover:bg-slate-100",
            "focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20",
            "disabled:opacity-50 disabled:cursor-not-allowed",
            "shadow-lg shadow-slate-900/25 dark:shadow-white/25"
          )}
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center gap-3">
              <div className="w-5 h-5 border-2 border-white/30 dark:border-slate-900/30 border-t-white dark:border-t-slate-900 rounded-full animate-spin"></div>
              <span>Signing in...</span>
            </div>
          ) : (
            'Sign in to your account'
          )}
        </Button>
      </form>
    </div>
  )
}

