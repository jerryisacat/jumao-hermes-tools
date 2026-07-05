#!/usr/bin/env python3
"""Small aria2 wrapper for agent-friendly downloads.

The wrapper intentionally avoids aria2 RPC, persistent daemons, shell=True, and
hidden global state. It is meant for explicit fetch/batch/verify workflows.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
from shutil import which
import subprocess
import sys
import tempfile
from typing import Any
from urllib.parse import urlparse

DEFAULT_CONNECTIONS = 8
DEFAULT_SPLITS = 8
DEFAULT_PIECE_SIZE = "1M"


def fail(message: str, *, as_json: bool = False, code: int = 1) -> None:
    payload = {"ok": False, "error": message}
    if as_json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
    else:
        print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(code)


def require_aria2c(as_json: bool = False) -> str:
    path = which("aria2c")
    if not path:
        fail(
            "aria2c not found. Install it first: Debian/Ubuntu `sudo apt-get install aria2`; macOS `brew install aria2`.",
            as_json=as_json,
        )
    assert path is not None
    return path


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def snapshot_dir(path: Path) -> dict[str, tuple[int, int]]:
    if not path.exists():
        return {}
    result: dict[str, tuple[int, int]] = {}
    for item in path.rglob("*"):
        if item.is_file():
            st = item.stat()
            result[str(item.resolve())] = (st.st_size, st.st_mtime_ns)
    return result


def changed_files(before: dict[str, tuple[int, int]], out_dir: Path) -> list[Path]:
    after = snapshot_dir(out_dir)
    paths = []
    for p, meta in after.items():
        if before.get(p) != meta:
            paths.append(Path(p))
    return sorted(paths)


def normalize_hash(value: str) -> str:
    value = value.strip().lower()
    if len(value) != 64 or any(c not in "0123456789abcdef" for c in value):
        raise ValueError("sha256 must be a 64-character hex digest")
    return value


def validate_download_url(value: str) -> str:
    """Allow only ordinary HTTP(S) URLs and reject option-like values."""
    if value.startswith("-"):
        raise ValueError("URL must not start with '-' because aria2c may treat it as an option")
    parsed = urlparse(value)
    if parsed.scheme not in {"http", "https"} or not parsed.netloc:
        raise ValueError("only ordinary http:// or https:// URLs are supported")
    return value


def file_record(path: Path, expected_sha256: str | None = None) -> dict[str, Any]:
    exists = path.exists() and path.is_file()
    record: dict[str, Any] = {
        "path": str(path),
        "exists": exists,
    }
    if exists:
        record["size_bytes"] = path.stat().st_size
        digest = sha256_file(path)
        record["sha256"] = digest
        if expected_sha256 is not None:
            record["sha256_expected"] = expected_sha256
            record["sha256_match"] = digest == expected_sha256
    return record


def print_result(payload: dict[str, Any], as_json: bool) -> None:
    if as_json:
        print(json.dumps(payload, ensure_ascii=False, indent=2))
        return
    if payload.get("dry_run"):
        print("DRY RUN: no download executed")
    print(f"ok: {payload.get('ok')}")
    if "command" in payload:
        print("command:")
        print("  " + " ".join(payload["command"]))
    if "output_dir" in payload:
        print(f"output_dir: {payload['output_dir']}")
    for item in payload.get("files", []):
        status = "exists" if item.get("exists") else "missing"
        line = f"- {item['path']} [{status}]"
        if item.get("exists"):
            line += f" {item.get('size_bytes', 0)} bytes"
            if "sha256" in item:
                line += f" sha256={item['sha256']}"
            if "sha256_match" in item:
                line += f" match={item['sha256_match']}"
        print(line)


def build_common_args(args: argparse.Namespace, out_dir: Path) -> list[str]:
    cmd = [
        require_aria2c(args.json),
        "--dir",
        str(out_dir),
        "--max-connection-per-server",
        str(args.connections),
        "--split",
        str(args.splits),
        "--min-split-size",
        str(args.piece_size),
        "--auto-file-renaming=false",
        "--summary-interval=0",
    ]
    if args.continue_download:
        cmd.append("--continue=true")
    return cmd


def run_command(cmd: list[str], as_json: bool) -> subprocess.CompletedProcess[str]:
    proc = subprocess.run(cmd, text=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if proc.returncode != 0:
        payload = {
            "ok": False,
            "command": cmd,
            "returncode": proc.returncode,
            "stdout": proc.stdout[-4000:],
            "stderr": proc.stderr[-4000:],
        }
        if as_json:
            print(json.dumps(payload, ensure_ascii=False, indent=2))
        else:
            print(proc.stdout, end="")
            print(proc.stderr, end="", file=sys.stderr)
            print(f"ERROR: aria2c exited with {proc.returncode}", file=sys.stderr)
        raise SystemExit(proc.returncode)
    return proc


def command_fetch(args: argparse.Namespace) -> None:
    try:
        url = validate_download_url(args.url)
        expected = normalize_hash(args.sha256) if args.sha256 else None
    except ValueError as e:
        fail(str(e), as_json=args.json)
        raise

    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    before = snapshot_dir(out_dir)

    cmd = build_common_args(args, out_dir)
    if args.out_name:
        if "/" in args.out_name or "\\" in args.out_name:
            fail("--out-name must be a file name, not a path", as_json=args.json)
        cmd += ["--out", args.out_name]
    cmd.append(url)

    payload: dict[str, Any] = {
        "ok": True,
        "mode": "fetch",
        "dry_run": args.dry_run,
        "command": cmd,
        "output_dir": str(out_dir),
        "files": [],
    }
    if args.dry_run:
        print_result(payload, args.json)
        return

    run_command(cmd, args.json)
    files = changed_files(before, out_dir)
    if expected:
        if args.out_name:
            files = [out_dir / args.out_name]
        elif len(files) != 1:
            fail(
                f"--sha256 needs exactly one downloaded/changed file, found {len(files)}. Use --out-name for deterministic verification.",
                as_json=args.json,
            )
    payload["files"] = [file_record(p, expected) for p in files]
    if expected and not all(item.get("sha256_match") for item in payload["files"]):
        payload["ok"] = False
        print_result(payload, args.json)
        raise SystemExit(2)
    print_result(payload, args.json)


def read_url_list(path: Path) -> list[str]:
    urls: list[str] = []
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        urls.append(line)
    return urls


def command_batch(args: argparse.Namespace) -> None:
    source = Path(args.url_file).expanduser().resolve()
    if not source.exists():
        fail(f"URL file not found: {source}", as_json=args.json)
    urls = read_url_list(source)
    if not urls:
        fail(f"URL file has no usable URLs: {source}", as_json=args.json)
    try:
        urls = [validate_download_url(url) for url in urls]
    except ValueError as e:
        fail(str(e), as_json=args.json)
        raise

    out_dir = Path(args.out_dir).expanduser().resolve()
    out_dir.mkdir(parents=True, exist_ok=True)
    before = snapshot_dir(out_dir)

    cmd = build_common_args(args, out_dir)
    payload: dict[str, Any] = {
        "ok": True,
        "mode": "batch",
        "dry_run": args.dry_run,
        "url_count": len(urls),
        "output_dir": str(out_dir),
        "files": [],
    }

    if args.dry_run:
        payload["command"] = cmd + ["--input-file", str(source)]
        print_result(payload, args.json)
        return

    tmp_path: str | None = None
    try:
        with tempfile.NamedTemporaryFile("w", encoding="utf-8", prefix="aria2-download-", suffix=".txt", delete=False) as f:
            tmp_path = f.name
            f.write("\n".join(urls) + "\n")
        cmd += ["--input-file", tmp_path]
        payload["command"] = cmd
        run_command(cmd, args.json)
    finally:
        if tmp_path:
            try:
                os.unlink(tmp_path)
                payload["temp_input_removed"] = True
            except FileNotFoundError:
                payload["temp_input_removed"] = True
            except OSError as e:
                payload["temp_input_removed"] = False
                payload["temp_input_remove_error"] = str(e)

    files = changed_files(before, out_dir)
    payload["files"] = [file_record(p) for p in files]
    print_result(payload, args.json)


def command_verify(args: argparse.Namespace) -> None:
    path = Path(args.file).expanduser().resolve()
    try:
        expected = normalize_hash(args.sha256)
    except ValueError as e:
        fail(str(e), as_json=args.json)
        raise
    record = file_record(path, expected)
    ok = bool(record.get("exists") and record.get("sha256_match"))
    payload = {"ok": ok, "mode": "verify", "files": [record]}
    print_result(payload, args.json)
    if not ok:
        raise SystemExit(2)


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Agent-friendly aria2 download wrapper")
    sub = parser.add_subparsers(dest="command", required=True)

    def add_common(p: argparse.ArgumentParser) -> None:
        p.add_argument("--out-dir", default="downloads", help="Output directory (default: ./downloads)")
        p.add_argument("--connections", type=int, default=DEFAULT_CONNECTIONS, help="Max connections per server")
        p.add_argument("--splits", type=int, default=DEFAULT_SPLITS, help="Number of split connections")
        p.add_argument("--piece-size", default=DEFAULT_PIECE_SIZE, help="Minimum split size, e.g. 1M")
        p.add_argument("--continue", dest="continue_download", action="store_true", default=True, help="Resume partial downloads (default)")
        p.add_argument("--no-continue", dest="continue_download", action="store_false", help="Do not resume partial downloads")
        p.add_argument("--dry-run", action="store_true", help="Print the aria2c command without running it")
        p.add_argument("--json", action="store_true", help="Emit machine-readable JSON")

    fetch = sub.add_parser("fetch", help="Download one URL")
    add_common(fetch)
    fetch.add_argument("url")
    fetch.add_argument("--out-name", help="Deterministic output file name inside --out-dir")
    fetch.add_argument("--sha256", help="Expected SHA-256 digest for the downloaded file")
    fetch.set_defaults(func=command_fetch)

    batch = sub.add_parser("batch", help="Download URLs listed in a text file")
    add_common(batch)
    batch.add_argument("url_file", help="Text file with one URL per line; blank lines and # comments ignored")
    batch.set_defaults(func=command_batch)

    verify = sub.add_parser("verify", help="Verify a file SHA-256")
    verify.add_argument("file")
    verify.add_argument("--sha256", required=True, help="Expected SHA-256 digest")
    verify.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    verify.set_defaults(func=command_verify)

    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    args.func(args)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
