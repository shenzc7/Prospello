import { notFound } from 'next/navigation'

import { ObjectiveDetail } from '@/components/objectives/objective-detail'

type ObjectivePageProps = {
  params: {
    id: string
  }
}

export default function ObjectivePage({ params }: ObjectivePageProps) {
  const id = params.id
  if (!id) {
    notFound()
  }

  return <ObjectiveDetail objectiveId={id} />
}
