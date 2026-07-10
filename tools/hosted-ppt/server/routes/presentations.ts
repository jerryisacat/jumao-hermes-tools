import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../db/client.js';
import { logAgentAction } from '../lib/audit.js';
import { adminOrAgentAuth } from '../middleware/auth/admin-or-agent.js';
import type { Env } from '../lib/types.js';

const presentations = new Hono<Env>();

presentations.use('*', adminOrAgentAuth);

const createSchema = z.object({
  slug: z.string().min(1).max(200),
  title: z.string().min(1).max(500),
  description: z.string().optional(),
  slide_count: z.number().int().min(0).optional(),
  created_by: z.string().optional(),
});

const updateSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().optional(),
  status: z.enum(['active', 'archived']).optional(),
  slide_count: z.number().int().min(0).optional(),
});

presentations.get('/', async (c) => {
  const status = c.req.query('status');
  let sql = 'SELECT id, slug, title, description, slide_count, status, created_at, updated_at, created_by FROM presentations';
  const params: unknown[] = [];
  if (status) {
    sql += ' WHERE status = $1';
    params.push(status);
  }
  sql += ' ORDER BY created_at DESC';
  const res = await query(sql, params);
  return c.json({ data: res.rows });
});

presentations.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { slug, title, description, slide_count, created_by } = parsed.data;

  try {
    const res = await query<{ id: string }>(
      `INSERT INTO presentations (slug, title, description, slide_count, created_by)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [slug, title, description ?? null, slide_count ?? 0, created_by ?? null]
    );
    const id = res.rows[0].id;

    if (c.get('authMethod') === 'agent') {
      await logAgentAction(c.get('agentId')!, 'create_presentation', 'presentation', id, `slug=${slug}; title=${title}`);
    }
    return c.json({ data: { id, slug, title } }, 201);
  } catch (err) {
    if (err instanceof Error && err.message.includes('duplicate')) {
      return c.json({ error: { code: 'DUPLICATE_SLUG', message: 'A presentation with this slug already exists' } }, 409);
    }
    throw err;
  }
});

presentations.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const res = await query(
    'SELECT id, slug, title, description, slide_count, status, created_at, updated_at, created_by FROM presentations WHERE slug = $1',
    [slug]
  );
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Presentation not found' } }, 404);
  }
  return c.json({ data: res.rows[0] });
});

presentations.put('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const body = await c.req.json().catch(() => ({}));
  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { title, description, status, slide_count } = parsed.data;

  const res = await query<{ id: string }>(
    `UPDATE presentations
     SET title = COALESCE($2, title),
         description = COALESCE($3, description),
         status = COALESCE($4, status),
         slide_count = COALESCE($5, slide_count)
     WHERE slug = $1 RETURNING id`,
    [slug, title ?? null, description ?? null, status ?? null, slide_count ?? null]
  );
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Presentation not found' } }, 404);
  }

  if (c.get('authMethod') === 'agent') {
    await logAgentAction(c.get('agentId')!, 'update_presentation', 'presentation', res.rows[0].id, `slug=${slug}`);
  }
  return c.json({ data: { ok: true } });
});

presentations.delete('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const res = await query<{ id: string }>('SELECT id FROM presentations WHERE slug = $1', [slug]);
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Presentation not found' } }, 404);
  }
  const id = res.rows[0].id;
  const authMethod = c.get('authMethod');

  if (authMethod === 'admin') {
    await query('DELETE FROM presentations WHERE id = $1', [id]);
  } else {
    await query("UPDATE presentations SET status = 'archived' WHERE id = $1", [id]);
    await logAgentAction(c.get('agentId')!, 'archive_presentation', 'presentation', id, `slug=${slug} soft delete`);
  }
  return c.json({ data: { ok: true } });
});

export default presentations;
