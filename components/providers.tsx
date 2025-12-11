'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { Session } from 'next-auth'
import { SessionProvider } from 'next-auth/react'
import * as React from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

import { ThemeProvider as NextThemesProvider } from 'next-themes'

import { Toaster } from '@/components/ui/toaster'
import { ClientLayout } from '@/components/ClientLayout'
import { DemoProvider } from '@/components/demo/DemoProvider'

type ProvidersProps = {
  children: React.ReactNode
  session?: Session | null
}

// Loading bar component for page transitions
function NavigationProgress() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isNavigating, setIsNavigating] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

  React.useEffect(() => {
    setIsNavigating(true)
    setProgress(30)
    
    const timer1 = setTimeout(() => setProgress(60), 100)
    const timer2 = setTimeout(() => setProgress(80), 200)
    const timer3 = setTimeout(() => {
      setProgress(100)
      setTimeout(() => setIsNavigating(false), 150)
    }, 300)

    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [pathname, searchParams])

  if (!isNavigating) return null

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent">
      <div 
        className="h-full bg-primary transition-all duration-150 ease-out"
        style={{ width: `${progress}%` }}
      />
    </div>
  )
}

export function Providers({ children, session }: ProvidersProps) {
  const [client] = React.useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Keep data fresh for 30 seconds before refetching
        staleTime: 30 * 1000,
        // Cache data for 5 minutes
        gcTime: 5 * 60 * 1000,
        // Don't refetch on window focus (less jarring)
        refetchOnWindowFocus: false,
        // Retry once on failure
        retry: 1,
      },
    },
  }))

  return (
    <SessionProvider session={session}>
      <QueryClientProvider client={client}>
        <NextThemesProvider
          attribute="class"
          defaultTheme="light"
          themes={['light']}
          enableSystem={false}
          forcedTheme="light"
          storageKey="prospello-theme"
          disableTransitionOnChange
        >
          <React.Suspense fallback={null}>
            <NavigationProgress />
          </React.Suspense>
          <DemoProvider>
            <ClientLayout>
              {children}
            </ClientLayout>
          </DemoProvider>
          <Toaster />
        </NextThemesProvider>
      </QueryClientProvider>
    </SessionProvider>
  )
}
