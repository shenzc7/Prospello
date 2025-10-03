import type { Metadata } from 'next'

import { Suspense } from 'react'
import { strings } from '@/config/strings'
import { Card, CardContent } from '@/components/ui/card'
import { LoginForm } from '@/components/auth/LoginForm'

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

      {/* Main content - Horizontal layout */}
      <div className="relative z-10 w-full max-w-6xl px-4 sm:px-6 py-8 mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-center gap-8 lg:gap-12 min-h-[600px]">
          {/* Left side - Brand section */}
          <div className="flex-1 text-center lg:text-left animate-fade-in max-w-md">
            <div className="inline-flex items-center gap-4 p-6 sm:p-8 rounded-3xl bg-white/60 dark:bg-slate-900/60 backdrop-blur-sm border border-slate-200/50 dark:border-slate-700/50 shadow-xl shadow-slate-900/5 dark:shadow-slate-900/10 group">
              {/* Logo */}
              <div className="flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 shadow-lg group-hover:shadow-xl transition-all duration-300 animate-float">
                <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">P</span>
              </div>

              {/* Brand text */}
              <div className="flex flex-col">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-semibold text-slate-900 dark:text-white tracking-tight leading-tight mb-2">
                  {strings.app.name}
                </h1>
                <p className="text-base sm:text-lg text-slate-600 dark:text-slate-400 leading-relaxed">
                  {strings.app.tagline}
                </p>
              </div>
            </div>
          </div>

          {/* Right side - Login section */}
          <div className="flex-1 max-w-md w-full animate-slide-up" style={{ animationDelay: '0.2s' }}>
            <Card className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/60 dark:border-slate-700/60 shadow-2xl shadow-slate-900/10 dark:shadow-slate-900/20 hover:shadow-3xl hover:shadow-slate-900/15 dark:hover:shadow-slate-900/30 transition-all duration-300">
              <CardContent className="p-6 sm:p-8 space-y-6">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl sm:text-3xl font-semibold text-slate-900 dark:text-white">Welcome back</h2>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400">Sign in to your workspace</p>
                </div>

                <Suspense fallback={<LoginFormSkeleton />}>
                  <LoginForm />
                </Suspense>
              </CardContent>
            </Card>

            {/* Footer */}
            <div className="mt-6 text-center space-y-3">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                New to {strings.app.name}?{' '}
                <button className="font-medium text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 rounded">
                  Contact your administrator
                </button>
              </p>

              <div className="text-xs text-slate-500 dark:text-slate-400">
                <p>
                  By signing in, you agree to our{' '}
                  <button className="text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 rounded">
                    Terms of Service
                  </button>{' '}
                  and{' '}
                  <button className="text-slate-900 dark:text-white hover:text-slate-700 dark:hover:text-slate-300 transition-colors duration-200 underline-offset-2 hover:underline focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:focus:ring-white/20 rounded">
                    Privacy Policy
                  </button>
                </p>
              </div>
            </div>
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
