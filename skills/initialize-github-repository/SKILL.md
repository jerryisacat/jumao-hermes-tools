---
name: initialize-github-repository
description: "Use when initializing a local project as a GitHub repository or adding first-time GitHub governance files. Guides safe repo creation, secret checks, deployment target decisions, README/license/gitignore setup, Issues/PR templates, initial commit, push, and optional Agent governance playbooks."
version: 1.1.0
author: jerryisacat
license: MIT
metadata:
  hermes:
    tags: [github, repository, initialization, governance, deployment, issues, pull-requests]
---

# Initialize GitHub Repository

## When to use

Use this skill when the user asks to:

- 初始化一个新的 GitHub 仓库。
- 把当前本地项目推到 GitHub。
- 给已有 GitHub 仓库补齐首次治理文件。
- 为一个项目建立 README、`.gitignore`、LICENSE、Issue 模板、PR 模板或 Agent 维护规则。
- 明确项目未来部署平台，并把运行时约束写进仓库治理文档。
- 让一个仓库变成安全、可协作、可部署、可由 AI Agent 持续维护的项目。

Do not use it when:

- The user only asks to clone, fork, release, or edit an existing GitHub repo setting; use a generic GitHub repo management workflow instead.
- The repository is not intended to be pushed to GitHub or GitHub-compatible hosting.
- The user asks to publish secrets, private data, customer data, credentials, cookies, or proprietary deployment details.
- The user wants to bypass organization policy, branch protection, review requirements, or access controls.

## Core principle

Initializing a GitHub repository is not merely `git remote add` plus `git push`. The goal is to make the project operationally safe, collaboration-ready, deployment-aware, and maintainable by future humans and AI agents.

Always match governance weight to project maturity:

| Project type | Recommended governance |
|---|---|
| Throwaway experiment | README + `.gitignore` only |
| Personal tool | README + `.gitignore` + lightweight Issue/PR templates |
| Open-source utility | README + LICENSE + Issue/PR templates + concise `AGENTS.md` |
| Agent-maintained codebase | `AGENTS.md` + `CODEGUIDE.md` + audit log + Issue/PR templates |
| Deployed service | All above + deployment target + env docs + rollback notes |

## Repository root

Resolve the target repository root in this order:

1. If the current working directory is the project the user wants to initialize, use it directly.
2. If the user gives a path, switch tool calls to that path after verifying it exists.
3. If the user only gives a project name for a new repo, create a new local directory only after confirming the path or using the current workspace convention.

Before mutating anything, run:

```bash
git status --short --branch 2>/dev/null || true
git remote -v 2>/dev/null || true
pwd
```

Completion criterion: you know whether the directory is a git repo, whether it already has a GitHub remote, and which branch would be pushed.

## Initialization modes

### Mode A: New empty repository

Use when the user wants a new repo and there is no meaningful local project yet.

1. Decide repo metadata: name, owner, visibility, description, license, default branch, deployment target, mobile strategy.
2. Create a local directory.
3. Add minimum files: `README.md`, `.gitignore`, and LICENSE only when open-source publishing is confirmed.
4. Optionally add `.github/ISSUE_TEMPLATE/` and `.github/PULL_REQUEST_TEMPLATE.md`.
5. Initialize git, create GitHub remote, commit, and push.

Completion criterion: remote exists, default branch is pushed, and the initial file set matches the agreed governance weight.

### Mode B: Existing local directory

Use when the user has files but no initialized GitHub repo.

1. Inspect files and project manifests before writing anything.
2. Run the safety gate before any `git add`.
3. Add or update `.gitignore` before staging files.
4. Add minimal README/license/governance docs if missing.
5. Create remote, commit, push, and verify.

Completion criterion: only intended files are tracked and the remote branch is up to date.

### Mode C: Existing git repo without GitHub remote

Use when `.git` exists but `origin` is missing or not GitHub.

1. Inspect branch, commit history shape, and tracked files.
2. Run safety gate for tracked and untracked files.
3. Confirm whether existing commits are safe to publish.
4. Create a GitHub repo and add it as `origin`, or rename the existing remote only with user approval.
5. Push the intended branch and set upstream.

Completion criterion: `git status --short --branch` shows the local branch tracking the GitHub remote.

### Mode D: Existing GitHub repo needing governance docs

Use when remote already exists but repo setup is incomplete.

1. Do not create another repo.
2. Inspect existing README, license, `.gitignore`, `.github/`, and agent governance files.
3. Add only missing governance files that match project maturity.
4. Commit and push only after validation and user confirmation when the change is broad.

Completion criterion: governance gaps are filled without duplicating or overwriting existing conventions.

## Required discovery steps

Read existing context before generating governance docs. Look for:

