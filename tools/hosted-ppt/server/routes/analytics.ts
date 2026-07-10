import { Hono } from 'hono';
import { query } from '../db/client.js';
import { adminOrAgentAuth } from '../middleware/auth/admin-or-agent.js';
import type { Env } from '../lib/types.js';

const analytics = new Hono<Env>();

analytics.use('*', adminOrAgentAuth);

analytics.get('/overview', async (c) => {
  const [presRes, sessRes, viewerRes, leadRes, completionRes, recentRes] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM presentations'),
    query<{ count: string }>("SELECT COUNT(*)::text AS count FROM viewing_sessions WHERE started_at > now() - interval '30 days'"),
    query<{ count: string }>('SELECT COUNT(DISTINCT viewer_email)::text AS count FROM viewing_sessions'),
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM leads'),
    query<{ avg: string | null }>('SELECT AVG(completion_rate)::text AS avg FROM viewing_sessions WHERE ended_at IS NOT NULL'),
    query<{ viewer_email: string; presentation_slug: string; started_at: string }>(
      `SELECT vs.viewer_email, p.slug AS presentation_slug, vs.started_at
       FROM viewing_sessions vs
       JOIN presentations p ON p.id = vs.presentation_id
       ORDER BY vs.started_at DESC LIMIT 5`
    ),
  ]);

  return c.json({
    data: {
      total_presentations: parseInt(presRes.rows[0].count, 10),
      total_views_30d: parseInt(sessRes.rows[0].count, 10),
      unique_viewers: parseInt(viewerRes.rows[0].count, 10),
      total_leads: parseInt(leadRes.rows[0].count, 10),
      avg_completion_rate: completionRes.rows[0].avg ? parseFloat(completionRes.rows[0].avg) : 0,
      recent_activity: recentRes.rows.map((r) => ({
        viewer_email: r.viewer_email,
        presentation_slug: r.presentation_slug,
        started_at: r.started_at,
      })),
    },
  });
});

analytics.get('/:slug', async (c) => {
  const slug = c.req.param('slug');
  const presRes = await query<{ id: string; slide_count: number }>('SELECT id, slide_count FROM presentations WHERE slug = $1', [slug]);
  if (presRes.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Presentation not found' } }, 404);
  }
  const pres = presRes.rows[0];

  const [sessRes, viewerRes, durRes, completionRes, heatmapRes] = await Promise.all([
    query<{ count: string }>('SELECT COUNT(*)::text AS count FROM viewing_sessions WHERE presentation_id = $1', [pres.id]),
    query<{ count: string }>('SELECT COUNT(DISTINCT viewer_email)::text AS count FROM viewing_sessions WHERE presentation_id = $1', [pres.id]),
    query<{ avg: string | null }>('SELECT AVG(total_duration_ms)::text AS avg FROM viewing_sessions WHERE presentation_id = $1 AND ended_at IS NOT NULL', [pres.id]),
    query<{ avg: string | null }>('SELECT AVG(completion_rate)::text AS avg FROM viewing_sessions WHERE presentation_id = $1 AND ended_at IS NOT NULL', [pres.id]),
    query<{ slide_index: number; avg_duration_ms: string; view_count: string }>(
      `SELECT slide_index, AVG(duration_ms)::text AS avg_duration_ms, COUNT(*)::text AS view_count
       FROM slide_views WHERE presentation_id = $1 GROUP BY slide_index ORDER BY slide_index`,
      [pres.id]
    ),
  ]);

  const heatmap = heatmapRes.rows.map((r) => ({
    slide_index: r.slide_index,
    avg_duration_ms: parseFloat(r.avg_duration_ms),
    view_count: parseInt(r.view_count, 10),
  }));

  return c.json({
    data: {
      total_sessions: parseInt(sessRes.rows[0].count, 10),
      unique_viewers: parseInt(viewerRes.rows[0].count, 10),
      avg_duration_ms: durRes.rows[0].avg ? parseFloat(durRes.rows[0].avg) : 0,
      avg_completion: completionRes.rows[0].avg ? parseFloat(completionRes.rows[0].avg) : 0,
      slide_count: pres.slide_count,
      heatmap,
    },
  });
});

export default analytics;
