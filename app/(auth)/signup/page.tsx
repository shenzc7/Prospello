import type { Metadata } from 'next'
import Link from 'next/link'
import { Suspense } from 'react'

import { strings } from '@/config/strings'
import { SignupForm } from '@/components/auth/SignupForm'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = {
  title: `Create account | ${strings.app.name}`,
  description: `Create your OKR workspace account`,
}

export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

      <div className="relative w-full max-w-sm">
        <div className="flex items-center justify-center mb-8">
          <Logo size={48} showName={true} textClassName="text-white" />
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-white text-center mb-6">
            Join OKRFlow
          </h1>

          <Suspense fallback={<SignupFormSkeleton />}>
            <SignupForm />
          </Suspense>
        </div>

        <p className="text-center text-xs text-slate-500 mt-4">
          Already have an account?{' '}
          <Link href="/login" className="text-emerald-400 hover:text-emerald-300">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}

function SignupFormSkeleton() {
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
