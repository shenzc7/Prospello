'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ClientLayout } from '@/components/ClientLayout'
import AuthProvider from '@/components/auth/SessionProvider'
import { TooltipProvider } from '@/components/ui/tooltip'

type ProvidersProps = {
  children: React.ReactNode
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
    },
  },
})

export function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <NextThemesProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
        <div className="relative flex min-h-screen flex-col">
          <AuthProvider>
            <TooltipProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </TooltipProvider>
          </AuthProvider>
          <Toaster />
        </div>
      </NextThemesProvider>
    </QueryClientProvider>
  )
}
