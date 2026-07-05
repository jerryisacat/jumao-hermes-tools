---
name: steam-activity
description: "Use when the user asks about their Steam library, recently played games, playtime, or currently playing game."
version: 0.1.0
author: jerryisacat
license: MIT
metadata:
  hermes:
    tags: [steam, games, activity, library, playtime]
---

# Steam Activity

Use this skill when the user asks about their Steam account activity, including:

- 当前正在玩什么游戏
- 最近玩了什么游戏
- Steam 游戏库里有哪些游戏
- 哪些游戏游玩时间最长
- 根据 Steam 游玩记录聊游戏
- Summarize my Steam activity

## Tool

This skill uses the local tool:

```text
tools/steam-activity/steam_activity.py
```

Resolve the repository root in this order:

1. If the current working directory is the `jumao-hermes-tools` repo root, use it directly.
2. If `JUMAO_HERMES_TOOLS_HOME` is set, use that as the repo root.
3. Otherwise, ask the user to set `JUMAO_HERMES_TOOLS_HOME` to their local clone path.

Example:

```bash
export JUMAO_HERMES_TOOLS_HOME=/path/to/jumao-hermes-tools
```

## Required environment variables for live Steam API

- `STEAM_API_KEY`: Steam Web API key. Do not print, log, or commit this value.
- `STEAM_ID64`: Steam ID64 for the profile to inspect. May be overridden with `--steam-id`.

The tool can also run in fixture mode without secrets.

## How to help the user get a Steam API key

If `STEAM_API_KEY` is missing, tell the user to generate one from Steam's official Web API key page:

```text
https://steamcommunity.com/dev/apikey
```

Guidance for the user:

1. Sign in with the Steam account they want to inspect.
2. Open `https://steamcommunity.com/dev/apikey`.
3. If Steam asks for a domain name, enter a local/personal label such as `localhost` or the user's own domain. This tool does not require a public website; the value is only Steam's API key registration label.
4. Accept Steam's Web API Terms of Use if prompted.
5. Copy the generated key into a local secret store or shell environment variable as `STEAM_API_KEY`.
6. Do not paste the key into chat unless the user explicitly wants the assistant to configure it, and never commit it.

Also ask the user for or help them find their Steam ID64. The tool reads it from `STEAM_ID64` or `--steam-id`.

## Commands

From the repo root:

```bash
python3 tools/steam-activity/steam_activity.py summary
python3 tools/steam-activity/steam_activity.py summary --json
```

From elsewhere:

```bash
python3 "$JUMAO_HERMES_TOOLS_HOME/tools/steam-activity/steam_activity.py" summary --json
```

Fixture mode:

```bash
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures --json
```

## Output interpretation

Use JSON output for agent reasoning. It should include:

- `profile`: Steam profile summary.
- `current_game`: current game object or null.
- `library`: owned game count, top played games, and warnings if data is unavailable.
- `recently_played`: recent games with playtime.
- `warnings`: privacy or availability warnings.

If `current_game` is null, say the user is not currently detected as playing a Steam game rather than guessing.

## Failure handling

- Missing `STEAM_API_KEY`: explain that live Steam API mode requires the key; point the user to `https://steamcommunity.com/dev/apikey`; suggest fixture mode for local verification.
- Missing `STEAM_ID64`: ask for Steam ID64 or suggest setting the environment variable.
- Empty owned games: mention Steam privacy settings, especially game details visibility.
- Network/API failure: report the endpoint-level failure without exposing secrets.
- Fixture parse failure: treat as a tool bug and inspect fixture JSON.

## Privacy and safety

- Never print or store `STEAM_API_KEY`.
- Do not commit `.env` files or real API responses containing private profile data unless the user explicitly curates them.
- Do not infer private preferences beyond what the API output supports.
- Steam Web API visibility depends on the user's Steam privacy settings.

## Verification

Use these before marking the tool usable:

```bash
python3 -m py_compile tools/steam-activity/steam_activity.py
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures --json
git diff --check
```

Live verification additionally requires:

```bash
STEAM_API_KEY=... STEAM_ID64=... python3 tools/steam-activity/steam_activity.py summary --json
```

Mark the tool `usable` only after live verification succeeds or the user explicitly accepts fixture-only verification.
