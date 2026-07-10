# CODEGUIDE.md

## Project Structure

```
hosted-ppt/
├── public/                     # Static assets (copied to build output root)
│   ├── talks/                   # Presentation HTML (served as static files)
│   │   └── [slug]/
│   │       └── index.html
│   └── tracking.js              # Viewer tracking script (included in talk pages)
├── src/
│   ├── web/                     # Astro frontend (static output)
│   │   ├── pages/
│   │   │   ├── index.astro     # Homepage directory (email-gated)
│   │   │   ├── admin/           # Admin dashboard (Astro + htmx)
│   │   │   │   ├── index.astro
│   │   │   │   ├── presentations.astro
│   │   │   │   ├── analytics.astro
│   │   │   │   └── leads.astro
│   │   │   └── auth/
│   │   │       └── login.astro  # Email verification login
│   │   └── layouts/
│   │       ├── Base.astro       # Base layout with viewport meta
│   │       └── AdminLayout.astro # Admin dashboard layout
├── server/                      # Hono backend API (Railway)
│   ├── index.ts                 # App entry
│   ├── db/
│   │   ├── schema.sql           # PostgreSQL schema
│   │   └── client.ts            # DB connection
│   ├── middleware/
│   │   ├── auth/
│   │   │   ├── api-key.ts       # Agent API Key auth
│   │   │   ├── session.ts       # Admin session auth
│   │   │   ├── email.ts         # Human email verification
│   │   │   └── admin-or-agent.ts # Combined admin/agent auth
│   │   └── error.ts             # Consistent error shape
│   ├── routes/
│   │   ├── presentations.ts     # CRUD presentations
│   │   ├── links.ts             # Access link management
│   │   ├── events.ts            # Tracking event collection
│   │   ├── analytics.ts         # Analytics queries
│   │   ├── leads.ts             # Lead management
│   │   ├── agent.ts             # Agent-specific endpoints
│   │   ├── auth.ts              # Authentication
│   │   └── notifications.ts     # Notification config
│   └── lib/
│       ├── types.ts             # Shared types
│       ├── auth-utils.ts        # Token signing/verification
│       ├── tracking.ts          # Tracking event logic
│       ├── scoring.ts           # Lead scoring
│       └── audit.ts             # Agent audit logging
├── talks/                       # Presentation HTML (git-based publishing)
│   └── [slug]/
│       └── index.html
├── skills/                      # Agent skill definitions
│   └── hosted-ppt-maintenance/
├── scripts/
│   └── verify_hosted_ppt_page.py
├── AGENTS.md
├── CODEGUIDE.md
├── LICENSE
└── .env.example
```

## Mobile Adaptation Standards

Every page - directory, presentation viewer, admin dashboard, login screens - must be fully mobile-responsive. This is non-negotiable.

### Viewport Meta (required on every page)

```html
<meta name="viewport" content="width=device-width, initial-scale=1" />
```

### Responsive Layout Rules

- Use CSS Grid or Flexbox for all layouts.
- Use `clamp()`, `min()`, `max()`, relative units (rem, em, %) for sizing.
- No fixed-width containers wider than 100vw.
- Touch targets must be at least 44x44px.
- Test at 375px and 428px widths before marking any UI task complete.

### Fixed-Slide Scaling Pattern (1600x900 decks)

For presentations using a fixed 1600×900 canvas, use this pattern to scale slides on mobile:

```css
.slide-shell {
  width: 100%;
  height: 900px;
  overflow: hidden;
}

@media screen {
  body { overflow-x: hidden; }
  .slide { transform-origin: top left; }
}
```

```javascript
const SLIDE_WIDTH = 1600;
const SLIDE_HEIGHT = 900;

function resizeSlides() {
  const scale = Math.min(1, window.innerWidth / SLIDE_WIDTH);
  document.querySelectorAll('.slide-shell').forEach((shell) => {
    shell.style.height = `${SLIDE_HEIGHT * scale}px`;
  });
  document.querySelectorAll('.slide').forEach((slide) => {
    slide.style.transform = `scale(${scale})`;
    slide.style.margin = scale === 1 ? '0 auto' : '0';
  });
}
```

### Admin Dashboard Mobile Rules

- Tables must collapse into card lists on small screens.
- Forms must stack vertically.
- Navigation must be accessible (hamburger menu or bottom nav).
- The dashboard must be usable for viewing analytics data on a phone.

### Testing Checklist for UI Changes

- [ ] Passes at 375px width (no horizontal overflow)
- [ ] Passes at 428px width
- [ ] Touch targets ≥ 44x44px
- [ ] No text truncation or overlap
- [ ] Images scale proportionally

## API Design

### Authentication

| Role | Method | Header |
|---|---|---|
| Human reader | Email OTP / Magic Link | Cookie session |
| Agent | API Key | `Authorization: Bearer ***` |
| Admin | Session Cookie | Cookie session |

### Response Shape

Success:
```json
{ "data": { ... } }
```

Error:
```json
{ "error": { "code": "NOT_FOUND", "message": "..." } }
```

### API Endpoints

#### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/email/request` | Request email OTP |
| POST | `/api/auth/email/verify` | Verify OTP, create session |
| POST | `/api/auth/session-from-token` | Create session from access link token |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/admin/logout` | Admin logout |

#### Presentations
| Method | Path | Description |
|---|---|---|
| GET | `/api/presentations` | List all presentations |
| POST | `/api/presentations` | Create presentation |
| GET | `/api/presentations/:slug` | Get presentation detail |
| PUT | `/api/presentations/:slug` | Update presentation |
| DELETE | `/api/presentations/:slug` | Delete presentation |

#### Access Links
| Method | Path | Description |
|---|---|---|
| POST | `/api/links` | Create access link |
| GET | `/api/links?presentation=:slug` | List links for presentation |
| GET | `/api/links/validate` | Validate link token (edge) |
| PUT | `/api/links/:id` | Update link |
| DELETE | `/api/links/:id` | Revoke link |

#### Tracking Events
| Method | Path | Description |
|---|---|---|
| POST | `/api/events/page-view` | Record page open |
| POST | `/api/events/slide-view` | Record slide view |
| POST | `/api/events/session-end` | Record session end |

#### Analytics
| Method | Path | Description |
|---|---|---|
| GET | `/api/analytics/overview` | Dashboard overview |
| GET | `/api/analytics/:slug` | Per-presentation analytics |

#### Leads
| Method | Path | Description |
|---|---|---|
| GET | `/api/leads` | List all leads |
| GET | `/api/leads.csv` | Export leads as CSV |

#### Agent
| Method | Path | Description |
|---|---|---|
| POST | `/api/agent/generate` | Generate HTML from prompt |
| GET | `/api/agent/answer` | Natural language data query |
| POST | `/api/agent/share` | Create link and share |

#### Notifications
| Method | Path | Description |
|---|---|---|
| GET | `/api/notifications` | List notification configs |
| POST | `/api/notifications` | Create notification config |
| DELETE | `/api/notifications/:id` | Delete notification config |

## Database Schema

See `server/db/schema.sql` for the authoritative schema. Key tables:

- `presentations` - presentation content metadata
- `access_links` - email-gated access tokens
- `viewing_sessions` - viewer session records
- `slide_views` - per-slide engagement data
- `users` - admin accounts
- `leads` - aggregated lead data
- `agent_audit_log` - agent action history
- `notifications` - notification rules
- `email_otps` - OTP codes for email verification

## Environment Variables

Copy `.env.example` to `.env` locally. Never commit actual values.

See AGENTS.md for the full variable list.
