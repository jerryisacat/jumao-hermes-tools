-- hosted-ppt PostgreSQL schema
-- Run: psql $DATABASE_URL -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Admin users (session cookie auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  role TEXT NOT NULL DEFAULT 'admin',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Presentations metadata (the HTML lives in talks/<slug>/index.html via git)
CREATE TABLE IF NOT EXISTS presentations (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  slide_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);

-- Email-gated access links (personalized links bound to an email)
CREATE TABLE IF NOT EXISTS access_links (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  presentation_id TEXT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  label TEXT,
  token TEXT UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  max_views INTEGER,
  view_count INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by TEXT
);
CREATE INDEX IF NOT EXISTS idx_access_links_token ON access_links(token);
CREATE INDEX IF NOT EXISTS idx_access_links_email ON access_links(email);
CREATE INDEX IF NOT EXISTS idx_access_links_presentation ON access_links(presentation_id);

-- A viewing session = one person opening a presentation
CREATE TABLE IF NOT EXISTS viewing_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  access_link_id TEXT REFERENCES access_links(id) ON DELETE SET NULL,
  presentation_id TEXT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  viewer_email TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  completion_rate REAL NOT NULL DEFAULT 0,
  ua TEXT,
  ip TEXT,
  slide_count_seen INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_presentation ON viewing_sessions(presentation_id);
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_email ON viewing_sessions(viewer_email);
CREATE INDEX IF NOT EXISTS idx_viewing_sessions_started ON viewing_sessions(started_at DESC);

-- Per-slide viewing data (for heatmap / engagement)
CREATE TABLE IF NOT EXISTS slide_views (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  session_id TEXT NOT NULL REFERENCES viewing_sessions(id) ON DELETE CASCADE,
  presentation_id TEXT NOT NULL REFERENCES presentations(id) ON DELETE CASCADE,
  slide_index INTEGER NOT NULL,
  entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_slide_views_session ON slide_views(session_id);
CREATE INDEX IF NOT EXISTS idx_slide_views_presentation ON slide_views(presentation_id);

-- Aggregated leads (denormalized for quick querying/export)
CREATE TABLE IF NOT EXISTS leads (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  first_touch_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_touch_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  score INTEGER NOT NULL DEFAULT 0,
  last_presentation_slug TEXT
);

-- Agent action audit log (ALL agent mutations must be logged here)
CREATE TABLE IF NOT EXISTS agent_audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id TEXT NOT NULL,
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id TEXT,
  payload_summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_agent_audit_created ON agent_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agent_audit_agent ON agent_audit_log(agent_id);

-- Notification rules
CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  presentation_id TEXT REFERENCES presentations(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'view',
  channel TEXT NOT NULL DEFAULT 'email',
  target TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- OTP codes for email verification
CREATE TABLE IF NOT EXISTS email_otps (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT NOT NULL,
  code TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_email_otps_email ON email_otps(email);

-- Updated_at trigger for presentations
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_presentations_updated ON presentations;
CREATE TRIGGER trg_presentations_updated
  BEFORE UPDATE ON presentations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Upsert helper for leads: call when a viewing session is created to keep
-- aggregated lead row in sync. Usage:
--   SELECT upsert_lead(p_email, p_slug, p_duration_ms, p_completion);
CREATE OR REPLACE FUNCTION upsert_lead(
  p_email TEXT,
  p_slug TEXT,
  p_duration_ms INTEGER DEFAULT 0,
  p_completion REAL DEFAULT 0
)
RETURNS TEXT AS $$
DECLARE
  v_id TEXT;
BEGIN
  INSERT INTO leads (email, first_touch_at, last_touch_at, total_sessions, total_duration_ms, score, last_presentation_slug)
  VALUES (
    p_email,
    now(),
    now(),
    1,
    p_duration_ms,
    LEAST(100, (
      10
      + LEAST(40, p_duration_ms / 1000)
      + LEAST(30, FLOOR(p_completion * 30)::int)
    )),
    p_slug
  )
  ON CONFLICT (email) DO UPDATE SET
    last_touch_at = now(),
    total_sessions = leads.total_sessions + 1,
    total_duration_ms = leads.total_duration_ms + p_duration_ms,
    score = LEAST(100, leads.score + 10 + LEAST(20, p_duration_ms / 5000)),
    last_presentation_slug = p_slug
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
