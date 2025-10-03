import { ReactNode } from 'react'

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
