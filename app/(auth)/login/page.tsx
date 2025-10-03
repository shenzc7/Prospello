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
    <div className="relative flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background px-4 py-8 sm:px-6 lg:px-8">
      {/* Background decorative elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/4 top-1/4 h-64 w-64 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-accent/10 blur-3xl"></div>
      </div>

      {/* Main content container */}
      <div className="w-full max-w-lg">
        {/* Header section */}
        <div className="mb-12 text-center">
          <div className="mx-auto mb-8 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 shadow-card">
            <span className="text-3xl font-bold text-primary-foreground">P</span>
          </div>
          <h1 className="text-4xl font-bold text-foreground mb-4">{strings.app.name}</h1>
          <p className="text-lg text-muted-foreground max-w-md mx-auto leading-relaxed">
            {strings.app.tagline}
          </p>
        </div>

        {/* Login card */}
        <Card className="shadow-card border-border/50 bg-card/95 backdrop-blur-sm">
          <CardHeader className="space-y-2 pb-8">
            <CardTitle className="text-2xl font-semibold text-foreground">Sign in to your account</CardTitle>
            <CardDescription className="text-muted-foreground">
              Enter your credentials to access your workspace
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Suspense fallback={
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted/60"></div>
                  <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-20 animate-pulse rounded bg-muted/60"></div>
                  <div className="h-12 w-full animate-pulse rounded-lg bg-muted/60"></div>
                </div>
                <div className="h-12 w-full animate-pulse rounded-full bg-primary/20"></div>
              </div>
            }>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Additional info */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground">
            New to {strings.app.name}?{' '}
            <a href="#" className="font-medium text-primary hover:text-primary/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 rounded">
              Contact your administrator
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
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
