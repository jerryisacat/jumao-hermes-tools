---
name: hosted-ppt
description: "Use when the user asks to set up, deploy, add presentations to, or troubleshoot the hosted-ppt presentation hosting platform - a dual human + agent system deployed on Vercel + Railway."
version: 0.1.0
author: jerryisacat
license: MIT
metadata:
  hermes:
    tags: [presentation, hosting, vercel, railway, hono, astro, analytics, tracking]
---

# hosted-ppt

## When to use

Use this skill when the user asks to:

- 部署或初始化 hosted-ppt 演示文稿托管平台。
- 往 hosted-ppt 里添加新的 HTML 演示页。
- 排查 hosted-ppt 的 API、数据库、前端或追踪脚本问题。
- 通过 API Key 调用 hosted-ppt 的 Agent API（CRUD 演示文稿、生成链接、查询分析数据）。
- 配置 Vercel + Railway 部署环境变量。
- 运行页面结构验证脚本。

Do not use it when:

- 用户只需要创建一个 PPT 文件（.pptx），而不需要托管平台；使用 officecli 或其他工具。
- 用户只需要静态网站托管，不需要邮箱门控、分析追踪或 Agent API。
- 任务仅涉及编辑 HTML 内容，不涉及平台本身的功能或部署。

## Tool

This skill uses the local tool:

```text
tools/hosted-ppt/
```

Resolve the repository root in this order:

1. If the current working directory is the `jumao-hermes-tools` repo root, use it directly.
2. If `JUMAO_HERMES_TOOLS_HOME` is set, use that as the repo root.
3. Otherwise, ask the user to set `JUMAO_HERMES_TOOLS_HOME` to their local clone path.

Example:

```bash
export JUMAO_HERMES_TOOLS_HOME=/path/to/jumao-hermes-tools
```

The tool source lives at `$JUMAO_HERMES_TOOLS_HOME/tools/hosted-ppt/`.

## Dependencies

Required:

- Node.js 18+
- PostgreSQL (local or cloud)
- Python 3.10+ (for the verification script)

Check availability:

```bash
node --version
python3 --version
```

If the user needs to deploy:

- Vercel CLI: `npm i -g vercel`
- Railway CLI: `npm i -g @railway/cli`

Do not silently install packages unless the user has asked you to set up the environment.

## Architecture

| Layer | Platform | Technology |
|---|---|---|
| Frontend static pages | Vercel | Astro (static HTML output) |
| Edge Middleware | Vercel | Vercel Edge Functions |
| Backend API | Railway | Hono (Node.js runtime) |
| Admin Dashboard | Railway | Astro + htmx |
| Database | Railway | PostgreSQL |
| Session Cache | Vercel | Vercel KV |

Authentication is role-based:

| Role | Method | Header |
|---|---|---|
| Human reader | Email OTP | Cookie session |
| Agent | API Key | `Authorization: Bearer ***` |
| Admin | Session Cookie | Cookie session |

## Environment variables

The tool needs these variables (see `tools/hosted-ppt/.env.example`):

| Variable | Platform | Purpose |
|---|---|---|
| `DATABASE_URL` | Railway | PostgreSQL connection string |
| `API_KEY_AGENTS` | Railway | Bearer token for agent API access |
| `ADMIN_EMAIL` | Railway | Admin login email |
| `SESSION_SECRET` | Railway | Secret for signing session tokens |
| `PUBLIC_BASE_URL` | Vercel | Public site URL |
| `PUBLIC_API_URL` | Vercel | Railway backend API URL |

Do not print, log, or commit real secret values.

## Workflow

### A. Local development setup

1. Install dependencies:

```bash
cd tools/hosted-ppt
npm install
cd server && npm install && cd ..
```

2. Copy and fill environment variables:

```bash
cp .env.example .env
# Edit .env with local values
```

3. Initialize the database:

```bash
psql $DATABASE_URL -f server/db/schema.sql
```

