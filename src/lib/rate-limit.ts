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

const IP_RE = /^\d{1,3}(\.\d{1,3}){3}$|^[0-9a-fA-F:]{2,45}$/

function isValidIp(ip: string): boolean {
  if (!IP_RE.test(ip)) return false
  if (ip.includes('.')) {
    return ip.split('.').every(part => {
      const n = Number(part)
      return !isNaN(n) && n >= 0 && n <= 255
    })
  }
  return ip.split(':').every(part => part === '' || /^[0-9a-fA-F]{1,4}$/.test(part))
}

/**
 * Extract a caller IP defensively. Proxy headers are fully attacker-controlled
 * when the client connects directly (e.g. the local standalone server), so we:
 *  1. take the LAST entry of x-forwarded-for (the hop appended by the nearest
 *     trusted proxy, per RFC 7239 convention),
 *  2. drop entries that are not syntactically valid IPs,
 *  3. collapse everything else into a single shared bucket so spoofing can
 *     never escape the limit — it only makes attackers share it.
 */
export function rateLimitByIp(request: Request, limit: number, windowMs?: number): { ok: boolean; remaining: number } {
  const forwarded = request.headers.get('x-forwarded-for') || ''
  const candidates = forwarded.split(',').map(s => s.trim())
  let ip = ''
  for (let i = candidates.length - 1; i >= 0; i--) {
    const candidate = candidates[i]
    if (candidate && isValidIp(candidate)) {
      ip = candidate
      break
    }
  }
  if (!ip) {
    const real = request.headers.get('x-real-ip')
    if (real && isValidIp(real)) ip = real
  }
  return rateLimit(`ip:${ip || 'unknown'}`, limit, windowMs)
}