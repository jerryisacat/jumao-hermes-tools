import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import { verifyToken } from '../../lib/auth-utils.js';
import { query } from '../../db/client.js';
import type { Env } from '../../lib/types.js';

export const emailAuth: MiddlewareHandler<Env> = async (c, next) => {
  const sessionToken = getCookie(c, 'reader_session');
  let email: string | null = null;
  let accessLinkId: string | null = null;

  if (sessionToken) {
    const payload = verifyToken(sessionToken);
    if (payload && payload.email) {
      email = payload.email;
    }
  }

  if (!email) {
    const tokenParam = c.req.query('t') || c.req.header('X-Access-Token');
    if (tokenParam) {
      const res = await query<{ id: string; email: string; expires_at: string | null; max_views: number | null; view_count: number; status: string }>(
        `SELECT id, email, expires_at, max_views, view_count, status FROM access_links WHERE token = $1`,
        [tokenParam]
      );
      if (res.rows.length > 0) {
        const link = res.rows[0];
        const now = new Date();
        const valid =
          link.status === 'active' &&
          (!link.expires_at || new Date(link.expires_at) > now) &&
          (link.max_views === null || link.view_count < link.max_views);
        if (valid) {
          email = link.email;
          accessLinkId = link.id;
        }
      }
    }
  }

  if (!email) {
    return c.json({ error: { code: 'UNAUTHORIZED', message: 'Reader authentication required' } }, 401);
  }

  c.set('reader', { email, accessLinkId });
  c.set('authMethod', 'reader');
  await next();
};
