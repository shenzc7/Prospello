import type { Metadata } from 'next'
import { Suspense } from 'react'
import { strings } from '@/config/strings'
import { LoginForm } from '@/components/auth/LoginForm'
import { Logo } from '@/components/brand/Logo'

export const metadata: Metadata = {
  title: `Sign in | ${strings.app.name}`,
  description: `Sign in to your OKR workspace`,
}

type LoginPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams
  const org = typeof params.org === 'string' ? params.org : undefined
  const inviteToken = typeof params.invite === 'string' ? params.invite : undefined
  const email = typeof params.email === 'string' ? params.email : undefined

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 p-4">
      {/* Subtle background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900" />
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-emerald-500/5 rounded-full blur-[120px]" />

      <main className="relative w-full max-w-sm" role="main">
        {/* Logo */}
        <div className="flex items-center justify-center mb-8">
          <Logo size={48} showName={true} textClassName="text-white" />
        </div>

        {/* Login card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl">
          <h1 className="text-lg font-semibold text-white text-center mb-6">
            Sign in to your workspace
          </h1>

          <Suspense fallback={<div className="text-sm text-slate-200 text-center">Loading form…</div>}>
            <LoginForm initialOrgSlug={org} inviteToken={inviteToken} initialEmail={email} />
          </Suspense>
        </div>

        <p className="text-center text-xs text-slate-200 mt-4">
          New here? <a href="/signup" className="text-emerald-300 hover:text-emerald-200 underline underline-offset-2">Create an account</a> or use SSO.
        </p>
      </main>
    </div>
  )
}
