import { Dashboard } from '@/components/dashboard/Dashboard'

export default function HomePage() {
  // Auth is handled by middleware and layout
  // Only authenticated users reach this page
  return <Dashboard />
}
