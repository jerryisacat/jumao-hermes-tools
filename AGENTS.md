# Agent instructions

This repository is a public toolbox for small Hermes Agent utilities created through Vibe Coding. It is maintained by coding agents such as Hermes, Codex, Claude Code, and Kilo Code, but the Git history should stay clean and intentional.

## Core purpose

- Collect small tools, scripts, and helpers discovered while using Hermes in real workflows.
- Keep each tool self-contained, easy to inspect, easy to test, and easy to remove.
- Prefer practical, working utilities over broad frameworks.

## Repository structure

Use this structure:

```text
README.md
AGENTS.md
LICENSE
.gitignore
tools/
  <tool-name>/
    README.md
    ...tool files...
skills/
  <skill-name>/
    SKILL.md
```

Rules:

- Every tool or script must live in its own folder under `tools/`.
- Every reusable agent instruction must live in its own folder under `skills/` and include `SKILL.md`.
- Do not add new top-level folders such as `scripts/`, `examples/`, or `docs/` unless the user explicitly approves a repo-wide need.
- Put tool-specific examples, docs, tests, and helper scripts inside that tool's folder.
- Use lowercase kebab-case folder names, for example `tools/profile-auditor/`.
- A tool folder must contain `README.md` before the tool can be marked `usable` in the top-level README.
- When a tool is meant to be called by Hermes or another coding agent, add a matching skill folder such as `skills/<tool-name>/`.

## Top-level README policy

The top-level `README.md` is an index only.

The default README language is Chinese. Maintain these top-level README files together:

- `README.md` — Chinese, default GitHub landing page.
- `README.en.md` — English.
- `README.ja.md` — Japanese.

It should contain:

- Short repo purpose.
- Tool index table.
- Skill index table.
- Status label definitions.
- Minimal repo rules.
- Links to the other language versions.

It should not contain:

- Detailed installation docs for a specific tool.
- Long implementation notes.
- Test logs.
- Troubleshooting for a specific tool.
- Large code blocks.

Detailed documentation belongs in `tools/<tool-name>/README.md`.

Keep the tool index and skill index separate. The tool index points to executable utilities under `tools/`; the skill index points to agent-facing instructions under `skills/`.

When the tool index, skill index, status labels, or repository rules change, update all three README files in the same working-tree change. Do not leave one language stale unless the user explicitly asks for a partial draft.

## Tool README requirements

Each tool's `README.md` should include:

- Purpose: what the tool does and when to use it.
- Status: `idea`, `wip`, `usable`, or `deprecated`.
- Dependencies: runtime, package manager, external commands, required env vars.
- Usage: exact command examples.
- Side effects: files, configs, services, network calls, or Hermes state touched.
- Verification: commands used to confirm it works.
- Rollback: how to undo changes made by the tool.
- Safety notes: especially if it touches `~/.hermes/`, profiles, skills, plugins, cron jobs, memory, or auth state.

## Skill requirements

Each skill folder must contain `SKILL.md` with Hermes-compatible frontmatter and clear operational guidance.

Each `SKILL.md` should include:

- When to use the skill.
- Which tool or files it operates through.
- Required environment variables or local setup.
- Exact commands for normal use and JSON/automation use.
- Failure handling and privacy notes.
- Verification commands when relevant.

Skills must not contain secrets or machine-specific paths unless clearly marked as examples. Prefer an environment variable such as `JUMAO_HERMES_TOOLS_HOME` over hardcoded local paths.

## Status lifecycle

Use these labels consistently:

- `idea`: captured idea or rough direction. Not implemented and not expected to run.
- `wip`: work in progress. May be incomplete, unstable, or untested.
- `usable`: implemented, tested, and confirmed usable for its documented purpose.
- `deprecated`: kept for reference, but no longer recommended for new use.

Default new tools to `wip` unless the user explicitly asks to record only an idea.

Only mark a tool `usable` after real verification has run successfully.

## Development workflow for agents

Before changing anything:

1. Run `git status --short --branch`.
2. Read the top-level `README.md` and this `AGENTS.md`.
3. If editing an existing tool, read that tool's `README.md` and relevant files first.
4. Identify the smallest safe change that satisfies the request.

