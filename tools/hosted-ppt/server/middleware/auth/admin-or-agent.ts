import type { MiddlewareHandler } from 'hono';
import { apiKeyAuth } from './api-key.js';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../../lib/auth-utils.js';
import type { Env } from '../../lib/types.js';

export const adminOrAgentAuth: MiddlewareHandler<Env> = async (c, next) => {
  const authHeader = c.req.header('Authorization') || '';
  if (authHeader.startsWith('Bearer ')) {
    return apiKeyAuth(c, next);
  }
  const token = getCookie(c, 'admin_session');
  if (token) {
    const payload = verifyToken(token);
    if (payload && payload.userId) {
      c.set('adminUser', { id: payload.userId, email: payload.email });
      c.set('authMethod', 'admin');
      await next();
      return;
    }
  }
  return c.json({ error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, 401);
};
