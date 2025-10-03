import { calculateKRProgress } from './utils'

describe('calculateKRProgress', () => {
  it('should calculate progress correctly for numeric values', () => {
    expect(calculateKRProgress(50, 100)).toBe(50)
    expect(calculateKRProgress(25, 50)).toBe(50)
    expect(calculateKRProgress(0, 100)).toBe(0)
    expect(calculateKRProgress(100, 100)).toBe(100)
  })

  it('should handle zero target gracefully', () => {
    expect(calculateKRProgress(50, 0)).toBe(0)
  })

  it('should handle negative current values', () => {
    expect(calculateKRProgress(-10, 100)).toBe(0)
  })

  it('should handle current values greater than target', () => {
    expect(calculateKRProgress(150, 100)).toBe(100)
  })
})
