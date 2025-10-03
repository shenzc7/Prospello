import { notFound } from 'next/navigation'

import { ObjectiveEditShell } from '@/components/objectives/objective-edit-shell'

type ObjectiveEditPageProps = {
  params: {
    id: string
  }
}

export default function ObjectiveEditPage({ params }: ObjectiveEditPageProps) {
  const id = params.id
  if (!id) {
    notFound()
  }

  return <ObjectiveEditShell objectiveId={id} />
}
