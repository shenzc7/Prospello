import type { Metadata } from 'next'

import { AdminUsersClient } from '@/components/admin/admin-users-client'

export const metadata: Metadata = {
  title: 'Admin | Users',
  description: 'Review and manage user roles for your organisation.'
}

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  return <AdminUsersClient />
}
