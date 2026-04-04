const buckets = new Map<string, { count: number; resetAt: number }>();

/**
 * Simple in-memory rate limiter. Resets per worker instance restart,
 * which is fine for Cloudflare Workers (short-lived isolates).
 */
export function rateLimit(
  key: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (bucket.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  bucket.count++;
  return { allowed: true, remaining: maxRequests - bucket.count };
}

export function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}
