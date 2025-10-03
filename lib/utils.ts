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

/**
 * Calculate automated score for completed objectives (0.0 - 1.0 scale)
 * @param progress Final progress percentage (0-100)
 * @returns Score on 0.0-1.0 scale
 */
export function calculateObjectiveScore(progress: number): number {
  // Convert progress percentage to 0.0-1.0 score
  return Math.max(0, Math.min(1, progress / 100))
}
