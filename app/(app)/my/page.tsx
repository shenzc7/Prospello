import { Suspense } from 'react'
import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'

import { MyOkrsView } from '@/components/okrs/MyOkrsView'
import { authOptions } from '@/lib/auth'

export const metadata = {
  title: 'My OKRs',
  description: 'Quickly update your weekly key result progress.',
}

export default async function MyOkrsPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    redirect('/login')
  }

  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading your OKRs…</div>}>
      <MyOkrsView ownerId={session.user.id} />
    </Suspense>
  )
}
