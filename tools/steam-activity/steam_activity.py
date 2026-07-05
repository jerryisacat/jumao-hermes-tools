#!/usr/bin/env python3
"""Summarize Steam activity from the public Steam Web API or local fixtures."""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional

STEAM_API_BASE = "https://api.steampowered.com"
TOP_PLAYED_LIMIT = 10


class SteamActivityError(Exception):
    """Actionable CLI error."""


def minutes_to_hours(minutes: Any) -> float:
    """Convert Steam minute counters to hours rounded to one decimal."""
    try:
        value = float(minutes or 0)
    except (TypeError, ValueError) as exc:
        raise SteamActivityError(f"Invalid playtime value: {minutes!r}") from exc
    return round(value / 60.0, 1)


def require_mapping(value: Any, label: str) -> Dict[str, Any]:
    if not isinstance(value, dict):
        raise SteamActivityError(f"Malformed {label}: expected a JSON object")
    return value


def read_json_file(path: Path) -> Dict[str, Any]:
    try:
        with path.open("r", encoding="utf-8") as handle:
            data = json.load(handle)
    except FileNotFoundError as exc:
        raise SteamActivityError(f"Missing fixture file: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SteamActivityError(f"Malformed JSON in {path}: {exc}") from exc
    return require_mapping(data, str(path))


def load_fixtures(fixture_dir: Path) -> Dict[str, Dict[str, Any]]:
    return {
        "player_summaries": read_json_file(fixture_dir / "player_summaries.json"),
        "owned_games": read_json_file(fixture_dir / "owned_games.json"),
        "recently_played": read_json_file(fixture_dir / "recently_played.json"),
    }


def fetch_steam_json(endpoint: str, params: Dict[str, str]) -> Dict[str, Any]:
    query = urllib.parse.urlencode(params)
    url = f"{STEAM_API_BASE}/{endpoint}?{query}"
    request = urllib.request.Request(url, headers={"User-Agent": "jumao-hermes-tools steam-activity"})
    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            charset = response.headers.get_content_charset() or "utf-8"
            payload = response.read().decode(charset)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")[:300]
        raise SteamActivityError(f"Steam API HTTP {exc.code} for {endpoint}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise SteamActivityError(f"Steam API request failed for {endpoint}: {exc.reason}") from exc
    except TimeoutError as exc:
        raise SteamActivityError(f"Steam API request timed out for {endpoint}") from exc

    try:
        data = json.loads(payload)
    except json.JSONDecodeError as exc:
        raise SteamActivityError(f"Steam API returned malformed JSON for {endpoint}: {exc}") from exc
    return require_mapping(data, endpoint)


def load_live_data(api_key: str, steam_id: str) -> Dict[str, Dict[str, Any]]:
    shared = {"key": api_key, "steamid": steam_id, "format": "json"}
    return {
        "player_summaries": fetch_steam_json(
            "ISteamUser/GetPlayerSummaries/v0002/",
            {"key": api_key, "steamids": steam_id, "format": "json"},
        ),
        "owned_games": fetch_steam_json(
            "IPlayerService/GetOwnedGames/v0001/",
            {**shared, "include_appinfo": "true", "include_played_free_games": "true"},
        ),
        "recently_played": fetch_steam_json(
            "IPlayerService/GetRecentlyPlayedGames/v0001/",
            shared,
        ),
    }


def first_player(player_summaries: Dict[str, Any]) -> Dict[str, Any]:
    response = require_mapping(player_summaries.get("response", {}), "player summaries response")
    players = response.get("players", [])
    if players is None:
        players = []
    if not isinstance(players, list):
        raise SteamActivityError("Malformed player summaries: response.players must be a list")
    if not players:
        return {}
    return require_mapping(players[0], "player summary")


def games_from_response(payload: Dict[str, Any], label: str) -> List[Dict[str, Any]]:
    response = require_mapping(payload.get("response", {}), f"{label} response")
    games = response.get("games", [])
    if games is None:
        games = []
    if not isinstance(games, list):
        raise SteamActivityError(f"Malformed {label}: response.games must be a list")
    return [require_mapping(game, f"{label} game") for game in games]


def normalize_game(game: Dict[str, Any]) -> Dict[str, Any]:
    appid = game.get("appid")
    name = game.get("name") or f"App {appid}"
    playtime_forever = game.get("playtime_forever", 0)
    playtime_2weeks = game.get("playtime_2weeks", 0)
    try:
        playtime_forever_minutes = int(playtime_forever or 0)
        playtime_2weeks_minutes = int(playtime_2weeks or 0)
    except (TypeError, ValueError) as exc:
        raise SteamActivityError(f"Invalid playtime value in game {appid}: {game!r}") from exc
    return {
        "appid": appid,
        "name": str(name),
        "playtime_forever_minutes": playtime_forever_minutes,
        "playtime_forever_hours": minutes_to_hours(playtime_forever),
        "playtime_2weeks_minutes": playtime_2weeks_minutes,
        "playtime_2weeks_hours": minutes_to_hours(playtime_2weeks),
    }


def normalize_current_game(player: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    gameid = player.get("gameid")
    game_name = player.get("gameextrainfo")
    if not gameid and not game_name:
        return None
    appid: Any = gameid
    if isinstance(gameid, str) and gameid.isdigit():
        appid = int(gameid)
    return {"appid": appid, "name": game_name or f"App {gameid}"}


def build_summary(raw: Dict[str, Dict[str, Any]], source: str, steam_id: Optional[str]) -> Dict[str, Any]:
    player = first_player(raw["player_summaries"])
    owned_games = [normalize_game(game) for game in games_from_response(raw["owned_games"], "owned games")]
    recent_games = [normalize_game(game) for game in games_from_response(raw["recently_played"], "recently played")]

    top_played = sorted(
        owned_games,
        key=lambda game: (-game["playtime_forever_minutes"], str(game["name"]), int(game["appid"] or 0)),
    )[:TOP_PLAYED_LIMIT]

    recently_played = sorted(
        enumerate(recent_games),
        key=lambda pair: (-pair[1]["playtime_2weeks_minutes"], pair[0]),
    )
    recent_sorted = [game for _, game in recently_played]

    warnings: List[str] = []
    if not owned_games:
        warnings.append(
            "Owned games are empty. Steam profile/game details may be private, hidden, or unavailable for this Steam ID."
        )

    return {
        "source": source,
        "steam_id": steam_id or player.get("steamid"),
        "profile": {
            "steamid": player.get("steamid"),
            "personaname": player.get("personaname"),
            "profileurl": player.get("profileurl"),
            "personastate": player.get("personastate"),
        },
        "current_game": normalize_current_game(player),
        "library": {
            "owned_game_count": len(owned_games),
            "top_played": top_played,
        },
        "recently_played": recent_sorted,
        "warnings": warnings,
    }


def format_game_line(game: Dict[str, Any], include_recent: bool = True) -> str:
    recent = ""
    if include_recent and game["playtime_2weeks_hours"] > 0:
        recent = f", 近两周 {game['playtime_2weeks_hours']:.1f} 小时"
    return f"- {game['name']} (AppID {game['appid']}): 总计 {game['playtime_forever_hours']:.1f} 小时{recent}"


def render_human(summary: Dict[str, Any]) -> str:
    profile = summary["profile"]
    persona = profile.get("personaname") or "Unknown player"
    steam_id = summary.get("steam_id") or profile.get("steamid") or "unknown"
    lines = [
        "Steam 活动摘要",
        f"来源: {summary['source']}",
        f"玩家: {persona} ({steam_id})",
    ]
    if profile.get("profileurl"):
        lines.append(f"主页: {profile['profileurl']}")

    current = summary.get("current_game")
    if current:
        lines.append(f"当前游戏: {current['name']} (AppID {current['appid']})")
    else:
        lines.append("当前游戏: Not currently playing")

    library = summary["library"]
    lines.append(f"拥有游戏数量: {library['owned_game_count']}")
    if summary["warnings"]:
        lines.append("")
        lines.append("警告:")
        lines.extend(f"- {warning}" for warning in summary["warnings"])
        lines.append("提示: 如果 live 模式下拥有游戏为空，请检查 Steam 隐私设置中的游戏详情是否公开。")

    lines.append("")
    lines.append(f"游玩时长 Top {TOP_PLAYED_LIMIT}:")
    if library["top_played"]:
        lines.extend(format_game_line(game) for game in library["top_played"])
    else:
        lines.append("- 无可显示游戏")

    lines.append("")
    lines.append("最近游玩:")
    if summary["recently_played"]:
        lines.extend(format_game_line(game) for game in summary["recently_played"])
    else:
        lines.append("- 无最近游玩记录")
    return "\n".join(lines)


def parse_args(argv: Optional[Iterable[str]] = None) -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize Steam activity.")
    subparsers = parser.add_subparsers(dest="command", required=True)
    summary = subparsers.add_parser("summary", help="Print Steam activity summary")
    summary.add_argument("--json", action="store_true", help="Print structured JSON")
    summary.add_argument("--fixture", type=Path, help="Read fixture JSON files from this directory")
    summary.add_argument("--steam-id", help="SteamID64. Defaults to STEAM_ID64 env var in live mode")
    return parser.parse_args(argv)


def command_summary(args: argparse.Namespace) -> int:
    steam_id = args.steam_id or os.environ.get("STEAM_ID64")
    if args.fixture:
        raw = load_fixtures(args.fixture)
        source = f"fixture:{args.fixture}"
    else:
        api_key = os.environ.get("STEAM_API_KEY")
        missing = []
        if not api_key:
            missing.append("STEAM_API_KEY")
        if not steam_id:
            missing.append("STEAM_ID64 or --steam-id")
        if missing:
            raise SteamActivityError(
                "Missing required live-mode setting(s): "
                + ", ".join(missing)
                + ". Use --fixture for offline verification."
            )
        assert api_key is not None
        assert steam_id is not None
        raw = load_live_data(api_key, str(steam_id))
        source = "live"

    summary = build_summary(raw, source=source, steam_id=steam_id)
    if args.json:
        print(json.dumps(summary, ensure_ascii=False, indent=2, sort_keys=True))
    else:
        print(render_human(summary))
    return 0


def main(argv: Optional[Iterable[str]] = None) -> int:
    args = parse_args(argv)
    try:
        if args.command == "summary":
            return command_summary(args)
        raise SteamActivityError(f"Unsupported command: {args.command}")
    except SteamActivityError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
