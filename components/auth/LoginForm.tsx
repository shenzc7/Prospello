'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
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
  const callbackUrl = params?.get('callbackUrl') ?? '/dashboard'
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

  const onSubmit = async (values: FormValues) => {
    setFormError(null)
    setIsSubmitting(true)
    try {
      const result = await signIn('credentials', {
        redirect: false,
        email: values.email,
        password: values.password
      })

      if (result?.error) {
        setFormError('Invalid email or password')
        return
      }

      router.replace(callbackUrl)
    } catch (error) {
      console.error('login failed', error)
      setFormError('Unable to sign in right now. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-5">
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
                      "w-full h-14 px-4 pt-5 pb-2 text-slate-900 dark:text-white bg-transparent border rounded-xl transition-all duration-200 outline-none",
                      "border-slate-200 dark:border-slate-700",
                      "focus:border-slate-900 dark:focus:border-white focus:ring-0",
                      "hover:border-slate-300 dark:hover:border-slate-600",
                      (field.value || focusedField === 'email') && "pt-5 pb-2"
                    )}
                  />
                  <label className={cn(
                    "absolute left-4 transition-all duration-200 pointer-events-none",
                    "text-slate-500 dark:text-slate-400",
                    (field.value || focusedField === 'email')
                      ? "top-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                      : "top-1/2 -translate-y-1/2 text-base"
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
                      "w-full h-14 px-4 pt-5 pb-2 text-slate-900 dark:text-white bg-transparent border rounded-xl transition-all duration-200 outline-none",
                      "border-slate-200 dark:border-slate-700",
                      "focus:border-slate-900 dark:focus:border-white focus:ring-0",
                      "hover:border-slate-300 dark:hover:border-slate-600",
                      (field.value || focusedField === 'password') && "pt-5 pb-2"
                    )}
                  />
                  <label className={cn(
                    "absolute left-4 transition-all duration-200 pointer-events-none",
                    "text-slate-500 dark:text-slate-400",
                    (field.value || focusedField === 'password')
                      ? "top-2 text-xs font-medium text-slate-700 dark:text-slate-300"
                      : "top-1/2 -translate-y-1/2 text-base"
                  )}>
                    Password
                  </label>
                </div>
              </FormItem>
            )}
          />
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
            "w-full h-14 rounded-xl font-medium text-base transition-all duration-200",
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

