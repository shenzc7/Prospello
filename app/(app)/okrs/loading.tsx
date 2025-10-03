import { SkeletonRow } from '@/components/ui/SkeletonRow'

export default function OkrsLoading() {
  return (
    <div className="space-y-4">
      <div className="h-10 w-44 rounded-full bg-muted/50" />
      <SkeletonRow lines={3} />
      <SkeletonRow lines={4} />
      <SkeletonRow lines={4} />
    </div>
  )
}
