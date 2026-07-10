import type { MiddlewareHandler } from 'hono';
import { secureCompare } from '../../lib/auth-utils.js';
import type { Env } from '../../lib/types.js';

export const apiKeyAuth: MiddlewareHandler<Env> = async (c, next) => {
  const authHeader = c.req.header('Authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' } }, 401);
  }
  const presented = match[1];
  const expected = process.env.API_KEY_AGENTS;
  if (!expected) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' } }, 401);
  }
  if (!secureCompare(presented, expected)) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Invalid or missing API key' } }, 401);
  }
  c.set('agentId', 'hermes');
  c.set('authMethod', 'agent');
  await next();
};
