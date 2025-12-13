import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isFeatureEnabled } from '@/config/features'
import { AdminInvitationsClient } from '@/components/admin/admin-invitations-client'

export const metadata: Metadata = {
  title: 'Admin | Invitations',
  description: 'Create and manage invitation links for your workspace.',
}

export const dynamic = 'force-dynamic'

export default function AdminInvitationsPage() {
  if (!isFeatureEnabled('adminExtras')) {
    notFound()
  }

  return <AdminInvitationsClient />
}
