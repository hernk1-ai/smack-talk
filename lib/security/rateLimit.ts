/**
 * In-process rate limiting for API routes (best-effort on a single instance).
 * TODO(cloudflare): Move to edge rate limits for production scale:
 *   - POST /api/arena/comment
 *   - POST /api/arena/call
 *   - POST /api/arena/reaction
 *   - POST /api/guest/join
 */

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit({
  key,
  limit,
  windowMs,
}: {
  key: string;
  limit: number;
  windowMs: number;
}) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now >= existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true as const, retryAfterMs: 0 };
  }

  if (existing.count >= limit) {
    return { allowed: false as const, retryAfterMs: Math.max(existing.resetAt - now, 0) };
  }

  existing.count += 1;
  buckets.set(key, existing);

  return { allowed: true as const, retryAfterMs: 0 };
}

export function rateLimitResponse(retryAfterMs: number) {
  const retryAfterSec = Math.max(1, Math.ceil(retryAfterMs / 1000));
  return {
    error: `Too many requests. Try again in ${retryAfterSec} seconds.`,
    retryAfterSec,
  };
}
