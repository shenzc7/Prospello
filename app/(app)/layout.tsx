import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { getServerSession } from 'next-auth'
import { ReactNode } from 'react'

import { authOptions } from '@/lib/auth'

type AppLayoutProps = {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const session = await getServerSession(authOptions)
  const cookieStore = cookies()
  const demoMode = cookieStore.get('demoMode')?.value === '1'

  if (!session?.user && !demoMode) {
    redirect('/login')
  }

  return children
}
