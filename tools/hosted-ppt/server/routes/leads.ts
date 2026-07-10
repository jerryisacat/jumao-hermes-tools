import { Hono } from 'hono';
import { query } from '../db/client.js';
import { adminOrAgentAuth } from '../middleware/auth/admin-or-agent.js';
import type { Env } from '../lib/types.js';

const leads = new Hono<Env>();

leads.use('*', adminOrAgentAuth);

leads.get('/', async (c) => {
  const page = Math.max(1, parseInt(c.req.query('page') || '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query('limit') || '20', 10)));
  const offset = (page - 1) * limit;

  const [rowsRes, countRes] = await Promise.all([
    query(
      `SELECT email, first_touch_at, last_touch_at, total_sessions, total_duration_ms, score, last_presentation_slug
       FROM leads ORDER BY last_touch_at DESC LIMIT $1 OFFSET $2`,
      [limit, offset]
    ),
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM leads'),
  ]);

  return c.json({
    data: {
      items: rowsRes.rows,
      page,
      limit,
      total: parseInt(countRes.rows[0].count, 10),
    },
  });
});

leads.get('/csv', async (_c) => {
  const res = await query(
    'SELECT email, first_touch_at, last_touch_at, total_sessions, total_duration_ms, score, last_presentation_slug FROM leads ORDER BY last_touch_at DESC'
  );
  const header = 'email,first_touch_at,last_touch_at,total_sessions,total_duration_ms,score,last_presentation_slug';
  const rows = res.rows.map((r: Record<string, unknown>) =>
    [r.email, r.first_touch_at, r.last_touch_at, r.total_sessions, r.total_duration_ms, r.score, r.last_presentation_slug ?? '']
      .map((v: unknown) => (v !== null && v !== undefined && String(v).includes(',')) ? `"${String(v).replace(/"/g, '""')}"` : v ?? '')
      .join(',')
  );
  const csv = [header, ...rows].join('\n');
  return new Response(csv, {
    headers: {
      'content-type': 'text/csv',
      'content-disposition': 'attachment; filename="leads.csv"',
    },
  });
});

export default leads;
