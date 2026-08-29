type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();

export type RateLimitResult = { allowed: boolean; limit: number; remaining: number; resetAt: number };

export function consumeLocalRateLimit(key: string, limit: number, windowMs: number, now = Date.now()): RateLimitResult {
  const current = buckets.get(key);
  const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + windowMs } : current;
  bucket.count += 1;
  buckets.set(key, bucket);
  return { allowed: bucket.count <= limit, limit, remaining: Math.max(0, limit - bucket.count), resetAt: bucket.resetAt };
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<RateLimitResult> {
  const endpoint = process.env.RATE_LIMIT_REST_URL;
  const token = process.env.RATE_LIMIT_REST_TOKEN;
  if (!endpoint || !token) {
    if (process.env.APP_ENV === "production") return { allowed: false, limit, remaining: 0, resetAt: Date.now() + 30_000 };
    return consumeLocalRateLimit(key, limit, windowMs);
  }
  const response = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }, body: JSON.stringify({ key, limit, windowMs }), cache: "no-store", signal: AbortSignal.timeout(2_000) });
  if (!response.ok) return { allowed: false, limit, remaining: 0, resetAt: Date.now() + 30_000 };
  const result = await response.json() as Partial<RateLimitResult>;
  if (typeof result.allowed !== "boolean" || typeof result.remaining !== "number" || typeof result.resetAt !== "number") return { allowed: false, limit, remaining: 0, resetAt: Date.now() + 30_000 };
  return { allowed: result.allowed, limit, remaining: result.remaining, resetAt: result.resetAt };
}

export function rateLimitHeaders(result: RateLimitResult) {
  return {
    "RateLimit-Limit": String(result.limit),
    "RateLimit-Remaining": String(result.remaining),
    "RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
  };
}

export function clientAddress(headers: Headers) {
  return headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip") || "unknown";
}
