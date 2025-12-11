import { ObjectiveForm } from '@/components/objectives/objective-form'
import { type ObjectiveFormData } from '@/lib/schemas'

type NewObjectivePageProps = {
  searchParams?: {
    goalType?: string
    teamId?: string
    parentId?: string
    cycle?: string
  }
}

const goalTypeValues: Array<ObjectiveFormData['goalType']> = ['COMPANY', 'DEPARTMENT', 'TEAM', 'INDIVIDUAL']

function parseGoalType(value?: string) {
  const upper = value?.toUpperCase() as ObjectiveFormData['goalType'] | undefined
  return upper && goalTypeValues.includes(upper) ? upper : undefined
}

export default function NewObjectivePage({ searchParams }: NewObjectivePageProps) {
  const initialValues: Partial<ObjectiveFormData> = {
    goalType: parseGoalType(searchParams?.goalType),
    teamId: typeof searchParams?.teamId === 'string' ? searchParams.teamId : undefined,
    parentObjectiveId: typeof searchParams?.parentId === 'string' ? searchParams.parentId : undefined,
    cycle: typeof searchParams?.cycle === 'string' ? searchParams.cycle : undefined,
  }

  return <ObjectiveForm mode="create" initialValues={initialValues} />
}
