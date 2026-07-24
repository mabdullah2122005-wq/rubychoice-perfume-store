// Simple in-memory fixed-window rate limiter.
//
// Good for a single Node process (local dev, single VPS/container). On
// serverless platforms (Vercel) each instance has its own memory, so this
// becomes best-effort: still useful against bursts, but for hard guarantees
// swap the store for Redis/Upstash. The call sites are the same.

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 50_000;

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) {
      if (b.resetAt < now) buckets.delete(k);
    }
  }

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}
