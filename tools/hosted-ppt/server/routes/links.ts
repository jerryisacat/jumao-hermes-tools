import * as crypto from 'node:crypto';
import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../db/client.js';
import { maskEmail } from '../lib/auth-utils.js';
import { logAgentAction } from '../lib/audit.js';
import { adminOrAgentAuth } from '../middleware/auth/admin-or-agent.js';
import type { Env } from '../lib/types.js';

const links = new Hono<Env>();

const createSchema = z.object({
  presentation_slug: z.string().min(1),
  email: z.string().email(),
  label: z.string().optional(),
  expires_at: z.string().datetime().optional(),
  max_views: z.number().int().min(1).optional(),
});

const updateSchema = z.object({
  expires_at: z.string().datetime().nullable().optional(),
  max_views: z.number().int().min(1).nullable().optional(),
  status: z.enum(['active', 'revoked']).optional(),
});

links.get('/validate', async (c) => {
  const token = c.req.query('t');
  if (!token) {
    return c.json({ data: { valid: false } });
  }
  const res = await query<{ email: string; expires_at: string | null; max_views: number | null; view_count: number; status: string } & { slug: string }>(
    `SELECT al.email, al.expires_at, al.max_views, al.view_count, al.status, p.slug
     FROM access_links al JOIN presentations p ON p.id = al.presentation_id
     WHERE al.token = $1`,
    [token]
  );
  if (res.rows.length === 0) {
    return c.json({ data: { valid: false } });
  }
  const link = res.rows[0];
  const now = new Date();
  const valid =
    link.status === 'active' &&
    (!link.expires_at || new Date(link.expires_at) > now) &&
    (link.max_views === null || link.view_count < link.max_views);
  if (!valid) {
    return c.json({ data: { valid: false } });
  }
  return c.json({ data: { valid: true, presentation_slug: link.slug, email: maskEmail(link.email) } });
});

links.use('*', async (c, next) => {
  if (c.req.path === '/api/links/validate') {
    return next();
  }
  return adminOrAgentAuth(c, next);
});

links.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { presentation_slug, email, label, expires_at, max_views } = parsed.data;

  const presRes = await query<{ id: string }>('SELECT id FROM presentations WHERE slug = $1', [presentation_slug]);
  if (presRes.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Presentation not found' } }, 404);
  }
  const presentationId = presRes.rows[0].id;
  const token = crypto.randomUUID();
  const createdBy = c.get('authMethod') === 'agent' ? c.get('agentId') : 'admin';

  const res = await query<{ id: string }>(
    `INSERT INTO access_links (presentation_id, email, label, token, expires_at, max_views, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
    [presentationId, email, label ?? null, token, expires_at ?? null, max_views ?? null, createdBy]
  );
  const id = res.rows[0].id;

  if (c.get('authMethod') === 'agent') {
    await logAgentAction(c.get('agentId')!, 'create_link', 'link', id, `slug=${presentation_slug}; email=${maskEmail(email)}`);
  }
  return c.json({ data: { id, token } }, 201);
});

links.get('/', async (c) => {
  const presentationSlug = c.req.query('presentation');
  if (!presentationSlug) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'presentation query param required' } }, 400);
  }
  const res = await query(
    `SELECT al.id, al.email, al.label, al.token, al.expires_at, al.max_views, al.view_count, al.status, al.created_at, al.created_by
     FROM access_links al
     JOIN presentations p ON p.id = al.presentation_id
     WHERE p.slug = $1
     ORDER BY al.created_at DESC`,
    [presentationSlug]
  );
  return c.json({ data: res.rows });
});

links.put('/:id', async (c) => {
  const id = c.req.param('id');
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { expires_at, max_views, status } = parsed.data;

  const res = await query<{ id: string }>(
    `UPDATE access_links
     SET expires_at = COALESCE($2, expires_at),
         max_views = COALESCE($3, max_views),
         status = COALESCE($4, status)
     WHERE id = $1 RETURNING id`,
    [id, expires_at ?? null, max_views ?? null, status ?? null]
  );
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Link not found' } }, 404);
  }
  if (c.get('authMethod') === 'agent') {
    await logAgentAction(c.get('agentId')!, 'update_link', 'link', id, '');
  }
  return c.json({ data: { ok: true } });
});

links.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const res = await query<{ id: string }>("UPDATE access_links SET status = 'revoked' WHERE id = $1 RETURNING id", [id]);
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Link not found' } }, 404);
  }
  if (c.get('authMethod') === 'agent') {
    await logAgentAction(c.get('agentId')!, 'revoke_link', 'link', id, '');
  }
  return c.json({ data: { ok: true } });
});

export default links;