```text
README.md
README.en.md
README.ja.md
LICENSE
.gitignore
AGENTS.md
CODEGUIDE.md
CONTRIBUTING.md
SECURITY.md
package.json
pnpm-workspace.yaml
pyproject.toml
Cargo.toml
go.mod
Dockerfile
docker-compose.yml
railway.toml
wrangler.toml
fly.toml
.vercel/
.github/
docs/
```

Use file discovery and reads rather than guessing. If a file exists, inherit its conventions. If multiple docs conflict, report the conflict before rewriting.

## Safety gate before any commit or push

Never run `git add .` until this gate is complete.

### File-name and path scan

Check for risky files by name or path:

```text
.env
.env.*
*.pem
*.key
*.p12
*.pfx
id_rsa
id_ed25519
auth.json
cookies
cookiejar
credentials
credential*
secret*
token*
*.sqlite
*.db
*.dump
node_modules
dist
build
.venv
__pycache__
.DS_Store
~/.hermes
```

Use commands that list paths, not secret contents:

```bash
git status --short
git ls-files --others --exclude-standard
git ls-files
```

If content scanning is needed, do not print matched secret values. Use a script that reports only path, line number, and rule name.

### Stop conditions

Stop and ask the user before committing or pushing when:

- A suspected secret file is tracked or staged.
- A suspected secret appears to have been committed in history.
- The directory contains many unclassified files and scope is unclear.
- The user has not confirmed public/private visibility.
- A same-name remote repository already exists.
- Adding a license would imply open-source publishing and the user has not confirmed license choice.
- The user asks to publish a repo that contains private customer data, production configs, or internal business strategy.

Deleting a secret from the working tree is not enough if it was committed. Treat published or committed secrets as a history- and credential-rotation problem.

## Repository metadata decisions

Collect or infer these before creating the GitHub repo:

| Field | Default |
|---|---|
| Repo name | Current directory name |
| Owner | Current `gh` login user or user-specified org |
| Visibility | Private by default unless user explicitly says open-source/public |
| Description | README first paragraph or ask user |
| License | MIT only when open-source publishing is confirmed; otherwise omit |
| Default branch | `main` unless existing repo uses another branch |
| Topics | Optional, from project domain |
| Homepage | Optional |

If the repository is intended to be public, remind the user that all committed content becomes public history.

## Deployment target decision

Deployment platform is part of code governance. If the project contains an app, API, worker, cron job, bot, static site, service, or deployable artifact, explicitly decide the deployment target and write it into `AGENTS.md` or the equivalent agent governance file.

Default preference order:

1. Prefer Cloudflare stack for frontend, edge APIs, static sites, Workers, Pages, Cron Triggers, Queues, KV, R2, and D1 when suitable.
2. Prefer Railway for backend services, databases, workers, and cron jobs that fit a managed platform model.
3. Use Fly.io when Railway is unsuitable but managed app deployment is still preferred.
4. Use self-managed VPS only when the project needs full OS control, persistent daemons, custom networking, special regional constraints, or cost constraints that managed platforms do not satisfy.

Record at least:

| Question | What to document |
|---|---|
| Does it deploy? | library, CLI, web app, worker, API, static site, or service |
| Target platform | Cloudflare Pages/Workers, Railway, Fly.io, VPS, or none |
| Why this platform | Cost, runtime, DB, queues, cron, files, region, ops burden |
| Runtime constraints | Filesystem, long tasks, sockets, queues, cron, CPU/memory |
| Environment variables | Variable names and purpose only, never real values |
| Local vs production | Ports, build command, start command, deployment command |

Example `AGENTS.md` section:

```markdown
## Deployment Target

Default deployment platform: Cloudflare Pages + Cloudflare Workers.

Agent rules:
- Check Cloudflare Workers runtime constraints before adding dependencies.
- Do not design features that require persistent local filesystem writes.
- Use Queues, Cron Triggers, KV, R2, D1, or an external worker for long-running jobs.
- Document environment variable names and purpose only; never commit real values.
```

For Railway:

```markdown
## Deployment Target

Default deployment platform: Railway.

Agent rules:
- Split web, worker, and cron into separate Railway services when needed.
- New environment variables must update `.env.example` and deployment docs.
- Do not assume local persistent disk unless the service explicitly provisions it.
- Run build/type/test checks before pushing deployment-affecting commits.
```

For VPS:

```markdown
## Deployment Target

Default deployment platform: self-managed VPS.

Agent rules:
- Document Docker Compose, systemd, Caddy/Nginx, ports, logs, backups, and rollback.
- Do not commit server IPs, SSH keys, production domains with private credentials, or firewall secrets.
- Treat service changes as operations changes and include verification plus rollback notes.
```

