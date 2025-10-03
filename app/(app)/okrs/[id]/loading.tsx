import { SkeletonRow } from '@/components/ui/SkeletonRow'

export default function ObjectiveLoading() {
  return (
    <div className="space-y-6">
      <SkeletonRow lines={2} />
      <SkeletonRow lines={3} />
      <SkeletonRow lines={4} />
    </div>
  )
}
