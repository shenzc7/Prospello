import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

import { isFeatureEnabled } from '@/config/features'
import { AdminUsersClient } from '@/components/admin/admin-users-client'

export const metadata: Metadata = {
  title: 'Admin | Users',
  description: 'Review and manage user roles for your organisation.'
}

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  if (!isFeatureEnabled('adminExtras')) {
    notFound()
  }

  return <AdminUsersClient />
}
