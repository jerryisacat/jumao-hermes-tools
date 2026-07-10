import { Hono } from 'hono';
import { z } from 'zod';
import { query } from '../db/client.js';
import { adminSessionAuth } from '../middleware/auth/session.js';
import type { Env } from '../lib/types.js';

const notifications = new Hono<Env>();

notifications.use('*', adminSessionAuth);

const createSchema = z.object({
  presentation_id: z.string().optional(),
  type: z.enum(['view', 'session_end', 'lead_created']).default('view'),
  channel: z.enum(['email', 'webhook']),
  target: z.string().min(1),
});

notifications.get('/', async (c) => {
  const res = await query(
    'SELECT id, presentation_id, type, channel, target, enabled, created_at FROM notifications ORDER BY created_at DESC'
  );
  return c.json({ data: res.rows });
});

notifications.post('/', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { presentation_id, type, channel, target } = parsed.data;

  const res = await query<{ id: string }>(
    'INSERT INTO notifications (presentation_id, type, channel, target) VALUES ($1, $2, $3, $4) RETURNING id',
    [presentation_id ?? null, type, channel, target]
  );
  return c.json({ data: { id: res.rows[0].id } }, 201);
});

notifications.delete('/:id', async (c) => {
  const id = c.req.param('id');
  const res = await query<{ id: string }>('DELETE FROM notifications WHERE id = $1 RETURNING id', [id]);
  if (res.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Notification not found' } }, 404);
  }
  return c.json({ data: { ok: true } });
});

export default notifications;
