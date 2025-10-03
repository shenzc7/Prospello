type KeyResultWithWeight = {
  weight: number;
};

/**
 * Validates that the sum of KR weights for an objective does not exceed 100.
 * @param existingKrs - The existing key results for the objective.
 * @param newKrWeight - The weight of the new key result being added.
 * @returns boolean - True if valid, false otherwise.
 */
export function validateKrWeights(existingKrs: KeyResultWithWeight[], newKrWeight: number): boolean {
  const totalWeight = existingKrs.reduce((sum, kr) => sum + kr.weight, 0);
  return totalWeight + newKrWeight <= 100;
}