When adding a new tool:

1. Create `tools/<tool-name>/`.
2. Add the tool implementation and its local `README.md`.
3. Add or update local examples/tests inside the same folder when useful.
4. If the tool is meant for agent use, create `skills/<tool-name>/SKILL.md`.
5. Add one row to the tool index in `README.md`, `README.en.md`, and `README.ja.md`.
6. If a skill was added, add one row to the skill index in all three README files.
7. Keep the status `wip` until verification passes.
8. After verification passes, update status to `usable` only if the tool is genuinely ready.

When editing an existing tool:

1. Keep changes scoped to that tool folder unless repo-wide docs must change.
2. Update the tool README when usage, dependencies, side effects, verification, or rollback changes.
3. Update all three top-level README files only if the tool's name, status, or one-line purpose changes.

## Multilingual README policy

Treat the Chinese README as the source version for structure and intent. English and Japanese should be faithful localized versions, not independent documents.

When maintaining multilingual README files:

- Keep section order the same across `README.md`, `README.en.md`, and `README.ja.md`.
- Keep tool rows aligned across languages: same tool name, same status, same ordering.
- Keep skill rows aligned across languages: same skill name, same status, same ordering.
- Translate purpose text naturally, but do not add extra claims in only one language.
- Keep status label values exactly as `idea`, `wip`, `usable`, and `deprecated` in every language.
- Keep links between language versions working.
- If a tool-specific README becomes multilingual later, follow the same default-Chinese pattern unless the user says otherwise.

## Verification policy

Do not claim a tool works without running it or running the closest available verification.

Verification can include:

- Unit tests or integration tests, if present.
- Dry-run commands.
- Shellcheck or lint checks for shell scripts.
- Syntax checks for Python, TypeScript, JavaScript, or config files.
- Manual command execution against a safe fixture.

If full verification is impossible, say exactly why and keep the tool `wip`.

Record verification commands in the tool README or in the final agent response. Do not store noisy logs in the repo unless they are intentionally curated fixtures.

## Git policy

Keep Git history clean.

- Development work may modify the working tree without committing.
- Do not commit half-finished tools.
- Do not push unverified tools as `usable`.
- Before any commit, run relevant verification and inspect `git diff --check` plus `git status --short`.
- Commit only after the tool is tested and confirmed usable, or after the user explicitly asks to commit documentation/governance work.
- Push only after the user explicitly confirms, unless the current task clearly included automatic push after verification.
- Prefer small commits with clear messages.

For this repo, avoid automatic commit/push by default. Report the changed files and verification results first, then wait for user confirmation.

## Secrets and local state

Never commit:

- API keys, tokens, cookies, OAuth state, private keys, or passwords.
- `.env` files, except safe `.env.example` files.
- Real `~/.hermes/config.yaml`, `~/.hermes/.env`, `auth.json`, sessions, logs, memory files, cron state, or profile-local secrets.
- Machine-specific absolute paths unless they are examples clearly marked as local examples.

If a tool needs secrets, document the expected variable names and setup flow without including real values.

## Hermes-specific safety

Tools that modify Hermes state must be especially explicit.

If a tool touches any of these, document the exact paths and rollback steps:

- `~/.hermes/config.yaml`
- `~/.hermes/.env`
- `~/.hermes/skills/`
- `~/.hermes/plugins/`
- `~/.hermes/cron/`
- `~/.hermes/profiles/`
- Hermes gateway services, launchd plists, or background processes
- Memory providers or indexed knowledge stores

Prefer dry-run support for tools that mutate Hermes state.

## Coding style

- Keep scripts short and readable.
- Prefer standard library and simple shell commands unless a dependency is justified.
- Fail loudly on errors.
- Print actionable output.
- Make destructive operations opt-in and clearly named.
- Avoid hidden global side effects.
- Avoid broad repo refactors unless the user asks for them.

## Agent communication

When finishing a task, report:

- Files changed.
- Verification commands run.
- Whether anything was not verified.
- Whether commit/push was intentionally skipped.

If the user asks for a commit, include the commit hash. If the user asks for a push, include the remote URL or branch.
