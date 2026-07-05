# Steam Activity

## 用途

`steam-activity` 用来从 Steam Web API 或本地 fixture 生成一个简短的 Steam 活动摘要，包括：

- 玩家资料基础信息；
- 当前正在玩的游戏；
- 拥有游戏数量；
- 总游玩时长最高的前 10 个游戏；
- 最近两周游玩记录。

适合在 Hermes 个人工具流程里快速查看某个 SteamID64 的公开游戏活动。

## 状态

`wip`

原因：目前已通过本地 fixture 验证；如果没有真实 `STEAM_API_KEY` 与目标账号公开隐私设置，就无法确认 live Steam API 路径在实际账号上可用。

## 依赖

- Python 3；
- 仅使用 Python 标准库，无第三方依赖；
- live 模式需要网络访问 Steam Web API。

### 环境变量

live 模式需要：

- `STEAM_API_KEY`：Steam Web API key；
- `STEAM_ID64`：默认查询的 SteamID64，可被 `--steam-id` 覆盖。

注意：Steam API key 是 secret，必须只放在本机环境变量或安全的 secret 管理器中，绝对不要提交到仓库、README、fixture、日志或截图里。

### 获取 Steam API key

Steam API key 在官方页面生成：

```text
https://steamcommunity.com/dev/apikey
```

步骤：

1. 登录要查询的 Steam 账号；
2. 打开 `https://steamcommunity.com/dev/apikey`；
3. 如果 Steam 要求填写 Domain Name，可以填 `localhost` 或你自己的域名。这个工具不需要公开网站，这里只是 Steam 的 API key 注册标签；
4. 按提示同意 Steam Web API Terms of Use；
5. 复制生成的 key，放到本机环境变量或 secret 管理器中，不要提交到仓库。

## 使用方式

### 使用 fixture 离线验证

不需要任何环境变量：

```bash
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures
```

输出 JSON：

```bash
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures --json
```

### live Steam API

live 模式依赖 Steam 隐私设置。即使 API key 和 SteamID64 正确，如果目标账号的游戏详情、拥有游戏或最近游玩记录未公开，API 也可能返回空列表。

```bash
export STEAM_API_KEY='你的 Steam Web API key'
export STEAM_ID64='7656119...'
python3 tools/steam-activity/steam_activity.py summary
```

指定 SteamID64：

```bash
STEAM_API_KEY='你的 Steam Web API key' \
  python3 tools/steam-activity/steam_activity.py summary --steam-id 7656119...
```

输出结构化 JSON：

```bash
python3 tools/steam-activity/steam_activity.py summary --json
```

## 命令格式

```text
python3 tools/steam-activity/steam_activity.py summary [--json] [--fixture DIR] [--steam-id STEAM_ID64]
```

- 默认输出人类可读摘要；
- `--json` 输出结构化 JSON；
- `--fixture DIR` 从目录读取 `player_summaries.json`、`owned_games.json`、`recently_played.json`，不读取环境变量；
- live 模式从环境变量读取 `STEAM_API_KEY`，从 `--steam-id` 或 `STEAM_ID64` 读取 SteamID64。

## 副作用

- fixture 模式：只读取本仓库内的 JSON fixture，不写文件，不访问网络；
- live 模式：向 Steam Web API 发出只读 HTTPS 请求；
- 不修改 Steam 账号、不修改 Hermes 配置、不写入 `~/.hermes/`、不创建缓存文件。

## 验证命令

```bash
python3 -m py_compile tools/steam-activity/steam_activity.py
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures
python3 tools/steam-activity/steam_activity.py summary --fixture tools/steam-activity/fixtures --json
git diff --check
```

## 回滚

删除整个工具目录即可回滚：

```bash
rm -rf tools/steam-activity
```

如果之后顶层 README 或技能文件加入了索引，也需要同步移除对应条目。

## 安全注意事项

- 不要把 `STEAM_API_KEY` 写进脚本、fixture、README 示例、commit message 或 issue；
- 不要把真实用户的私密 Steam 资料保存为 fixture；
- live 模式输出取决于 Steam 账号隐私设置，拥有游戏为空时不一定代表账号没有游戏；
- 本工具只做只读查询，不包含任何破坏性操作。
