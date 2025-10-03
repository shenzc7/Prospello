import type { Metadata } from 'next'

import { Suspense } from 'react'
import { strings } from '@/config/strings'
import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = {
  title: `Sign in | ${strings.app.name}`,
  description: `Welcome back. Sign in to ${strings.app.name} to align teams and drive impact.`
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 rounded-full bg-gradient-to-br from-blue-400/10 to-purple-400/10 blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-gradient-to-tr from-indigo-400/10 to-blue-400/10 blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full bg-gradient-to-r from-violet-400/5 to-blue-400/5 blur-2xl animate-pulse delay-500"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 w-full max-w-md px-6 py-8">
        {/* Logo and branding */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-2xl mb-8 group hover:shadow-3xl transition-all duration-500">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="text-3xl font-black text-white tracking-tight">P</span>
          </div>

          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight">
              {strings.app.name}
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              {strings.app.tagline}
            </p>
          </div>
        </div>

        {/* Login card */}
        <Card className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl border-0 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/20">
          <CardContent className="p-8 space-y-8">
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
              <p className="text-slate-600 dark:text-slate-400">Sign in to your account</p>
            </div>

            <Suspense fallback={<LoginFormSkeleton />}>
              <LoginForm />
            </Suspense>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-12 text-center space-y-4">
          <p className="text-sm text-slate-600 dark:text-slate-400">
            New to {strings.app.name}?{' '}
            <button className="font-medium text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline-offset-4 hover:underline">
              Contact your administrator
            </button>
          </p>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p>
              By signing in, you agree to our{' '}
              <button className="text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline-offset-2 hover:underline">
                Terms of Service
              </button>{' '}
              and{' '}
              <button className="text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline-offset-2 hover:underline">
                Privacy Policy
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
      <div className="space-y-2">
        <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700 rounded"></div>
        <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
      </div>
      <div className="h-12 w-full bg-slate-200 dark:bg-slate-700 rounded-xl"></div>
    </div>
  )
}
