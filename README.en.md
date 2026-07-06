# Jumao Hermes Tools

[中文](README.md) | [日本語](README.ja.md)

This is a public personal toolbox for small tools, scripts, and companion skills created through Vibe Coding while using Hermes Agent in real workflows.

This repository is intentionally lightweight: each tool or script lives in its own folder under `tools/`; each reusable agent instruction lives in its own folder under `skills/`; and human-facing workflows, prompts, and checklists live under `playbooks/`. The top-level README only indexes those folders. Detailed usage, dependencies, test steps, side effects, and rollback notes belong in each folder's own documentation.

## Tool index

| Tool | Status | Purpose |
|------|--------|---------|
| [aria2-download](tools/aria2-download/) | `usable` | Safely downloads large files, URL batches, and resumable transfers with aria2. |
| [steam-activity](tools/steam-activity/) | `usable` | Reads Steam library, recently played games, and the currently played game. |

## Skill index

| Skill | Status | Purpose |
|-------|--------|---------|
| [aria2-download](skills/aria2-download/) | `usable` | Guides agents to use the local aria2 wrapper for large, batched, or resumable downloads with verification. |
| [steam-activity](skills/steam-activity/) | `usable` | Guides agents to query and interpret Steam current status, recent activity, library, and playtime rankings. |

## Playbook index

| Entry | Type | Purpose |
|-------|------|---------|
| [Initialize an AGENTS.md draft](playbooks/prompts/initialize-agents-md.md) | `prompt` | Guides an agent to research the current repository before discussing an initialization plan for `AGENTS.md`, `AGENTS_CHANGELOGS.md`, and `CODEGUIDE.md`. |

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
