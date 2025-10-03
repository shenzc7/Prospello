import type { Metadata } from 'next'

import { Suspense } from 'react'
import { strings } from '@/config/strings'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: `Sign in | ${strings.app.name}`,
  description: `Welcome back. Sign in to ${strings.app.name} to align teams and drive impact.`
}

export default function LoginPage() {
  return (
    <div className="relative flex min-h-screen items-center justify-center px-4 py-8 sm:px-6 lg:px-8">
      {/* Subtle background gradient */}
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-muted/20 via-background to-muted/10" aria-hidden />

      {/* Main content container */}
      <div className="w-full max-w-md space-y-8">
        {/* Logo and branding */}
        <div className="text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 ring-1 ring-border/20">
            <span className="text-3xl font-bold text-primary">P</span>
          </div>
          <h1 className="text-3xl font-semibold text-foreground">{strings.app.name}</h1>
          <p className="mt-3 text-sm text-muted-foreground max-w-sm mx-auto">{strings.app.tagline}</p>
        </div>

        {/* Login card */}
        <Card className="border-border/40 bg-card/90 shadow-lg backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-6">
            <CardTitle className="text-2xl font-semibold text-foreground text-center">Welcome back</CardTitle>
            <CardDescription className="text-muted-foreground text-center">
              Sign in to your account to continue
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Suspense fallback={
              <div className="space-y-4">
                <div className="h-11 w-full animate-pulse rounded-lg bg-muted/60"></div>
                <div className="h-11 w-full animate-pulse rounded-lg bg-muted/60"></div>
                <div className="h-11 w-full animate-pulse rounded-lg bg-primary/20"></div>
              </div>
            }>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <a href="#" className="text-primary underline hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-primary underline hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
