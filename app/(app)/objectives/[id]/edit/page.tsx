import { notFound } from 'next/navigation'

import { ObjectiveEditShell } from '@/components/objectives/objective-edit-shell'

type ObjectiveEditPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function ObjectiveEditPage({ params }: ObjectiveEditPageProps) {
  const { id } = await params
  if (!id) {
    notFound()
  }

  return <ObjectiveEditShell objectiveId={id} />
}
