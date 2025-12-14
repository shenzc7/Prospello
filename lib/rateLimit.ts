type RateLimitBucket = {
  count: number
  expiresAt: number
}

const buckets = new Map<string, RateLimitBucket>()

/**
 * Simple in-memory rate limiter (best-effort for serverless)
 * 
 * ⚠️ SERVERLESS LIMITATION: This in-memory rate limiter provides only
 * best-effort protection in serverless environments like Vercel. Each
 * function instance has its own memory, so limits may not be enforced
 * consistently across instances.
 * 
 * For production-grade rate limiting, consider:
 * - Vercel KV (https://vercel.com/docs/storage/vercel-kv)
 * - Upstash Redis (https://upstash.com/)
 * - @upstash/ratelimit package
 * 
 * @returns { allowed: boolean; remaining: number }
 */
export function checkRateLimit(key: string, limit = 20, windowMs = 60_000) {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || bucket.expiresAt < now) {
    buckets.set(key, { count: 1, expiresAt: now + windowMs })
    return { allowed: true, remaining: limit - 1 }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0 }
  }

  bucket.count += 1
  return { allowed: true, remaining: Math.max(0, limit - bucket.count) }
}






