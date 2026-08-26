// Rate Limiting
const ipRequests = new Map<string, { count: number; resetAt: number }>();

export function rateLimitByIp(request: Request, limit: number): { ok: boolean; remaining: number } {
  const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute

  const record = ipRequests.get(ip);
  if (!record || now > record.resetAt) {
    ipRequests.set(ip, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { ok: false, remaining: 0 };
  }

  record.count++;
  return { ok: true, remaining: limit - record.count };
}

// Cleanup old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of ipRequests.entries()) {
    if (now > record.resetAt) {
      ipRequests.delete(ip);
    }
  }
}, 5 * 60 * 1000);