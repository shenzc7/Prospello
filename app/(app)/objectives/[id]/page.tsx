import { notFound } from 'next/navigation'

import { ObjectiveDetail } from '@/components/objectives/objective-detail'

type ObjectivePageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ObjectivePage({ params }: ObjectivePageProps) {
  const { id } = await params
  if (!id) {
    notFound()
  }

  return <ObjectiveDetail objectiveId={id} />
}
