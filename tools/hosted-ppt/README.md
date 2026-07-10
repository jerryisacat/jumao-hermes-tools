# hosted-ppt

## 用途

`hosted-ppt` 是一个面向人类和 AI Agent 的演示文稿托管平台。它支持：

- 托管独立 HTML 演示页面；
- 邮箱门控访问（读者提供邮箱后获取验证码才能查看）；
- 浏览追踪分析（谁看了、看了多久、翻到哪一页）；
- Agent API 进行 CRUD 和分析查询；
- 管理后台仪表盘。

适合需要轻量、API-first 的演示文稿托管和追踪场景。部署目标为 Vercel（前端 + Edge）+ Railway（后端 API + 数据库）。

它不是一个通用的 CMS、LMS 或文件存储服务。它不做 PPT 原生格式（.pptx）转换，也不提供实时协作编辑。

## 状态

`wip`

原因：已完成代码清洗和安全修复（`tsc --noEmit` 通过、`astro check` 通过、`eslint` 通过、`py_compile` 通过），但尚未在全新的 Vercel + Railway 环境中完成端到端部署验证。Astro 页面目录（`src/web/pages/`）与 Astro 默认路径（`src/pages/`）不一致的问题尚待修复。

## 依赖

### 前端（Vercel）

- Node.js 18+
- Astro 5.x
- Vercel CLI（用于本地开发和部署）

### 后端（Railway）

- Node.js 18+
- PostgreSQL（本地或云端）
- Hono 4.x
- `pg` 8.x、`bcryptjs`、`zod`

### 验证脚本

- Python 3.10+

### 环境变量

复制 `.env.example` 到 `.env` 并填入本地值。关键变量：

| 变量 | 平台 | 用途 |
|---|---|---|
| `DATABASE_URL` | Railway | PostgreSQL 连接字符串 |
| `API_KEY_AGENTS` | Railway | Agent API Key（Bearer token） |
| `ADMIN_EMAIL` | Railway | 管理员登录邮箱 |
| `SESSION_SECRET` | Railway | 签名 session token 的密钥 |
| `KV_URL` | Vercel | Vercel KV 连接 |
| `KV_REST_API_URL` | Vercel | Vercel KV REST 端点 |
| `KV_REST_API_TOKEN` | Vercel | Vercel KV 认证 token |
| `PUBLIC_BASE_URL` | Vercel | 公开站点 URL |
| `PUBLIC_API_URL` | Vercel | Railway 后端 API URL |

注意：以上变量均为 secret，必须只放在本机环境变量或平台 secret 管理器中，绝对不要提交到仓库。

## 用法

### 本地开发

```bash
# 安装前端依赖
npm install

# 安装后端依赖
cd server && npm install && cd ..

# 设置环境变量
cp .env.example .env
# 编辑 .env 填入本地值

# 初始化数据库
psql $DATABASE_URL -f server/db/schema.sql

# 启动后端 API
cd server && npm run dev

# 另一个终端启动前端
npm run dev
```

### 添加演示文稿

将独立 HTML 放入 `public/talks/<slug>/index.html`，然后在 `src/web/pages/index.astro` 的 `.deck-list` 列表中添加链接。

### 验证页面结构

```bash
python3 scripts/verify_hosted_ppt_page.py <slug> --repo /path/to/hosted-ppt
```

可选指定预期 slide 数量：

```bash
python3 scripts/verify_hosted_ppt_page.py <slug> 12 --repo /path/to/hosted-ppt
```

### 部署

- 前端：`vercel deploy` 或连接 GitHub 仓库自动部署
- 后端：`railway up` 或连接 GitHub 仓库自动部署
- 数据库：在 Railway 创建 PostgreSQL 服务后运行 `schema.sql`

## 项目结构

```
hosted-ppt/
├── public/talks/              # 演示文稿 HTML
├── public/tracking.js          # 浏览追踪脚本
├── src/web/                    # Astro 前端（静态输出）
├── server/                     # Hono 后端 API
│   ├── db/schema.sql           # PostgreSQL schema
│   ├── routes/                 # API 路由
│   ├── middleware/auth/       # 认证中间件
│   └── lib/                    # 共享逻辑
├── scripts/verify_hosted_ppt_page.py
├── skills/hosted-ppt-maintenance/
├── AGENTS.md
├── CODEGUIDE.md
└── .env.example
```

详见 `CODEGUIDE.md`。

## 副作用

- 本地开发会启动 `localhost:4321`（前端）和 `localhost:3001`（后端）；
- 数据库初始化会创建 8 张表和 2 个 PostgreSQL 函数（幂等，可安全重跑）；
- 部署到 Vercel / Railway 会创建对应平台的服务和资源；
- 不写入 `~/.hermes/`、不修改 Hermes 配置、不创建缓存文件。

## 安全说明

- 所有 API 认证使用 Bearer token（Agent）或 httpOnly cookie（人类/管理员）；
- OTP 使用 `crypto.randomInt()` 生成，10 分钟过期；
- Session token 使用 HMAC-SHA256 签名；
- `secureCompare` 使用 `crypto.timingSafeEqual` 防止 timing 攻击；
- 邮箱在 API 响应中默认脱敏（`m***@domain.com`）；
- Agent 所有写操作记录到 `agent_audit_log` 表；
- 永远不要提交 `.env` 文件或真实 secret 值。

## 回滚和清理

删除整个工具目录即可从 jumao-hermes-tools 中移除：

```bash
rm -rf tools/hosted-ppt
rm -rf skills/hosted-ppt
```

如果已在 Vercel / Railway 部署，需要分别删除对应平台上的项目和服务。

## 验证

```bash
# Python 脚本语法检查
python3 -m py_compile scripts/verify_hosted_ppt_page.py

# Python 脚本帮助信息
python3 scripts/verify_hosted_ppt_page.py --help

# 后端 TypeScript 类型检查
cd server && npx tsc --noEmit

# 后端 ESLint
cd server && npx eslint .

# 前端 Astro 类型检查
npx astro check
```

## 已知问题

1. **Astro 页面目录问题**：Astro 页面放在 `src/web/pages/` 而非 Astro 默认的 `src/pages/`，`astro build` 会输出 "Missing pages directory" 警告且不构建这些页面。这是从原始项目继承的已知问题，需要后续在 `astro.config.mjs` 中添加 `srcDir` 配置或将页面迁移到 `src/pages/`。

2. **Vercel KV 已弃用**：`@vercel/kv` 包已标记为 deprecated。建议迁移到 Upstash Redis。

3. **Agent 路由为 Phase 1 占位**：`/api/agent/generate` 返回固定消息 "Generation queued - use git workflow for Phase 1"；`/api/answer` 仅处理包含 "overview" 或 "summary" 的查询，其余返回 "available in Phase 2"。

4. **邮件发送未实现**：OTP 在开发模式下打印到控制台，生产环境需要接入 SMTP（`.env.example` 中已有 `SMTP_*` 变量占位）。
