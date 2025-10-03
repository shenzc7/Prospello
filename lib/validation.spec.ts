import { describe, it, expect } from '@jest/globals';
import { validateKrWeights } from './validation';

describe('validateKrWeights', () => {
  it('should return true if total weight is less than 100', () => {
    const krs = [{ weight: 30 }, { weight: 40 }];
    expect(validateKrWeights(krs, 20)).toBe(true);
  });

  it('should return true if total weight is exactly 100', () => {
    const krs = [{ weight: 50 }, { weight: 50 }];
    expect(validateKrWeights(krs, 0)).toBe(true);
  });

  it('should return true when adding a KR that makes the total weight exactly 100', () => {
    const krs = [{ weight: 60 }];
    expect(validateKrWeights(krs, 40)).toBe(true);
  });

  it('should return false if total weight exceeds 100', () => {
    const krs = [{ weight: 80 }, { weight: 10 }];
    expect(validateKrWeights(krs, 11)).toBe(false);
  });

  it('should handle an empty list of existing KRs', () => {
    expect(validateKrWeights([], 50)).toBe(true);
    expect(validateKrWeights([], 101)).toBe(false);
  });
});
