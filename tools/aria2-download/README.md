# aria2-download

## 用途

`aria2-download` 是一个面向 Agent 的轻量 aria2 wrapper，用于安全执行普通 HTTP/HTTPS 大文件下载、批量 URL 下载和 SHA-256 校验。

它适合在这些场景使用：

- 用户提供了明确的下载 URL。
- 文件较大，希望多连接下载或断点续传。
- 需要批量下载一组 URL。
- 用户提供了校验值，需要下载后确认文件完整性。

它不是下载站、资源搜索器或长期下载服务。它不会寻找资源、绕过访问控制，也不会管理 aria2 RPC daemon。

## 状态

`usable`

原因：已在本机通过语法检查、dry-run、HTTP 下载、SHA-256 校验、独立 verify 子命令、batch 下载和 JSON 输出验证。验证范围限于普通 HTTP/HTTPS 下载、批量 URL 文件和 SHA-256 校验；BitTorrent、magnet、Metalink 和 RPC daemon 是 aria2 原生能力，本 wrapper 不做专门封装或可用性承诺。

## 依赖

- Python 3.10+
- `aria2c`

安装 aria2：

```bash
# Debian / Ubuntu
sudo apt-get install aria2

# macOS
brew install aria2
```

确认依赖：

```bash
aria2c --version
python3 tools/aria2-download/aria2_download.py --help
```

## 用法

### 单 URL 下载

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads
```

指定输出文件名：

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --out-name file.zip
```

先 dry-run，查看实际将执行的 `aria2c` 命令：

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --dry-run
```

### 下载后校验 SHA-256

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --out-name file.zip \
  --sha256 "<64-character-sha256>"
```

也可以单独校验已有文件：

```bash
python3 tools/aria2-download/aria2_download.py verify \
  downloads/file.zip \
  --sha256 "<64-character-sha256>"
```

### 批量下载

准备一个 URL 文件：

```text
# blank lines and # comments are ignored
https://example.com/file1.txt
https://example.com/file2.txt
```

执行批量下载：

```bash
python3 tools/aria2-download/aria2_download.py batch urls.txt --out-dir downloads
```

### JSON 输出

Agent 自动化时优先使用 `--json`：

```bash
python3 tools/aria2-download/aria2_download.py fetch \
  "https://example.com/file.zip" \
  --out-dir downloads \
  --out-name file.zip \
  --json
```

输出包含：

- `ok`：操作是否成功。
- `mode`：`fetch`、`batch` 或 `verify`。
- `output_dir`：下载目录。
- `files`：本次新增或变更的文件、大小、SHA-256、校验结果。

## 常用参数

| 参数 | 默认值 | 说明 |
|------|--------|------|
| `--out-dir` | `downloads` | 输出目录。 |
| `--out-name` | 无 | 单 URL 下载时指定输出文件名。 |
| `--connections` | `8` | 单服务器最大连接数。 |
| `--splits` | `8` | 分段下载数量。 |
| `--piece-size` | `1M` | 最小分段大小。 |
| `--continue` | 开启 | 断点续传。 |
| `--no-continue` | 关闭续传 | 不续传已有部分文件。 |
| `--dry-run` | 关闭 | 只打印命令，不执行下载。 |
| `--json` | 关闭 | 输出 JSON，方便 Agent 判断结果。 |

## 副作用

- 只写入用户指定的 `--out-dir`，默认是当前目录下的 `downloads/`。
- `batch` 模式会创建临时 URL 列表文件并在运行后清理。
- 不修改系统服务。
- 不启动或管理 aria2 RPC daemon。
- 不写入 `~/.aria2/`、`~/.hermes/` 或任何持久配置。
- 不保存 secret、cookie、token 或下载历史。

## 安全说明

- 只下载用户明确提供或任务上下文中可信的普通 HTTP/HTTPS URL。
- 拒绝非 `http://` / `https://` 协议和以 `-` 开头的 URL，避免 aria2c 将输入误解析为命令选项。
- 不帮助搜索、获取或传播侵权资源。
- 不绕过登录、付费墙、DRM、限流或访问控制。
- 如果下载需要 cookie、Authorization header 或其它登录态，必须先取得用户明确授权；本 wrapper 当前不内置凭据传递。
- 不默认启用 aria2 RPC；如用户确实需要 RPC daemon，应另行设计并显式说明监听地址、secret、端口和关闭方式。
- 对未知或高风险来源，先使用 `--dry-run` 并向用户确认。

## 回滚和清理

删除下载文件：

```bash
rm -rf downloads/
```

如果使用了自定义 `--out-dir`，删除对应目录即可。本工具不创建其它持久状态。

## 验证

本工具当前的 `usable` 状态基于以下验证类别：

```bash
python3 -m py_compile tools/aria2-download/aria2_download.py
python3 tools/aria2-download/aria2_download.py --help
python3 tools/aria2-download/aria2_download.py fetch URL --dry-run --json
python3 tools/aria2-download/aria2_download.py fetch URL --out-name file.txt --sha256 SHA256 --json
python3 tools/aria2-download/aria2_download.py verify file.txt --sha256 SHA256 --json
python3 tools/aria2-download/aria2_download.py batch urls.txt --out-dir downloads --json
```

实际验证使用临时目录和本地 HTTP server，不提交下载产物或临时文件。
