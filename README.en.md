# Jumao Hermes Tools

[中文](README.md) | [日本語](README.ja.md)

This is a public personal toolbox for small tools, scripts, and companion skills created through Vibe Coding while using Hermes Agent in real workflows.

This repository is intentionally lightweight: each tool or script lives in its own folder under `tools/`, and each reusable agent instruction lives in its own folder under `skills/`. The top-level README only indexes those folders. Detailed usage, dependencies, test steps, side effects, and rollback notes belong in each tool or skill folder's own documentation.

## Tool index

| Tool | Status | Purpose |
|------|--------|---------|
| [steam-activity](tools/steam-activity/) | `usable` | Reads Steam library, recently played games, and the currently played game. |

## Skill index

| Skill | Status | Purpose |
|-------|--------|---------|
| [steam-activity](skills/steam-activity/) | `usable` | Guides agents to query and interpret Steam current status, recent activity, library, and playtime rankings. |

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
- The top-level README is an index only; do not turn it into detailed documentation for specific tools or skills.
- Keep the tool index and skill index separate.
- Each tool folder must contain its own `README.md` before it can be marked `usable` in the index.
- Each skill folder must contain its own `SKILL.md`.
- The default README is Chinese; English and Japanese versions must be kept in sync with it.
- Keep Git history clean: commit and push only after a tool has been tested and confirmed usable.
- Do not commit secrets, tokens, local Hermes state, private config, sessions, or auth files.

Agent maintenance rules are in `AGENTS.md`.

## License

MIT
