import { describe, it, expect, beforeAll } from 'vitest';
import { encryptToken, decryptToken } from './crypto';

describe('crypto', () => {
  beforeAll(() => {
    process.env.BRIDGE_TOKEN_KEY = 'test-key-must-be-32-bytes-long-ok!!';
  });

  it('round-trips a token', () => {
    const token = 'hf_abc123XYZ';
    const enc = encryptToken(token);
    expect(enc).not.toContain(token);
    expect(enc.length).toBeGreaterThan(32);
    const dec = decryptToken(enc);
    expect(dec).toBe(token);
  });

  it('produces different ciphertext each time (random IV)', () => {
    const token = 'same-token';
    const a = encryptToken(token);
    const b = encryptToken(token);
    expect(a).not.toBe(b);
  });

  it('returns empty string for empty input', () => {
    expect(decryptToken('')).toBe('');
  });

  it('throws on tampered ciphertext', () => {
    const enc = encryptToken('secret');
    const tampered = enc.slice(0, -4) + 'AAAA';
    expect(() => decryptToken(tampered)).toThrow();
  });
});
