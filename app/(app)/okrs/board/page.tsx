import { redirect } from 'next/navigation'

import { OkrBoard } from '@/components/okrs/OkrBoard'
import { isFeatureEnabled } from '@/config/features'

export const dynamic = 'force-dynamic'

export default function OkrsBoardPage() {
  if (!isFeatureEnabled('boardView')) {
    redirect('/okrs')
  }

  return <OkrBoard />
}

