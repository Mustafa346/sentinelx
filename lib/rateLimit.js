// Lightweight in-memory sliding-window rate limiter. Good enough for a
// local demo / single-instance deployment. For real production use behind
// multiple instances, back this with Redis instead.

const buckets = global._sentinelxRateLimitBuckets || new Map();
global._sentinelxRateLimitBuckets = buckets;

/**
 * @param {string} key - unique key, e.g. `login:${ip}`
 * @param {number} limit - max attempts allowed in the window
 * @param {number} windowMs - window size in milliseconds
 */
export function rateLimit(key, limit = 10, windowMs = 60_000) {
  const now = Date.now();
  const entry = buckets.get(key) || { count: 0, resetAt: now + windowMs };

  if (now > entry.resetAt) {
    entry.count = 0;
    entry.resetAt = now + windowMs;
  }

  entry.count += 1;
  buckets.set(key, entry);

  return {
    allowed: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

export function getClientIP(request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "127.0.0.1";
}
