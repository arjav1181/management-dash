import { describe, it, expect } from 'vitest';
import { generateWssToken, verifyWssToken, generateWssSecret } from './jwt';

describe('wss jwt', () => {
  it('round-trips a space token', () => {
    const secret = generateWssSecret();
    const spaceId = 'user/space-1';
    const token = generateWssToken(spaceId, secret);
    const decoded = verifyWssToken(token, secret);
    expect(decoded).not.toBeNull();
    expect(decoded?.spaceId).toBe(spaceId);
  });

  it('rejects token signed with a different secret', () => {
    const secretA = generateWssSecret();
    const secretB = generateWssSecret();
    const token = generateWssToken('user/space-1', secretA);
    expect(verifyWssToken(token, secretB)).toBeNull();
  });

  it('rejects garbage', () => {
    expect(verifyWssToken('not-a-jwt', 'whatever')).toBeNull();
    expect(verifyWssToken('', 'whatever')).toBeNull();
  });

  it('generates unique secrets', () => {
    const a = generateWssSecret();
    const b = generateWssSecret();
    expect(a).not.toBe(b);
  });
});