Completion criterion: future agents can read the governance docs and understand where the project is meant to run and which design choices are forbidden by that platform.

## Mobile strategy decision

Mobile support is part of product and code governance. Before generating or updating `AGENTS.md` for a repository that has any user interface, explicitly ask the user whether the project needs mobile adaptation or should be mobile-first. Do not infer this from the tech stack alone.

Ask at least:

| Question | What to document |
|---|---|
| Is mobile support required? | yes, no, later, or unknown |
| Priority model | mobile-first, desktop-first with mobile compatibility, or desktop-only |
| Target surfaces | responsive web, PWA, native app, mini program, tablet, or none |
| UX constraints | breakpoints, touch targets, offline mode, installability, viewport assumptions |
| Verification | which viewport/device checks are required before finishing UI work |

Write the confirmed decision into `AGENTS.md` or the equivalent agent governance file. If the user says mobile is not required, record that explicitly so future agents do not add mobile-first complexity by default.

Example `AGENTS.md` section:

```markdown
## Mobile Strategy

Current decision: desktop-first with mobile compatibility.

Agent rules:
- Before UI changes, check whether the touched view needs mobile behavior.
- Preserve responsive layouts at common mobile widths unless the feature is explicitly desktop-only.
- For UI work, verify at least one desktop viewport and one mobile viewport before completion.
- Do not introduce native app, mini program, or PWA assumptions unless this section is updated.
```

Completion criterion: future agents can read `AGENTS.md` and know whether to design for mobile, mobile-first, desktop-first responsive, or desktop-only behavior.

## Minimal project files

Default minimal set:

```text
README.md
.gitignore
LICENSE        # only when public/open-source is confirmed
```

Optional governance set:

```text
AGENTS.md
CODEGUIDE.md
AGENTS_CHANGELOGS.md
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/ISSUE_TEMPLATE/task.md
.github/PULL_REQUEST_TEMPLATE.md
```

Do not generate heavy CI, labels, release automation, branch protection, or docs sites unless the user asks or the project clearly needs them.

## Optional Agent governance layer

If the user wants future AI agents to maintain the repo, connect to the playbooks in this repository:

```text
playbooks/prompts/initialize-agents-md.md
playbooks/prompts/code-documentation-layered-maintenance.md
```

Use `initialize-agents-md.md` to draft or update:

- `AGENTS.md`
- `AGENTS_CHANGELOGS.md`
- `CODEGUIDE.md`

Use `code-documentation-layered-maintenance.md` when the project needs a stable L0-L4 code documentation system.

When using these playbooks for GitHub initialization, ensure the generated `AGENTS.md` also includes:

- Deployment target and runtime constraints.
- GitHub Issues and Pull Requests rules.
- Issue and PR template maintenance rules.
- When AI agents may create issues or PRs.
- When AI agents must ask the user before creating issues, PRs, commits, or pushes.

Do not auto-generate full agent governance docs for a scratch repo unless the user asks.

## Issues and PR governance

By default, initialize lightweight GitHub collaboration templates unless the user explicitly wants a scratch repo or a minimal private repo.

Recommended files:

```text
.github/ISSUE_TEMPLATE/bug_report.md
.github/ISSUE_TEMPLATE/feature_request.md
.github/ISSUE_TEMPLATE/task.md
.github/PULL_REQUEST_TEMPLATE.md
```

### Issue rules for `AGENTS.md`

Add or adapt this policy when generating `AGENTS.md`:

```markdown
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

If an AI Agent creates an issue, it must distinguish verified facts from assumptions and questions needing human confirmation.
```

### PR rules for `AGENTS.md`

```markdown
Pull requests should be small and tied to one issue or one clear goal.

PR content should include:
- Summary
- Linked issue
- Changed files / modules
- Verification
- Screenshots or logs when UI or behavior changed
- Risk / rollback

Deployment, database, permission, or security-boundary changes must explicitly describe risk and rollback.
```

### Issue template shapes

Use these as starting points, adapting labels to the repo.

Bug report:

```markdown
---
name: Bug report
about: Report a reproducible bug
title: "fix: "
labels: bug
---

## Background

## Steps to reproduce

1.
2.
3.

## Actual behavior

## Expected behavior

## Environment

## Suspected cause

## Acceptance criteria

- [ ]

## Verification

- [ ]

## Notes / risk
```

Feature request:

```markdown
---
name: Feature request
about: Propose a scoped feature
title: "feat: "
labels: enhancement
---

## Background / user need

## Proposed outcome

## Scope

## Out of scope

## Acceptance criteria

- [ ]

## Verification

- [ ]

## Notes / risk
```

Task:

```markdown
---
name: Task
about: Track maintenance, docs, refactor, or research work
title: "task: "
labels: task
---

## Background

## Scope

## Deliverables

## Acceptance criteria

- [ ]

## Verification

- [ ]

## Notes / risk
```

