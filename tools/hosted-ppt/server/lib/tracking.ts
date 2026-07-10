import { query } from '../db/client.js';
import { calculateLeadScore } from './scoring.js';

export async function startSession(
  presentationSlug: string,
  email: string,
  accessLinkId: string | null,
  ua: string | null,
  ip: string | null
): Promise<string> {
  const presRes = await query<{ id: string }>(
    'SELECT id FROM presentations WHERE slug = $1',
    [presentationSlug]
  );
  if (presRes.rows.length === 0) {
    throw new Error(`Presentation not found: ${presentationSlug}`);
  }
  const presentationId = presRes.rows[0].id;

  const res = await query<{ id: string }>(
    `INSERT INTO viewing_sessions (presentation_id, access_link_id, viewer_email, ua, ip)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [presentationId, accessLinkId, email, ua, ip]
  );
  const sessionId = res.rows[0].id;

  await query(
    `SELECT upsert_lead($1, $2, 0, 0)`,
    [email, presentationSlug]
  );

  if (accessLinkId) {
    await query(
      `UPDATE access_links SET view_count = view_count + 1 WHERE id = $1`,
      [accessLinkId]
    );
  }

  return sessionId;
}

export async function recordSlideView(
  sessionId: string,
  slideIndex: number,
  durationMs: number
): Promise<void> {
  const sessionRes = await query<{ presentation_id: string }>(
    'SELECT presentation_id FROM viewing_sessions WHERE id = $1',
    [sessionId]
  );
  if (sessionRes.rows.length === 0) {
    throw new Error(`Session not found: ${sessionId}`);
  }
  const presentationId = sessionRes.rows[0].presentation_id;

  await query(
    `INSERT INTO slide_views (session_id, presentation_id, slide_index, duration_ms)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, presentationId, slideIndex, durationMs]
  );
}

export async function endSession(
  sessionId: string,
  totalMs: number,
  slideCountSeen: number,
  completionRate: number
): Promise<void> {
  const sessionRes = await query<{ viewer_email: string; presentation_id: string }>(
    `SELECT viewer_email, presentation_id FROM viewing_sessions WHERE id = $1`,
    [sessionId]
  );
  if (sessionRes.rows.length === 0) {
    throw new Error(`Session not found: ${sessionId}`);
  }

  await query(
    `UPDATE viewing_sessions
     SET ended_at = now(), total_duration_ms = $2, slide_count_seen = $3, completion_rate = $4
     WHERE id = $1`,
    [sessionId, totalMs, slideCountSeen, completionRate]
  );

  const session = sessionRes.rows[0];
  const slugRes = await query<{ slug: string }>(
    'SELECT slug FROM presentations WHERE id = $1',
    [session.presentation_id]
  );
  const slug = slugRes.rows[0]?.slug ?? null;

  await query(
    `UPDATE leads
     SET total_duration_ms = total_duration_ms + $2,
         score = LEAST(100, score + LEAST(20, $2 / 5000)),
         last_touch_at = now()
     WHERE email = $1`,
    [session.viewer_email, totalMs]
  );

  if (slug) {
    const leadRes = await query<{ total_sessions: number; total_duration_ms: number }>(
      'SELECT total_sessions, total_duration_ms FROM leads WHERE email = $1',
      [session.viewer_email]
    );
    if (leadRes.rows.length > 0) {
      const lead = leadRes.rows[0];
      const score = calculateLeadScore(lead.total_sessions, lead.total_duration_ms, completionRate);
      await query('UPDATE leads SET score = $2 WHERE email = $1', [session.viewer_email, score]);
    }
  }
}
