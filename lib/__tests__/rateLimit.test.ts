import { checkRateLimit } from '../rateLimit'

describe('checkRateLimit', () => {
  it('allows initial requests within window', () => {
    const result = checkRateLimit('test-key', 2, 1000)
    expect(result.allowed).toBe(true)
    const second = checkRateLimit('test-key', 2, 1000)
    expect(second.allowed).toBe(true)
  })

  it('blocks when limit exceeded', () => {
    const key = 'limit-key'
    checkRateLimit(key, 1, 1000)
    const result = checkRateLimit(key, 1, 1000)
    expect(result.allowed).toBe(false)
  })
})














