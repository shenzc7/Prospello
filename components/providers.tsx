'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import * as React from 'react'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

import { Toaster } from '@/components/ui/toaster'

type ProvidersProps = {
  children: React.ReactNode
  session?: Session | null
}

export function Providers({ children, session }: ProvidersProps) {
  const [client] = React.useState(() => new QueryClient())

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>
        <NextThemesProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          {children}
          <Toaster />
        </NextThemesProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
