import { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { authOptions } from '@/lib/auth'

type AppLayoutProps = {
  children: ReactNode
}

export default async function AppLayout({ children }: AppLayoutProps) {
  // Temporarily bypass session check for testing my-okrs page
  // const session = await getServerSession(authOptions)
  //
  // if (!session?.user) {
  //   redirect('/login')
  // }

  return children
}
