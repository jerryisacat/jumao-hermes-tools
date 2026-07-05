---
name: aria2-download
description: "Use when the user needs large-file downloads, batched URL downloads, resumable transfers, or SHA-256 verification through the local aria2-download wrapper."
version: 1.0.0
author: 小咕
license: MIT
metadata:
  hermes:
    tags: [aria2, download, batch, checksum, resumable]
---

# aria2-download

## When to use

Use this skill when the user asks to:

- 下载一个明确 URL 指向的大文件。
- 批量下载多个 URL。
- 使用 aria2、多连接下载或断点续传。
- 下载后按 SHA-256 校验文件完整性。
- 生成适合 Agent 自动判断的下载结果 JSON。

Do not use it when:

- The task is only to read a web page or extract text from a URL; use web extraction/browser tools instead.
- The task is a small API request where `curl` or Python HTTP code is simpler.
- The user has not provided a clear URL or trusted source.
- The source is not an ordinary `http://` or `https://` URL; only ordinary http:// or https:// URLs are supported by this wrapper.
- The URL value starts with `-`, because aria2c may interpret it as an option.
- The user wants to bypass login, paywalls, DRM, rate limits, or access controls.
- The user asks you to search for pirated or unauthorized resources.

## Tool

This skill uses the local wrapper:

```text
tools/aria2-download/aria2_download.py
```

Resolve the repository root in this order:

1. If the current working directory is the `jumao-hermes-tools` repo root, use it directly.
2. If `JUMAO_HERMES_TOOLS_HOME` is set, use that as the repo root.
3. Otherwise, ask the user to set `JUMAO_HERMES_TOOLS_HOME` to their local clone path.

Example:

```bash
export JUMAO_HERMES_TOOLS_HOME=/path/to/jumao-hermes-tools
```

## Dependencies

Required:

- Python 3.10+
- `aria2c`

Check availability:

```bash
aria2c --version
python3 tools/aria2-download/aria2_download.py --help
```

If `aria2c` is missing, tell the user to install it:

```bash
# Debian / Ubuntu
sudo apt-get install aria2

# macOS
brew install aria2
```

Do not silently install packages unless the user has asked you to set up the environment.

## Workflow

1. Confirm the URL source is explicit and allowed.
   - A user-provided direct URL is usually enough.
   - Do not search for unauthorized content.
   - If the source requires credentials, stop and ask for explicit authorization before using any credential-bearing method.

2. Prefer a dry-run when the command shape is non-trivial.

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --dry-run \
  --json
```

3. Run the download with JSON output for agent reasoning.

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --out-name file.zip \
  --json
```

4. If the user provides a SHA-256 digest, verify it in the same command.

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --out-name file.zip \
  --sha256 "<64-character-sha256>" \
  --json
```

5. For batch downloads, create or use a text file with one URL per line, then run:

```bash
python3 tools/aria2-download/aria2_download.py batch urls.txt \
  --out-dir downloads \
  --json
```

6. Report the result.
   - Include the output directory.
   - Include file paths and sizes.
   - Include SHA-256 match status when verification was requested.
   - If the wrapper returns `ok: false` or a non-zero exit code, report the concrete failure and do not claim the download succeeded.

## Output interpretation

When `--json` is used, read these fields:

- `ok`: overall success.
- `mode`: `fetch`, `batch`, or `verify`.
- `dry_run`: true when no download was executed.
- `output_dir`: destination directory.
- `files`: files created or changed by the operation.
- `sha256_match`: present when SHA-256 verification was requested.

If `files` is empty after a successful non-dry-run download, inspect the output directory and aria2 behavior before reporting success; it may mean aria2 reused an existing complete file.

## Safety rules

- Do not pass secrets, cookies, tokens, or Authorization headers through this wrapper; it does not currently model credential handling.
- Do not use shell interpolation to construct download commands. Pass arguments as separate tokens.
- Do not enable or expose aria2 RPC daemon for this wrapper.
- Do not create systemd services, startup entries, or persistent aria2 sessions.
- Do not commit downloaded files, `.aria2` session files, or temporary URL lists.
- Keep downloads inside a user-approved directory.
- Use `--dry-run` first for unfamiliar, large, or potentially risky downloads.

## Failure handling

- Missing `aria2c`: explain the install command for the user's OS.
- `aria2c` non-zero exit: report the exit code and relevant stderr/stdout summary.
- SHA-256 mismatch: treat as failure; do not use the file unless the user explicitly accepts the mismatch.
- Ambiguous file for `--sha256`: rerun with `--out-name` so the target is deterministic.
- Batch file empty: ask for a URL list or create one from user-provided URLs.
- Network failure or 404/403: report the URL-level failure; do not guess alternate mirrors unless the user asks.

## Verification

Before marking this tool usable or after changing it, run focused checks:

```bash
python3 -m py_compile tools/aria2-download/aria2_download.py
python3 tools/aria2-download/aria2_download.py --help
python3 tools/aria2-download/aria2_download.py fetch URL --dry-run --json
python3 tools/aria2-download/aria2_download.py fetch URL --out-name file.txt --sha256 SHA256 --json
python3 tools/aria2-download/aria2_download.py verify file.txt --sha256 SHA256 --json
python3 tools/aria2-download/aria2_download.py batch urls.txt --out-dir downloads --json
```

Use a temporary directory and a small known file for verification. Clean up temporary files and do not store test downloads in the repository.
