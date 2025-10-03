import { KeyResult } from '@prisma/client';

type KeyResultWithProgress = Pick<KeyResult, 'current' | 'target' | 'weight'>;

// Objective progress calculation with weighted key result contributions.

/**
 * Calculates the progress of an objective based on its key results.
 * Progress = Σ((KR.current / KR.target * 100) * (KR.weight / 100))
 * @param keyResults - An array of key results, each with current, target and weight.
 */
export function calcProgress(keyResults: KeyResultWithProgress[]): number {
  if (!keyResults || keyResults.length === 0) {
    return 0;
  }

  const totalProgress = keyResults.reduce((sum, kr) => {
    // Calculate progress percentage for this KR: (current/target) * 100, clamped to 0-100
    const progressPercent = Math.min(Math.max((kr.current / kr.target) * 100, 0), 100);
    return sum + (progressPercent * (kr.weight / 100));
  }, 0);

  return Math.round(totalProgress);
}

type KeyResultWithProgress2 = {
  progress: number;
  weight: number;
};

/**
 * Calculates the progress of an objective based on its key results.
 * Progress = Σ(KR.progress * (KR.weight / 100))
 * @param keyResults - An array of key results, each with a progress (0-100) and weight (0-100).
 */
export function calcProgressFromProgress(keyResults: KeyResultWithProgress2[]): number {
  if (!keyResults || keyResults.length === 0) {
    return 0;
  }

  const totalWeight = keyResults.reduce((sum, kr) => sum + kr.weight, 0);
  if (totalWeight === 0) {
    return 0;
  }

  const weightedProgress = keyResults.reduce((sum, kr) => {
    // Normalize weight against the total weight, in case it's not 100
    const normalizedWeight = kr.weight / totalWeight;
    return sum + (kr.progress * normalizedWeight);
  }, 0);

  return Math.round(weightedProgress);
}

export type TrafficLightStatus = 'green' | 'yellow' | 'red' | 'gray';

/**
 * Determines the traffic light status based on progress.
 * > 70% = green
 * 30-70% = yellow
 * < 30% = red
 * no progress = gray
 * @param progress - The progress percentage (0-100).
 */
export function getTrafficLightStatus(progress: number | null | undefined): TrafficLightStatus {
  if (progress === null || progress === undefined || progress === 0) {
    return 'gray';
  }
  if (progress > 70) {
    return 'green';
  }
  if (progress >= 30) {
    return 'yellow';
  }
  return 'red';
}
