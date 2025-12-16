'use client'

import * as React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@/components/ui/toaster'
import { ClientLayout } from '@/components/ClientLayout'
import AuthProvider from '@/components/auth/SessionProvider'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DemoProvider } from '@/components/demo/DemoContext'

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
      <NextThemesProvider attribute="class" defaultTheme="system" enableSystem>
        <div className="relative flex min-h-screen flex-col">
          <AuthProvider>
            <TooltipProvider>
              <DemoProvider>
                <ClientLayout>
                  {children}
                </ClientLayout>
              </DemoProvider>
            </TooltipProvider>
          </AuthProvider>
          <Toaster />
        </div>
      </NextThemesProvider>
    </QueryClientProvider>
  )
}
