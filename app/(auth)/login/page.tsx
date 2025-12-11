import type { Metadata } from 'next'
import { Suspense } from 'react'

import { strings } from '@/config/strings'
import { LoginForm } from '@/components/auth/LoginForm'

export const metadata: Metadata = {
  title: `Sign in | ${strings.app.name}`,
  description: `Sign in to your OKR workspace`,
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <span className="text-xl font-semibold text-white">OKRFlow</span>
        </div>

        {/* Login card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-white text-center mb-6">
            Sign in to your workspace
          </h1>

          <Suspense fallback={<LoginFormSkeleton />}>
            <LoginForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-slate-600 mt-4">
          Need access? Contact your admin.
        </p>
      </div>
    </div>
  )
}

function LoginFormSkeleton() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="grid grid-cols-3 gap-2">
        <div className="h-10 bg-slate-800 rounded-lg" />
        <div className="h-10 bg-slate-800 rounded-lg" />
        <div className="h-10 bg-slate-800 rounded-lg" />
      </div>
      <div className="h-px bg-slate-800" />
      <div className="h-10 bg-slate-800 rounded-lg" />
      <div className="h-10 bg-slate-800 rounded-lg" />
      <div className="h-10 bg-slate-800 rounded-lg" />
    </div>
  )
}
