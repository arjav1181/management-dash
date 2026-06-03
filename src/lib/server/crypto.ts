import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto';

const ALGO = 'aes-256-gcm';
const IV_LEN = 12;
const SALT = 'bridge-token-encryption-v1';

function getKey(): Buffer {
  const raw = process.env.BRIDGE_TOKEN_KEY;
  if (!raw) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('BRIDGE_TOKEN_KEY env var is required in production');
    }
    const devKey = scryptSync('dev-only-not-secure', SALT, 32);
    return devKey;
  }
  if (raw.length === 64 && /^[0-9a-fA-F]+$/.test(raw)) {
    return Buffer.from(raw, 'hex');
  }
  try {
    const b = Buffer.from(raw, 'base64');
    if (b.length === 32) return b;
  } catch {}
  return scryptSync(raw, SALT, 32);
}

export function encryptToken(plain: string): string {
  if (!plain) return '';
  const key = getKey();
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptToken(payload: string): string {
  if (!payload) return '';
  const key = getKey();
  const buf = Buffer.from(payload, 'base64');
  if (buf.length < IV_LEN + 16) throw new Error('Invalid ciphertext');
  const iv = buf.subarray(0, IV_LEN);
  const tag = buf.subarray(IV_LEN, IV_LEN + 16);
  const data = buf.subarray(IV_LEN + 16);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
}

export function generateTokenKey(): string {
  return randomBytes(32).toString('base64');
}
