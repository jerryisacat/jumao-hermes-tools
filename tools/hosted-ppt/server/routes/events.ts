import { Hono } from 'hono';
import { z } from 'zod';
import { startSession, recordSlideView, endSession } from '../lib/tracking.js';
import { emailAuth } from '../middleware/auth/email.js';
import type { Env } from '../lib/types.js';

const events = new Hono<Env>();

events.use('*', emailAuth);

const pageViewSchema = z.object({
  presentation_slug: z.string().min(1),
  ua: z.string().optional(),
});

const slideViewSchema = z.object({
  session_id: z.string().min(1),
  slide_index: z.number().int().min(0),
  duration_ms: z.number().int().min(0),
});

const sessionEndSchema = z.object({
  session_id: z.string().min(1),
  total_duration_ms: z.number().int().min(0),
  slide_count_seen: z.number().int().min(0),
  completion_rate: z.number().min(0).max(1),
});

events.post('/page-view', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = pageViewSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { presentation_slug, ua } = parsed.data;
  const reader = c.get('reader')!;

  try {
    const sessionId = await startSession(presentation_slug, reader.email, reader.accessLinkId, ua ?? null, null);
    return c.json({ data: { session_id: sessionId } }, 201);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found')) {
      return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404);
    }
    throw err;
  }
});

events.post('/slide-view', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = slideViewSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { session_id, slide_index, duration_ms } = parsed.data;

  try {
    await recordSlideView(session_id, slide_index, duration_ms);
    return c.json({ data: { ok: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found')) {
      return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404);
    }
    throw err;
  }
});

events.post('/session-end', async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const parsed = sessionEndSchema.safeParse(body);
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ') } }, 400);
  }
  const { session_id, total_duration_ms, slide_count_seen, completion_rate } = parsed.data;

  try {
    await endSession(session_id, total_duration_ms, slide_count_seen, completion_rate);
    return c.json({ data: { ok: true } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('not found')) {
      return c.json({ error: { code: 'NOT_FOUND', message: msg } }, 404);
    }
    throw err;
  }
});

export default events;
