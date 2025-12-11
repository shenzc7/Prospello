import './globals.css'
import type { Metadata } from 'next'
import { Space_Grotesk } from 'next/font/google'

import { Providers } from "@/components/providers"

const spaceGrotesk = Space_Grotesk({
    subsets: ['latin'],
    variable: '--font-display',
})

export const metadata: Metadata = {
    title: 'OKRFlow',
    description: 'Enterprise Goal Management',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${spaceGrotesk.className} antialiased`}>
                <Providers>
                    {children}
                </Providers>
            </body>
        </html>
    )
}
