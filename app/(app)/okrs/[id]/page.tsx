import { notFound } from 'next/navigation'

import { ObjectiveDetailView } from '@/components/okrs/ObjectiveDetailView'

type OkrPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function OkrDetailPage({ params }: OkrPageProps) {
  const { id } = await params
  if (!id) {
    notFound()
  }

  return <ObjectiveDetailView objectiveId={id} />
}
