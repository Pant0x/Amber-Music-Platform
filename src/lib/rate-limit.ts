/**
 * Minimal in-memory sliding-window rate limiter for public API routes.
 * Works per-process: effective on the desktop standalone server (single
 * process) and best-effort per instance on serverless platforms.
 */

interface Bucket {
  timestamps: number[]
}

const buckets = new Map<string, Bucket>()

const MAX_BUCKETS = 10_000
const WINDOW_MS = 60_000

export function rateLimit(key: string, limit: number, windowMs: number = WINDOW_MS): { ok: boolean; remaining: number } {
  const now = Date.now()

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      const recent = b.timestamps.filter(t => now - t < WINDOW_MS)
      if (recent.length === 0) buckets.delete(k)
      else b.timestamps = recent
    }
  }

  let bucket = buckets.get(key)
  if (!bucket) {
    bucket = { timestamps: [] }
    buckets.set(key, bucket)
  }

  bucket.timestamps = bucket.timestamps.filter(t => now - t < windowMs)

  if (bucket.timestamps.length >= limit) {
    return { ok: false, remaining: 0 }
  }

  bucket.timestamps.push(now)
  return { ok: true, remaining: limit - bucket.timestamps.length }
}

export function rateLimitByIp(request: Request, limit: number, windowMs?: number): { ok: boolean; remaining: number } {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const ip = forwarded.split(',')[0]?.trim() || request.headers.get('x-real-ip') || 'unknown'
  return rateLimit(`ip:${ip}`, limit, windowMs)
}