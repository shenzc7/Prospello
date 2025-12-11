'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'

export type SsoProvider = 'google' | 'slack' | 'azure-ad'

export function SsoButtons({
  loadingProvider,
  disabled,
  onSelect,
}: {
  loadingProvider: SsoProvider | null
  disabled?: boolean
  onSelect: (provider: SsoProvider) => void
}) {
  return (
    <div className="grid grid-cols-3 gap-3">
      <SsoButton
        provider="google"
        loading={loadingProvider === 'google'}
        disabled={!!loadingProvider || disabled}
        onClick={() => onSelect('google')}
        icon={<GoogleIcon />}
      />
      <SsoButton
        provider="slack"
        loading={loadingProvider === 'slack'}
        disabled={!!loadingProvider || disabled}
        onClick={() => onSelect('slack')}
        icon={<SlackIcon />}
      />
      <SsoButton
        provider="azure-ad"
        loading={loadingProvider === 'azure-ad'}
        disabled={!!loadingProvider || disabled}
        onClick={() => onSelect('azure-ad')}
        icon={<MicrosoftIcon />}
      />
    </div>
  )
}

function SsoButton({
  provider,
  loading,
  disabled,
  onClick,
  icon,
}: {
  provider: string
  loading: boolean
  disabled: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-11 flex items-center justify-center rounded-lg border transition-all duration-200",
        "bg-slate-800/50 border-slate-700",
        "hover:bg-slate-800 hover:border-slate-600",
        "focus:outline-none focus:ring-2 focus:ring-emerald-500/40",
        "disabled:opacity-50 disabled:cursor-not-allowed"
      )}
      title={`Sign in with ${provider}`}
      suppressHydrationWarning
    >
      {loading ? (
        <svg className="animate-spin h-5 w-5 text-slate-400" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
      ) : (
        icon
      )}
    </button>
  )
}

export function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" suppressHydrationWarning>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

export function SlackIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" suppressHydrationWarning>
      <path fill="#E01E5A" d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" />
      <path fill="#36C5F0" d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" />
      <path fill="#2EB67D" d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" />
      <path fill="#ECB22E" d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" />
    </svg>
  )
}

export function MicrosoftIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" suppressHydrationWarning>
      <path fill="#F25022" d="M1 1h10v10H1z" />
      <path fill="#00A4EF" d="M1 13h10v10H1z" />
      <path fill="#7FBA00" d="M13 1h10v10H13z" />
      <path fill="#FFB900" d="M13 13h10v10H13z" />
    </svg>
  )
}
