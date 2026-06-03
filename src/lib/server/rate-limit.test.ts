import { describe, it, expect } from 'vitest';
import { rateLimit, rateLimitForRoute } from './rate-limit';

describe('rate-limit', () => {
  it('allows up to capacity then denies', () => {
    const key = `test-${Math.random()}`;
    const opts = { capacity: 3, refillPerSec: 0 };
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(false);
  });

  it('refills over time', async () => {
    const key = `test-${Math.random()}`;
    const opts = { capacity: 1, refillPerSec: 100 };
    expect(rateLimit(key, opts).allowed).toBe(true);
    expect(rateLimit(key, opts).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 50));
    expect(rateLimit(key, opts).allowed).toBe(true);
  });

  it('uses destructive limit for sensitive paths', () => {
    const a = rateLimitForRoute('u1', '/api/hf/spaces/abc/restart');
    expect(a.allowed).toBe(true);
  });
});
