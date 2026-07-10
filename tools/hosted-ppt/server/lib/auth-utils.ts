import * as crypto from 'node:crypto';

export interface SessionPayload {
  userId?: string;
  email: string;
  exp: number;
}

function getKey(): string {
  return process.env.SESSION_SECRET || process.env.API_KEY_AGENTS || 'dev-insecure-key';
}

export function signToken(payload: Omit<SessionPayload, 'exp'> & { exp?: number }, secret?: string): string {
  const key = secret || getKey();
  const exp = payload.exp ?? Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7;
  const body = JSON.stringify({ ...payload, exp });
  const bodyB64 = Buffer.from(body, 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', key).update(bodyB64).digest('base64url');
  return `${bodyB64}.${sig}`;
}

export function verifyToken(token: string, secret?: string): SessionPayload | null {
  const key = secret || getKey();
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [bodyB64, sig] = parts;
  const expected = crypto.createHmac('sha256', key).update(bodyB64).digest('base64url');
  if (!secureCompare(sig, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(bodyB64, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function secureCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const maskedLocal = local && local.length > 0 ? local[0] + '***' : '***';
  return `${maskedLocal}@${domain}`;
}