4. Start the backend:

```bash
cd server && npm run dev
```

5. In another terminal, start the frontend:

```bash
npm run dev
```

### B. Adding a presentation

1. Create a slug directory under `public/talks/`, e.g. `public/talks/my-deck/`.
2. Save the HTML as `index.html` inside that directory.
3. Ensure mobile-responsive slide scaling if using a fixed 1600×900 canvas (see `skills/hosted-ppt-maintenance/references/standalone-html-responsive-and-vercel.md` for the pattern).
4. Include the tracking script before `</body>`:

```html
<script src="/tracking.js"></script>
```

5. Add a link in `src/web/pages/index.astro` inside the `.deck-list` `<ul>`:

```html
<li><a href="/talks/my-deck/">My Deck</a></li>
```

6. Run the verification script:

```bash
python3 tools/hosted-ppt/scripts/verify_hosted_ppt_page.py my-deck --repo tools/hosted-ppt
```

### C. Deploying

1. Push the code to GitHub.
2. On Vercel: import the repo as a static site (Output Directory: `.`, Build Command: blank).
3. On Railway: deploy the `server/` directory as a Node.js service.
4. Set environment variables on both platforms.
5. Run `schema.sql` against the Railway PostgreSQL instance.

### D. Using the Agent API

With an API key (`Authorization: Bearer <key>`):

```bash
# List all presentations
curl -H "Authorization: Bearer $API_KEY_AGENTS" \
  https://your-railway-app.up.railway.app/api/presentations

# Create a presentation
curl -X POST -H "Authorization: Bearer $API_KEY_AGENTS" \
  -H "Content-Type: application/json" \
  -d '{"slug":"my-deck","title":"My Deck"}' \
  https://your-railway-app.up.railway.app/api/presentations

# Create an access link
curl -X POST -H "Authorization: Bearer $API_KEY_AGENTS" \
  -H "Content-Type: application/json" \
  -d '{"presentation_slug":"my-deck","email":"viewer@example.com"}' \
  https://your-railway-app.up.railway.app/api/agent/share

# Query analytics overview
curl -H "Authorization: Bearer $API_KEY_AGENTS" \
  https://your-railway-app.up.railway.app/api/analytics/overview
```

## Failure handling

- Missing `DATABASE_URL`: the server starts but database calls fail. Tell the user to set it in `.env` or Railway variables.
- Missing `API_KEY_AGENTS`: agent API returns 401. Tell the user to set it as an environment variable.
- Missing `SESSION_SECRET`: falls back to `API_KEY_AGENTS` or `'dev-insecure-key'`. Warn the user in production.
- OTP not received: in development, OTP is printed to console (`DEV OTP for ...`). In production, SMTP must be configured.
- `astro build` warns "Missing pages directory": this is a known issue (pages are in `src/web/pages/` instead of `src/pages/`). Does not affect Vercel static file serving from `public/`.

## Safety rules

- Do not commit `.env` files or real secret values.
- Do not print `API_KEY_AGENTS`, `SESSION_SECRET`, or `DATABASE_URL` values in logs or chat.
- Agent API mutations are logged to `agent_audit_log` table automatically.
- Viewer emails are masked in API responses by default (`m***@domain.com`).
- Do not expose raw viewer PII in API responses unless specifically requested.

## Verification

Use these before marking the tool `usable`:

```bash
# Python script
python3 -m py_compile tools/hosted-ppt/scripts/verify_hosted_ppt_page.py
python3 tools/hosted-ppt/scripts/verify_hosted_ppt_page.py --help

# Backend TypeScript
cd tools/hosted-ppt/server && npx tsc --noEmit

# Backend ESLint
cd tools/hosted-ppt/server && npx eslint .

# Frontend Astro check
cd tools/hosted-ppt && npx astro check
```

Mark the tool `usable` only after a full Vercel + Railway deployment has been verified end-to-end. Until then, keep it as `wip`.
