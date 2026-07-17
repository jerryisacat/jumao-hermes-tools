# Jumao Hermes Tools

[中文](README.md) | [日本語](README.ja.md)

This is a public personal toolbox for small tools, scripts, and companion skills created through Vibe Coding while using Hermes Agent in real workflows.

This repository is intentionally lightweight: each tool or script lives in its own folder under `tools/`; each reusable agent instruction lives in its own folder under `skills/`; and human-facing workflows, prompts, and checklists live under `playbooks/`. The top-level README only indexes those folders. Detailed usage, dependencies, test steps, side effects, and rollback notes belong in each folder's own documentation.

## Tool index

| Tool | Status | Purpose |
|------|--------|---------|
| [aria2-download](tools/aria2-download/) | `usable` | Safely downloads large files, URL batches, and resumable transfers with aria2. |
| [hosted-ppt](tools/hosted-ppt/) | `wip` | A presentation hosting platform for humans and AI agents with email gate, viewing analytics, and admin dashboard. |
| [steam-activity](tools/steam-activity/) | `usable` | Reads Steam library, recently played games, and the currently played game. |

## Skill index

| Skill | Status | Purpose |
|-------|--------|---------|
| [aria2-download](skills/aria2-download/) | `usable` | Guides agents to use the local aria2 wrapper for large, batched, or resumable downloads with verification. |
| [chinese-formal-documents](skills/chinese-formal-documents/) | `usable` | Guides agents to create and validate formal Chinese government-style documents, contracts, and agreements as font-checked, structurally validated, visually audited PDF/DOCX files with Typst and OfficeCLI. |
| [hosted-ppt](skills/hosted-ppt/) | `wip` | Guides agents to deploy, add presentations, troubleshoot, and use the Agent API of the hosted-ppt platform. |
| [initialize-github-repository](skills/initialize-github-repository/) | `usable` | Guides agents through safe GitHub repository initialization: secret checks, deployment target decisions, governance files, Issue/PR templates, first commit, and push. |
| [modern-editorial-documents](skills/modern-editorial-documents/) | `usable` | Guides agents to create restrained modern-editorial Chinese reports, proposals, white papers, and briefs as full-page-validated PDF/DOCX outputs with Typst and OfficeCLI. |
| [steam-activity](skills/steam-activity/) | `usable` | Guides agents to query and interpret Steam current status, recent activity, library, and playtime rankings. |
| [weixin-elder-setup](skills/weixin-elder-setup/) | `wip` | After Hermes is installed with model and WeChat already connected, configures it as an elder's WeChat companion: auxiliary models, SOUL.md persona, DM allowlist, and daily weather cron. |

## Playbook index

| Entry | Type | Purpose |
|-------|------|---------|
| [Initialize an AGENTS.md draft](playbooks/prompts/initialize-agents-md.md) | `prompt` | Guides an agent to research the current repository before discussing an initialization plan for `AGENTS.md`, `AGENTS_CHANGELOGS.md`, and `CODEGUIDE.md`. |
| [Layered code documentation maintenance rules](playbooks/prompts/code-documentation-layered-maintenance.md) | `prompt` | Guides an agent to maintain code structure documentation across L0-L4 layers without mixing architecture, principles, domain models, module details, and operations. |

## Status labels

| Status | Meaning |
|--------|---------|
| `idea` | Captured idea or rough direction. Not implemented and not expected to run. |
| `wip` | Work in progress. May be incomplete, unstable, or untested. |
| `usable` | Implemented, tested, and confirmed usable for its documented purpose. |
| `deprecated` | Kept for reference, but no longer recommended for new use. |

## Repository rules

- One tool or script equals one standalone folder under `tools/`.
- One reusable agent instruction equals one standalone folder under `skills/`.
- One human-facing workflow, prompt, or checklist equals one Markdown file under `playbooks/`.
- The top-level README is an index only; do not turn it into detailed documentation for specific tools or skills.
- Keep the tool index, skill index, and playbook index separate.
- Each tool folder must contain its own `README.md` before it can be marked `usable` in the index.
- Each skill folder must contain its own `SKILL.md`.
- `playbooks/README.md` maintains the human-readable playbook catalog and governance rules.
- The default README is Chinese; English and Japanese versions must be kept in sync with it.
- Keep Git history clean: commit and push only after a tool has been tested and confirmed usable.
- Do not commit secrets, tokens, local Hermes state, private config, sessions, or auth files.

Agent maintenance rules are in `AGENTS.md`.

## License

MIT
