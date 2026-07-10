import { Hono } from 'hono';
import { z } from 'zod';
import * as crypto from 'node:crypto';
import { query } from '../db/client.js';
import { logAgentAction } from '../lib/audit.js';
import { maskEmail } from '../lib/auth-utils.js';
import { apiKeyAuth } from '../middleware/auth/api-key.js';
import type { Env } from '../lib/types.js';

const agent = new Hono<Env>();

agent.use('*', apiKeyAuth);

const generateSchema = z.object({
  slug: z.string().min(1),
  title: z.string().min(1),
  prompt: z.string().min(1),
});

const shareSchema = z.object({
  presentation_slug: z.string().min(1),
  email: z.string().email(),
  label: z.string().optional(),
  expires_at: z.string().datetime().optional(),
});

agent.post('/generate', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = generateSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { slug, title, prompt } = parsed.data;
  const agentId = c.get('agentId')!;

  await logAgentAction(agentId, 'generate_presentation', 'presentation', null, `slug=${slug}; title=${title}; prompt=${prompt.slice(0, 100)}`);
  return c.json({ data: { message: 'Generation queued - use git workflow for Phase 1', slug } });
});

agent.get('/answer', async (c) => {
  const q = c.req.query('q') || '';
  const agentId = c.get('agentId')!;

  if (q.toLowerCase().includes('overview') || q.toLowerCase().includes('summary')) {
    const presRes = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM presentations');
    const sessRes = await query<{ count: string }>("SELECT COUNT(*)::text AS count FROM viewing_sessions WHERE started_at > now() - interval '30 days'");
    const leadRes = await query<{ count: string }>('SELECT COUNT(*)::text AS count FROM leads');

    await logAgentAction(agentId, 'answer_query', 'analytics', null, `q=${q}`);
    return c.json({
      data: {
        answer: `Overview: ${presRes.rows[0].count} presentations, ${sessRes.rows[0].count} sessions (30d), ${leadRes.rows[0].count} leads.`,
        understood: true,
      },
    });
  }

  await logAgentAction(agentId, 'answer_query', 'analytics', null, `q=${q}`);
  return c.json({ data: { answer: 'Natural language queries available in Phase 2', understood: false } });
});

agent.post('/share', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = shareSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { presentation_slug, email, label, expires_at } = parsed.data;
  const agentId = c.get('agentId')!;

  const presRes = await query<{ id: string }>('SELECT id FROM presentations WHERE slug = $1', [presentation_slug]);
  if (presRes.rows.length === 0) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Presentation not found' } }, 404);
  }
  const presentationId = presRes.rows[0].id;
  const token = crypto.randomUUID();

  const res = await query<{ id: string }>(
    `INSERT INTO access_links (presentation_id, email, label, token, expires_at, created_by)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [presentationId, email, label ?? null, token, expires_at ?? null, agentId]
  );
  const id = res.rows[0].id;
  const baseUrl = process.env.PUBLIC_BASE_URL || '';
  const url = `${baseUrl}/talks/${presentation_slug}?t=${token}`;

  await logAgentAction(agentId, 'create_link', 'link', id, `slug=${presentation_slug}; email=${maskEmail(email)}`);
  return c.json({ data: { url } }, 201);
});

export default agent;
