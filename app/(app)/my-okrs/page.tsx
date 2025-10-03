import type { Metadata } from 'next'

import { MyOkrsClient } from './client'

export const metadata: Metadata = {
  title: 'My OKRs',
  description: 'Quickly update your weekly KR check-ins.'
}

export default function MyOkrsPage() {
  return <MyOkrsClient />
}
