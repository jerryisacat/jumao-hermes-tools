---
name: hosted-ppt
description: "Agent governance for hosted-ppt: a dual human + agent presentation platform deployed on Vercel + Railway."
---

# AGENTS.md

## Project Overview

`hosted-ppt` is a presentation hosting platform used by **both humans and AI agents**. Humans view presentations; agents create, manage, and analyze them alongside human admins. The product is **API-first**: every feature is exposed as an API, and both the browser-based admin dashboard and AI agents consume the same endpoints.

## Deployment Target

Default deployment platform: **Vercel (frontend + edge) + Railway (backend API + admin + database)**.

Agent rules:
- Frontend static pages and Edge Middleware deploy on Vercel.
- Business logic API, Admin Dashboard, PostgreSQL, and Cron jobs deploy on Railway.
- Session tokens and rate-limiting data use Vercel KV.
- New environment variables must update `.env.example` and deployment docs.
- Document environment variable names and purpose only; never commit real values.
- Check Vercel Edge runtime constraints before adding dependencies to middleware (no Node.js-only APIs in Edge).

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend static pages | Astro (static HTML output) |
| Edge Middleware | Vercel Edge Functions |
| Backend API | Hono (Node.js runtime on Railway) |
| Admin Dashboard | Astro + htmx (served from Railway) |
| Database | PostgreSQL (Railway) |
| Session Cache | Vercel KV |

## Mobile Strategy

**Current decision: all pages must be mobile-adapted. No exceptions.**

This is a hard requirement. Every HTML page - directory, standalone presentations, admin dashboard, login screens - must render correctly and be usable on mobile viewports (320px–428px width).

Agent rules:
- Every new HTML page or component must include `<meta name="viewport" content="width=device-width, initial-scale=1" />`.
- Use responsive layouts: CSS Grid/Flexbox, `clamp()`, `min()`, `max()`, relative units (rem, em, %).
- No fixed-width containers wider than 100vw.
- Touch targets must be at least 44x44px.
- Test at 375px (iPhone SE) and 428px (iPhone 14 Pro Max) widths before marking any UI task complete.
- Fixed-slide presentations (1600x900 canvas) must use the `slide-shell` scaling pattern - see `CODEGUIDE.md`.
- Admin Dashboard must be fully usable on mobile: tables collapse, forms stack, navigation is accessible.
- Do not introduce assumptions that the user is on a desktop.

## API-First Design

All features must be implemented as API endpoints first. The browser admin dashboard and AI agents both call the same APIs.

Agent rules:
- New features require a corresponding API endpoint before any UI implementation.
- API routes follow RESTful conventions under `/api/`.
- Authentication is role-based: email session (human readers), API key (agents), session cookie (admin).
- All API responses are JSON with consistent error shape: `{ error: { code, message } }`.
- Document new endpoints in `CODEGUIDE.md`.

## Agent API Access

Agents authenticate via API Key (`Authorization: Bearer <key>`). API keys are stored as environment variables on Railway and never committed.

Agent capabilities with API Key:
- CRUD presentations (create, read, update, delete)
- Generate and manage access links
- Query analytics and viewing data
- Generate presentation HTML from structured content
- Read leads and viewer information

Agent restrictions:
- Agent cannot modify admin user permissions or create new admin accounts.
- Agent cannot delete analytics data.
- Agent bulk operations (> 10 items) require explicit confirmation.
- Agent must not expose raw viewer PII in responses unless specifically requested.
- Agent must log all mutations to `agent_audit_log`.

## GitHub Issues and Pull Requests

Issues are for trackable bugs, features, tasks, research, and follow-ups. One issue should describe one deliverable problem, not a bundle of unrelated work.

Issue content should include:
- Background / Cause
- Expected outcome
- Scope
- Acceptance criteria
- Verification
- Risk / Notes

Bug issues should also include reproduction steps, actual behavior, expected behavior, and environment.

Pull requests should be small and tied to one issue or one clear goal.

PR content should include:
- Summary
- Linked issue
- Changed files / modules
- Verification
- Screenshots or logs when UI or behavior changed
- Risk / rollback

Deployment, database, permission, or security-boundary changes must explicitly describe risk and rollback.

## Agent Git Operations

For adding/publishing presentation HTML, agents continue to use the existing git-based workflow:
1. Create or update `talks/<slug>/index.html`
2. Update homepage directory if needed
3. Verify with `scripts/verify_hosted_ppt_page.py`
4. Commit and push to `main`

When modifying API or infrastructure code, agents must:
1. Run typecheck and lint before committing.
2. Run tests if they exist.
3. Never commit secrets, `.env` files, or credentials.

## Environment Variables

| Variable | Platform | Purpose |
|---|---|---|
| `DATABASE_URL` | Railway | PostgreSQL connection string |
| `API_KEY_AGENTS` | Railway | Bearer token for agent API access |
| `ADMIN_EMAIL` | Railway | Admin login email |
| `SESSION_SECRET` | Railway | Secret for signing session tokens |
| `KV_URL` | Vercel | Vercel KV connection |
| `KV_REST_API_URL` | Vercel | Vercel KV REST endpoint |
| `KV_REST_API_TOKEN` | Vercel | Vercel KV auth token |
| `PUBLIC_BASE_URL` | Vercel | Public site URL for generating links |
| `PUBLIC_API_URL` | Vercel | Railway backend API URL (inlined into static JS at build) |

Never commit actual values. Only commit `.env.example` with placeholder values.

## Roadmap

### Phase 1: API Foundation + Email Gate + Core Tracking
- Hono API on Railway with PostgreSQL
- Email verification replaces shared password
- page_view / slide_view / session event tracking
- API Key authentication for agents
- Minimal admin dashboard

### Phase 2: Agent Capability + Personalized Links
- Agent APIs: generate, query, natural language interaction
- Personalized link generation (bound email + expiry)
- Anti-forwarding verification
- Slide-level heatmap analysis

### Phase 3: Notification + Lead Management
- Viewing notifications (email / webhook)
- Lead scoring and export
- Agent auto-reporting

### Phase 4: Advanced
- Multi-user / teams
- Template system
- AI behavior summaries
- Webhook / third-party integrations
