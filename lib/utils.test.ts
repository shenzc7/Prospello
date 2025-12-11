import { calculateKRProgress } from './utils'
import { calculateTrafficLightStatus } from './utils'

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

describe('calculateTrafficLightStatus', () => {
  it('returns gray when no progress', () => {
    expect(calculateTrafficLightStatus(undefined)).toBe('gray')
    expect(calculateTrafficLightStatus(null)).toBe('gray')
    expect(calculateTrafficLightStatus(0)).toBe('gray')
  })

  it('returns red below 30', () => {
    expect(calculateTrafficLightStatus(10)).toBe('red')
    expect(calculateTrafficLightStatus(29)).toBe('red')
  })

  it('returns yellow between 30 and 69', () => {
    expect(calculateTrafficLightStatus(30)).toBe('yellow')
    expect(calculateTrafficLightStatus(55)).toBe('yellow')
    expect(calculateTrafficLightStatus(69)).toBe('yellow')
  })

  it('returns green at or above 70', () => {
    expect(calculateTrafficLightStatus(70)).toBe('green')
    expect(calculateTrafficLightStatus(100)).toBe('green')
  })
})
