import { Hono } from 'hono';
import { setCookie, deleteCookie } from 'hono/cookie';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import * as crypto from 'node:crypto';
import { query } from '../db/client.js';
import { signToken } from '../lib/auth-utils.js';
import { errorHandler } from '../middleware/error.js';
import type { Env } from '../lib/types.js';

const requestSchema = z.object({
  email: z.string().email(),
});

const verifySchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
});

const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const auth = new Hono<Env>();

function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString();
}

const isProd = process.env.NODE_ENV === 'production';

auth.post('/email/request', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') } }, 400);
  }
  const { email } = parsed.data;

  const recent = await query<{ created_at: string }>(
    `SELECT created_at FROM email_otps WHERE email = $1 ORDER BY created_at DESC LIMIT 1`,
    [email]
  );
  if (recent.rows.length > 0) {
    const lastTs = new Date(recent.rows[0].created_at).getTime();
    if (Date.now() - lastTs < 60_000) {
      return c.json({ error: { code: 'RATE_LIMITED', message: 'Please wait 60s before requesting a new code' } }, 429);
    }
  }

  const code = generateOtp();
  await query(
    `INSERT INTO email_otps (email, code, expires_at) VALUES ($1, $2, now() + interval '10 minutes')`,
    [email, code]
  );

  if (!isProd) {
    console.log(`DEV OTP for ${email}: ${code}`);
  }

  return c.json({ data: { ok: true } });
});

auth.post('/email/verify', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = verifySchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') } }, 400);
  }
  const { email, code } = parsed.data;

  const res = await query<{ id: string }>(
    `SELECT id FROM email_otps
     WHERE email = $1 AND code = $2 AND used = false AND expires_at > now()
     ORDER BY created_at DESC LIMIT 1`,
    [email, code]
  );
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'INVALID_CODE', message: 'Invalid or expired code' } }, 400);
  }

  await query('UPDATE email_otps SET used = true WHERE id = $1', [res.rows[0].id]);

  const token = signToken({ email });
  setCookie(c, 'reader_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.json({ data: { ok: true } });
});

auth.post('/session-from-token', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const token = typeof body.token === 'string' ? body.token : '';
  if (!token) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'token required' } }, 400);
  }
  const res = await query<{ email: string; expires_at: string | null; max_views: number | null; view_count: number; status: string }>(
    'SELECT email, expires_at, max_views, view_count, status FROM access_links WHERE token = $1',
    [token]
  );
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired link' } }, 401);
  }
  const link = res.rows[0];
  const now = new Date();
  const valid =
    link.status === 'active' &&
    (!link.expires_at || new Date(link.expires_at) > now) &&
    (link.max_views === null || link.view_count < link.max_views);
  if (!valid) {
    return c.json({ error: { code: 'INVALID_TOKEN', message: 'Invalid or expired link' } }, 401);
  }
  const signed = signToken({ email: link.email });
  setCookie(c, 'reader_session', signed, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
  return c.json({ data: { ok: true } });
});

auth.post('/admin/login', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => e.message).join('; ') } }, 400);
  }
  const { email, password } = parsed.data;

  const res = await query<{ id: string; email: string; password_hash: string | null }>(
    'SELECT id, email, password_hash FROM users WHERE email = $1',
    [email]
  );
  if (res.rows.length === 0 || !res.rows[0].password_hash) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401);
  }

  const user = res.rows[0];
  const valid = await bcrypt.compare(password, user.password_hash!);

  if (!valid) {
    return c.json({ error: { code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' } }, 401);
  }

  const token = signToken({ userId: user.id, email: user.email });
  setCookie(c, 'admin_session', token, {
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });

  return c.json({ data: { user: { email: user.email } } });
});

auth.post('/admin/logout', (c) => {
  deleteCookie(c, 'admin_session', { path: '/' });
  return c.json({ data: { ok: true } });
});

auth.onError((err, c) => errorHandler(err, c));

export default auth;
