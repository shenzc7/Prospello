import type { Metadata } from 'next'
import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { Plus_Jakarta_Sans, Space_Grotesk } from 'next/font/google'

import { ClientLayout } from '@/components/ClientLayout'
import { Providers } from '@/components/providers'
import { strings } from '@/config/strings'
import { authOptions } from '@/lib/auth'
import { buildNavItems } from '@/lib/navigation'

import './globals.css'

const fontSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-sans',
})

const fontDisplay = Space_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})

export const metadata: Metadata = {
  title: {
    default: strings.app.name,
    template: `%s | ${strings.app.name}`,
  },
  description: 'Project management and team collaboration for software development.',
}

const envLabel = process.env.NEXT_PUBLIC_APP_ENV
  ? process.env.NEXT_PUBLIC_APP_ENV
  : process.env.NODE_ENV === 'production'
    ? undefined
    : process.env.NODE_ENV?.toUpperCase()

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)

  return (
    <html lang="en" className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body className="relative min-h-screen bg-background font-sans text-foreground antialiased">
        <Providers session={session}>
          <ClientLayout envLabel={envLabel}>
            {children}
          </ClientLayout>
        </Providers>
      </body>
    </html>
  )
}
