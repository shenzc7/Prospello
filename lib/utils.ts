import { localeConfig } from '@/config/locale'
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

// PRD-compliant traffic light status calculation
export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'gray'

export function calculateTrafficLightStatus(progress: number | null | undefined): TrafficLightStatus {
  if (progress === null || progress === undefined || progress === 0) {
    return 'gray'
  }
  if (progress >= 70) {
    return 'green'
  }
  if (progress >= 30) {
    return 'yellow'
  }
  return 'red'
}

// Get CSS classes for traffic light status
export function getTrafficLightClasses(status: TrafficLightStatus) {
  const highContrast = localeConfig.highContrastStatus
  switch (status) {
    case 'green':
      return {
        bg: highContrast ? 'bg-green-100 ring-2 ring-green-500/50' : 'bg-green-100',
        border: 'border-green-200',
        text: 'text-green-700',
        hover: 'hover:bg-green-200'
      }
    case 'yellow':
      return {
        bg: highContrast ? 'bg-yellow-100 ring-2 ring-yellow-500/50' : 'bg-yellow-100',
        border: 'border-yellow-200',
        text: 'text-yellow-700',
        hover: 'hover:bg-yellow-200'
      }
    case 'red':
      return {
        bg: highContrast ? 'bg-red-100 ring-2 ring-red-500/50' : 'bg-red-100',
        border: 'border-red-200',
        text: 'text-red-700',
        hover: 'hover:bg-red-200'
      }
    default:
      return {
        bg: highContrast ? 'bg-gray-100 ring-2 ring-gray-400/50' : 'bg-gray-100',
        border: 'border-gray-200',
        text: 'text-gray-700',
        hover: 'hover:bg-gray-200'
      }
  }
}

export function getTrafficLightLabel(status: TrafficLightStatus): string {
  switch (status) {
    case 'green':
      return 'On track'
    case 'yellow':
      return 'At risk'
    case 'red':
      return 'Off track'
    default:
      return 'No data'
  }
}
