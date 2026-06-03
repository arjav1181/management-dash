import jwt from 'jsonwebtoken';

const WSS_SECRET_PREFIX = 'mgmt-dash-wss-';

export function generateWssToken(spaceId: string, secret: string): string {
  return jwt.sign({ spaceId, iat: Date.now() }, secret, { expiresIn: '24h' });
}

export function verifyWssToken(token: string, secret: string): { spaceId: string } | null {
  try {
    const decoded = jwt.verify(token, secret) as { spaceId: string };
    return { spaceId: decoded.spaceId };
  } catch {
    return null;
  }
}

export function generateWssSecret(): string {
  return WSS_SECRET_PREFIX + Math.random().toString(36).slice(2, 18) + Date.now().toString(36);
}
