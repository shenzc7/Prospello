'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import * as React from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { Alert } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters')
})

type FormValues = z.infer<typeof schema>

export function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const callbackUrl = params?.get('callbackUrl') ?? '/dashboard'
  const [formError, setFormError] = React.useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = React.useState(false)

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
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Email address</FormLabel>
              <FormControl>
                <Input
                  data-testid="login-email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className="h-12 rounded-lg border-border bg-background px-4 text-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium text-foreground">Password</FormLabel>
              <FormControl>
                <Input
                  data-testid="login-password"
                  type="password"
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  className="h-12 rounded-lg border-border bg-background px-4 text-sm transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />

        {formError ? (
          <Alert data-testid="login-error" variant="destructive" className="rounded-lg border-destructive/20 bg-destructive/5 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-destructive">⚠️</span>
              {formError}
            </div>
          </Alert>
        ) : null}

        <Button
          data-testid="login-submit"
          className="h-12 w-full rounded-lg bg-primary text-primary-foreground font-medium text-sm shadow-card hover:shadow-card-hover hover:bg-primary/90 focus:ring-2 focus:ring-primary/20 transition-all"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <div className="flex items-center gap-3">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
              Signing in...
            </div>
          ) : (
            'Sign in to your account'
          )}
        </Button>
      </form>
    </Form>
  )
}
