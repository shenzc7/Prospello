import { notFound } from 'next/navigation'

import { ObjectiveDetailView } from '@/components/okrs/ObjectiveDetailView'

type OkrPageProps = {
  params: {
    id: string
  }
}

export default function OkrDetailPage({ params }: OkrPageProps) {
  const id = params?.id
  if (!id) {
    notFound()
  }

  return <ObjectiveDetailView objectiveId={id} />
}
