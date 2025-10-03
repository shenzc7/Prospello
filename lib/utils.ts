export { cn } from './ui'

// OKR progress calculation utilities

/**
 * Calculate Key Result progress percentage
 * @param current Current value
 * @param target Target value
 * @returns Progress percentage clamped between 0 and 100
 */
export function calculateKRProgress(current: number, target: number): number {
  if (target === 0) return 0
  const percentage = (current / target) * 100
  return Math.max(0, Math.min(100, percentage))
}

/**
 * Calculate Objective progress based on Key Results
 * @param keyResults Array of Key Results with weight and progress
 * @returns Objective progress percentage
 */
export function calculateObjectiveProgress(keyResults: Array<{ weight: number; progress: number }>): number {
  if (keyResults.length === 0) return 0

  const totalWeightedProgress = keyResults.reduce(
    (sum, kr) => sum + (kr.progress * kr.weight) / 100,
    0
  )

  return Math.max(0, Math.min(100, totalWeightedProgress))
}