PR template:

```markdown
## Summary

## Linked issue

## Changes

## Verification

- [ ]

## Risk / rollback

## Screenshots / logs
```

Completion criterion: future contributors and AI agents can open issues and PRs with enough context for review and verification.

## GitHub creation flow

Prefer `gh` because it is visible and avoids manually handling tokens.

Check auth:

```bash
gh auth status
```

Create a repo from the current source directory:

```bash
gh repo create REPO_NAME --private --source . --remote origin --push
```

For public open-source repos only after confirmation:

```bash
gh repo create REPO_NAME --public --source . --remote origin --push
```

For an organization:

```bash
gh repo create ORG/REPO_NAME --private --source . --remote origin --push
```

If `gh` is unavailable, use the GitHub API only when a valid token is already configured and the user has authorized API use. Do not print tokens.

## Initial commit flow

Before staging:

1. `.gitignore` exists and covers generated/local/secret files.
2. Safety gate has no unresolved warnings.
3. Repo metadata, deployment target, and mobile strategy are decided or explicitly marked not applicable.
4. Governance weight matches project maturity.

Then stage deliberately:

```bash
git add README.md .gitignore LICENSE AGENTS.md CODEGUIDE.md AGENTS_CHANGELOGS.md .github/ 2>/dev/null || true
git status --short
```

For broader existing projects, add files in scoped groups instead of `git add .` until the user confirms the full file set.

Commit message language should follow the target repo's convention. If there is no convention, Chinese is acceptable for this toolbox style:

```bash
git commit -m "chore:初始化 GitHub 仓库"
```

or English for English-first repos:

```bash
git commit -m "chore: initialize GitHub repository"
```

## Push and verification

After push, verify:

```bash
git status --short --branch
git remote -v
git ls-remote --heads origin
```

If `gh` is available:

```bash
gh repo view --web
# or non-interactive summary
gh repo view --json nameWithOwner,visibility,defaultBranchRef,url
```

Report:

- Repository URL.
- Visibility.
- Default branch.
- Files added or updated.
- Deployment target recorded, or why not applicable.
- Mobile strategy recorded in `AGENTS.md`, or why not applicable.
- Issue/PR templates added, or why skipped.
- Verification commands run.
- Whether commit/push was done or intentionally skipped.

## Common pitfalls

1. **Defaulting to public.** Default to private unless the user explicitly says open-source/public.
2. **Staging before `.gitignore`.** Add `.gitignore` and run the safety gate before staging broad file sets.
3. **Using `git add .` blindly.** Inspect untracked files first; stage intentionally.
4. **Committing secrets.** Do not commit `.env`, auth files, cookies, private keys, local Hermes state, DB dumps, or production configs.
5. **Deleting secrets without history cleanup.** If a secret was committed, treat it as exposed and discuss history rewrite plus credential rotation.
6. **Duplicating remotes.** If a GitHub remote exists, update governance instead of creating another repo.
7. **Skipping deployment target.** Future agents need to know whether the project targets Cloudflare, Railway, Fly.io, VPS, or no deployment.
8. **Over-governing scratch repos.** Do not add large templates, CI, or docs frameworks to one-off experiments.
9. **Generating licenses without consent.** License choice affects legal/open-source status; ask when uncertain.
10. **Creating vague issues or PRs.** Require scope, acceptance criteria, verification, and risk notes.
11. **Mixing README and governance docs.** README is user-facing; `AGENTS.md` is agent-facing; `CODEGUIDE.md` is code-structure documentation.
12. **Ignoring platform constraints.** Do not design persistent filesystem features for Workers or assume Railway/VPS behavior without documenting it.
13. **Skipping mobile strategy.** For UI projects, future agents need to know whether to optimize for mobile-first, desktop-first responsive behavior, or desktop-only scope.

## Verification checklist

- [ ] Current repo state and remotes inspected.
- [ ] Existing README, manifests, `.gitignore`, license, `.github/`, and governance docs checked when present.
- [ ] Safety gate completed before staging, committing, or pushing.
- [ ] Visibility explicitly confirmed or defaulted to private.
- [ ] License only added after open-source intent is confirmed.
- [ ] Deployment target decision recorded in `AGENTS.md` or marked not applicable.
- [ ] Mobile strategy decision recorded in `AGENTS.md` or marked not applicable.
- [ ] Issue and PR governance added or intentionally skipped with reason.
- [ ] Optional Agent governance playbooks referenced only when useful.
- [ ] Commit message follows repo convention.
- [ ] Push verified with git and, when available, `gh repo view`.
- [ ] Final response includes repo URL, branch, verification, and any skipped pieces.
