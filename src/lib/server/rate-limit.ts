interface Bucket {
  tokens: number;
  updatedAt: number;
}

const buckets = new Map<string, Bucket>();

export interface RateLimitOptions {
  capacity: number;
  refillPerSec: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const existing = buckets.get(key);
  const refill = ((now - (existing?.updatedAt ?? now)) / 1000) * opts.refillPerSec;
  const tokens = Math.min(opts.capacity, (existing?.tokens ?? opts.capacity) + refill);

  if (tokens < 1) {
    buckets.set(key, { tokens, updatedAt: now });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec: Math.ceil((1 - tokens) / opts.refillPerSec),
    };
  }

  buckets.set(key, { tokens: tokens - 1, updatedAt: now });
  return { allowed: true, remaining: Math.floor(tokens - 1), retryAfterSec: 0 };
}

const DEFAULTS: RateLimitOptions = { capacity: 60, refillPerSec: 1 };

const DESTRUCTIVE: RateLimitOptions = { capacity: 10, refillPerSec: 0.2 };

const DESTRUCTIVE_PATHS = new Set([
  '/api/hf/spaces/',
  '/api/vercel/projects/',
  '/api/agent/chat',
]);

export function rateLimitForRoute(userId: string, route: string): RateLimitResult {
  const isDestructive = Array.from(DESTRUCTIVE_PATHS).some((p) => route.includes(p));
  return rateLimit(`${userId}:${route}`, isDestructive ? DESTRUCTIVE : DEFAULTS);
}
