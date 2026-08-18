import dns from 'node:dns/promises'

const MAX_REDIRECTS = 5

function ipv4ToInt(ip: string): number | null {
  const parts = ip.split('.').map(Number)
  if (parts.length !== 4 || parts.some(p => isNaN(p) || p < 0 || p > 255)) return null
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0
}

function isPrivateIpv4(ip: string): boolean {
  const n = ipv4ToInt(ip)
  if (n === null) return false
  return (
    (n >>> 24) === 0 ||            // 0.0.0.0/8
    (n >>> 24) === 10 ||           // 10.0.0.0/8
    (n >>> 24) === 127 ||          // 127.0.0.0/8 loopback
    (n >>> 16) === 0xa9fe ||       // 169.254.0.0/16 link-local (cloud metadata)
    (n >>> 20) === 0xac1 ||        // 172.16.0.0/12
    (n >>> 16) === 0xc0a8 ||       // 192.168.0.0/16
    (n >>> 22) === 0x644 ||        // 100.64.0.0/10 CGNAT
    (n >>> 24) >= 224              // multicast + reserved
  )
}

function isPrivateIpv6(ip: string): boolean {
  const lower = ip.toLowerCase()
  if (lower === '::1' || lower === '::') return true
  // IPv4-mapped: ::ffff:x.x.x.x
  const mapped = lower.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  if (mapped) return isPrivateIpv4(mapped[1])
  if (!lower.includes(':')) return false
  const first = lower.split(':')[0]
  const firstInt = parseInt(first, 16)
  if (isNaN(firstInt)) return false
  return (
    firstInt >= 0xfc00 && firstInt <= 0xfdff || // fc00::/7 unique local
    firstInt >= 0xfe80 && firstInt <= 0xfebf || // fe80::/10 link-local
    firstInt === 0x2001 && lower.startsWith('2001:db8:') // documentation range
  )
}

export function isPrivateIp(ip: string): boolean {
  if (ip.includes(':')) return isPrivateIpv6(ip)
  return isPrivateIpv4(ip)
}

async function hostIsPublic(hostname: string): Promise<boolean> {
  try {
    const addresses = await dns.lookup(hostname, { all: true })
    return addresses.length > 0 && addresses.every(a => !isPrivateIp(a.address))
  } catch {
    return false
  }
}

/**
 * SSRF-safe image fetch: https-only, DNS-validated public IPs only,
 * bounded redirects (each hop re-validated), content-type checked,
 * and a hard byte cap enforced while streaming.
 */
export async function fetchImageSafely(
  url: string,
  opts: { maxBytes: number } = { maxBytes: 10 * 1024 * 1024 }
): Promise<{ ok: true; blob: Blob; contentType: string } | { ok: false; error: string }> {
  let current: string | null = url
  let redirects = 0

  while (current) {
    let parsed: URL
    try {
      parsed = new URL(current)
    } catch {
      return { ok: false, error: 'Invalid URL' }
    }

    if (parsed.protocol !== 'https:') {
      return { ok: false, error: 'Only https URLs are allowed' }
    }

    if (!(await hostIsPublic(parsed.hostname))) {
      return { ok: false, error: 'URL resolves to a private or reserved address' }
    }

    const res = await fetch(parsed, { redirect: 'manual', signal: AbortSignal.timeout(15_000) })

    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location')
      if (!location || redirects >= MAX_REDIRECTS) {
        return { ok: false, error: 'Too many redirects' }
      }
      redirects++
      current = new URL(location, parsed).toString()
      continue
    }

    if (!res.ok) {
      return { ok: false, error: `Upstream responded ${res.status}` }
    }

    const contentType = res.headers.get('content-type') || ''
    if (!contentType.toLowerCase().startsWith('image/')) {
      return { ok: false, error: 'URL does not return an image' }
    }

    if (!res.body) {
      return { ok: false, error: 'Empty response body' }
    }

    const chunks: Uint8Array[] = []
    let total = 0
    const reader = res.body.getReader()
    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        total += value.byteLength
        if (total > opts.maxBytes) {
          return { ok: false, error: `Image exceeds ${opts.maxBytes} bytes` }
        }
        chunks.push(value)
      }
    } finally {
      reader.releaseLock()
    }

    const buffer = new Uint8Array(total)
    let offset = 0
    for (const chunk of chunks) {
      buffer.set(chunk, offset)
      offset += chunk.byteLength
    }

    return { ok: true, blob: new Blob([buffer], { type: contentType }), contentType }
  }

  return { ok: false, error: 'Unreachable' }
}