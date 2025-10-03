import { describe, it, expect } from '@jest/globals';
import { calcProgress, calcProgressFromProgress, getTrafficLightStatus } from './okr';

describe('calcProgress', () => {
  it('should return 0 for no key results', () => {
    expect(calcProgress([])).toBe(0);
  });

  it('should calculate progress correctly from current/target values', () => {
    const krs = [
      { current: 50, target: 100, weight: 60 }, // 50% * 0.6 = 30
      { current: 100, target: 100, weight: 40 }, // 100% * 0.4 = 40
    ];
    expect(calcProgress(krs)).toBe(70);
  });
});

describe('calcProgressFromProgress', () => {
  it('should calculate weighted progress correctly when weights sum to 100', () => {
    const krs = [
      { progress: 50, weight: 60 }, // 50 * 0.6 = 30
      { progress: 100, weight: 40 }, // 100 * 0.4 = 40
    ];
    expect(calcProgressFromProgress(krs)).toBe(70);
  });

  it('should handle weights that do not sum to 100 by normalizing them', () => {
    const krs = [
      { progress: 50, weight: 30 }, // 30/50 = 0.6 norm weight -> 50 * 0.6 = 30
      { progress: 100, weight: 20 },// 20/50 = 0.4 norm weight -> 100 * 0.4 = 40
    ]; // Total weight is 50
    expect(calcProgressFromProgress(krs)).toBe(70);
  });

  it('should handle a single key result', () => {
    const krs = [{ progress: 80, weight: 100 }];
    expect(calcProgressFromProgress(krs)).toBe(80);
  });

  it('should return 0 if total weight is 0', () => {
    const krs = [
        { progress: 100, weight: 0 },
        { progress: 50, weight: 0 }
    ];
    expect(calcProgressFromProgress(krs)).toBe(0);
  });

  it('should round progress to the nearest integer', () => {
    const krs = [
      { progress: 33, weight: 1 }, // 33 * (1/3) = 11
      { progress: 45, weight: 2 }, // 45 * (2/3) = 30
    ]; // Total weight 3
    expect(calcProgressFromProgress(krs)).toBe(41); // 11 + 30 = 41
  });

  it('should handle 0% progress correctly', () => {
    const krs = [
      { progress: 0, weight: 60 },
      { progress: 100, weight: 40 },
    ];
    expect(calcProgressFromProgress(krs)).toBe(40);
  });

  it('should handle 100% progress correctly', () => {
    const krs = [
      { progress: 100, weight: 60 },
      { progress: 100, weight: 40 },
    ];
    expect(calcProgressFromProgress(krs)).toBe(100);
  });

  it('should handle uneven weights correctly', () => {
    const krs = [
      { progress: 50, weight: 33 },
      { progress: 80, weight: 67 },
    ];
    // (50 * 0.33) + (80 * 0.67) = 16.5 + 53.6 = 70.1 -> rounded to 70
    expect(calcProgressFromProgress(krs)).toBe(70);
  });
});

describe('getTrafficLightStatus', () => {
  it('should return "gray" for null, undefined, or 0 progress', () => {
    expect(getTrafficLightStatus(null)).toBe('gray');
    expect(getTrafficLightStatus(undefined)).toBe('gray');
    expect(getTrafficLightStatus(0)).toBe('gray');
  });

  it('should return "red" for progress less than 30', () => {
    expect(getTrafficLightStatus(10)).toBe('red');
    expect(getTrafficLightStatus(29)).toBe('red');
  });

  it('should return "yellow" for progress between 30 and 70', () => {
    expect(getTrafficLightStatus(30)).toBe('yellow');
    expect(getTrafficLightStatus(50)).toBe('yellow');
    expect(getTrafficLightStatus(70)).toBe('yellow');
  });

  it('should return "green" for progress greater than 70', () => {
    expect(getTrafficLightStatus(71)).toBe('green');
    expect(getTrafficLightStatus(100)).toBe('green');
  });
});
