'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { ReactNode } from 'react'

type ThemeProviderProps = {
  children: ReactNode
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      themes={['light']}
      enableSystem={false}
      forcedTheme="light"
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  )
}
