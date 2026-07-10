import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../../lib/auth-utils.js';
import type { Env } from '../../lib/types.js';

export const adminSessionAuth: MiddlewareHandler<Env> = async (c, next) => {
  const token = getCookie(c, 'admin_session');
  if (!token) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Admin session required' } }, 401);
  }
  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or expired session' } }, 401);
  }
  c.set('adminUser', { id: payload.userId, email: payload.email });
  c.set('authMethod', 'admin');
  await next();
};
