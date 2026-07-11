---
name: weixin-elder-setup
description: "Use when configuring an already-running Hermes instance (with model and WeChat connected) into an elderly family member's WeChat companion. Installs elder-specific dependencies, configures vision/STT/memory, writes the SOUL.md persona, secures DM access, and creates a daily weather greeting cron."
version: 1.1.0
author: jerryisacat
license: MIT
metadata:
  hermes:
    tags: [weixin, wechat, elder, family, configuration, cron, gateway]
---

# WeChat Elder Setup

## When to use

Use this skill when **all** of the following are already true:

- Hermes 已安装并能正常启动。
- 主模型已配好（`hermes config` 能看到 `model.default` 和 `model.provider`）。
- 微信已通过 `hermes gateway setup` 扫码连接，`WEIXIN_ACCOUNT_ID` 和 `WEIXIN_TOKEN` 已在 `.env` 中。

此时用户说类似这些话：

- "把这个 Hermes 配成长辈的微信助手"
- "给爸妈用，帮我配好"
- "把长辈的 SOUL.md 和那些功能都弄上"

Do not use it when:

- Hermes 还没安装。
- 主模型还没配好——先让用户用 `hermes model` 或 `hermes setup` 完成。
- 微信还没连接——先 `hermes gateway setup` 完成 QR 登录。
- 用户想配置 WeCom（企业微信）而不是个人微信。
- 用户只是想改某一项配置（直接改就行，不需要这个 skill）。

## What this skill does

把这个已经能跑的 Hermes 实例，变成一个面向长辈的微信助手：

```
已有基础（不碰）              →   本 skill 补齐
─────────────────             ──────────────────────
✅ Hermes 已安装              →   ① 装消息+语音依赖
✅ 主模型已配好               →   ② 配辅助模型（图片/STT/记忆/标题）
✅ 微信已连接                 →   ③ 写 SOUL.md 人格
                              →   ④ 设微信安全策略
                              →   ⑤ 抓长辈 user_id 切白名单
                              →   ⑥ 建每日天气早安 cron
                              →   ⑦ 重启 gateway 验证
```

## Workflow

按顺序执行。每步确认成功后再继续。

### ① Install elder-specific dependencies

主模型和微信能跑，但长辈场景还需要图片识别和语音转文字的依赖。

```bash
pip install aiohttp cryptography faster-whisper
```

如果 messaging extra 没装：

```bash
cd ~/.hermes/hermes-agent && uv pip install -e ".[messaging]"
```

验证：

```bash
python3 -c "import aiohttp, cryptography; print('ok')"
python3 -c "import faster_whisper; print('whisper ok')"
```

### ② Configure auxiliary models

主模型用户已经配好了，不要碰 `model.*`。只配长辈场景需要的辅助部分。

用 `hermes config set` 逐条设置——已有的不覆盖，只补缺的：

```bash
# 图片识别 — 如果用户的 provider 支持 vision（如 GLM、DeepSeek-V4），沿用主模型；
# 否则推荐智谱 GLM-4V-Flash（有免费额度）。先问用户。
hermes config set auxiliary.vision.provider glm
hermes config set auxiliary.vision.model glm-4v-flash

# 压缩、会话搜索、标题生成 — 沿用主模型的 provider，省钱
# 先读当前 provider
CURRENT_PROVIDER=$(hermes config get model.provider 2>/dev/null | awk '{print $NF}')
CURRENT_MODEL=$(hermes config get model.default 2>/dev/null | awk '{print $NF}')
hermes config set auxiliary.compression.provider "$CURRENT_PROVIDER"
hermes config set auxiliary.compression.model "$CURRENT_MODEL"
hermes config set auxiliary.session_search.provider "$CURRENT_PROVIDER"
hermes config set auxiliary.session_search.model "$CURRENT_MODEL"
hermes config set auxiliary.title_generation.provider "$CURRENT_PROVIDER"
hermes config set auxiliary.title_generation.model "$CURRENT_MODEL"
hermes config set auxiliary.title_generation.language zh

# 语音转文字 — 本地 Whisper，免费，支持中文
hermes config set stt.enabled true
hermes config set stt.provider local
hermes config set stt.local.model base
hermes config set stt.local.language zh

# 文字转语音 — Edge TTS 中文女声，免费
hermes config set tts.provider edge
hermes config set tts.edge.voice zh-CN-XiaoxiaoNeural

# 记忆 — 记住长辈的习惯和偏好
hermes config set memory.memory_enabled true
hermes config set memory.user_profile_enabled true

# 时区
hermes config set timezone Asia/Shanghai

# Gateway 不自动休眠
hermes config set gateway.scale_to_zero.idle_timeout_minutes 0
```

验证：

```bash
hermes doctor
```

### ③ Write SOUL.md

从 playbook 拉取长辈 SOUL.md 并写入：

```bash
curl -fsSL https://raw.githubusercontent.com/jerryisacat/jumao-hermes-tools/main/playbooks/prompts/weixin-elder-soul.md \
  -o /tmp/weixin-elder-soul-playbook.md
```

提取文件中 ` ```markdown` 代码块内的内容（即 `# 身份` 开头到结尾），写入 `~/.hermes/SOUL.md`。

如果 `~/.hermes/SOUL.md` 已有内容，先问用户是否覆盖——不要静默覆盖已有的人格文件。

确认：

```bash
head -3 ~/.hermes/SOUL.md
# 应该输出：
# 身份
# (空行)
# 你是一个通过微信陪伴长辈的 AI 助手。
```

### ④ Set WeChat safety policy

长辈场景需要把微信 DM 策略从 open 切到 allowlist。但此时还不知道长辈的 user_id，所以**先用 open 临时启动**，下一步抓到 user_id 后再锁。

确保 `.env` 中：

```bash
WEIXIN_DM_POLICY=open
```

### ⑤ Get elder's user_id → switch to allowlist

临时启动 gateway：

```bash
hermes gateway restart
sleep 3
```

告诉用户：**"现在让长辈给 bot 发一条消息。"**

等用户确认长辈已发，查日志：

```bash
grep -iE "weixin.*(inbound|from)" ~/.hermes/logs/gateway.log | tail -5
```

找到 `wxid_xxxxx` 格式的 user_id。

写入 `.env`：

```
WEIXIN_DM_POLICY=allowlist
WEIXIN_ALLOWED_USERS=wxid_xxxxx
```

重启生效：

```bash
hermes gateway restart
```

### ⑥ Create daily weather cron

```bash
hermes cron create "0 8 * * *" \
  --name "elder-morning-greeting" \
  --prompt "给长辈发早安问候。先从记忆中读取长辈所在城市，联网查今天天气，然后用 SOUL.md 里定义的语气发一条简短的早安+天气消息。如果记忆中没有城市信息，发一条早安并顺口问一下城市。"
```

验证：

```bash
hermes cron list
```

### ⑦ Final verification

向用户确认以下全部通过：

- [ ] `hermes doctor` 无报错
- [ ] 长辈发文字 → AI 回复（语气像 SOUL.md 定义的小智）
- [ ] 长辈发图片 → AI 描述图片内容
- [ ] 长辈发语音 → AI 听懂并回复
- [ ] DM 策略是 allowlist，只有长辈的 user_id
- [ ] cron job 已创建（每天 8 点）
- [ ] gateway 正常运行

## Pitfalls

| 问题 | 解决 |
|------|------|
| `faster-whisper` 安装失败 | 确认容器有 1GB+ 内存；或改用 `stt.provider: groq` + `GROQ_API_KEY` |
| 图片识别不工作 | 检查 `GLM_API_KEY` 或确认主模型 provider 支持 vision |
| `curl` 拉不到 SOUL.md | 容器可能无法访问 GitHub，手动从本地复制内容 |
| 长辈发消息后日志无 inbound | 确认长辈是给 iLink bot 身份发，不是给扫码的微信号发 |
| cron 消息没送达 | 确认 gateway 在运行；确认 cron 的 deliver 目标是微信 channel |
| 配置改了不生效 | 微信相关配置改了必须 `hermes gateway restart` |

## Rollback

```bash
# 停 cron
hermes cron remove elder-morning-greeting

# 恢复 DM 策略为 open（如需）
# 手动编辑 ~/.hermes/.env

# 删除 SOUL.md（如需）
rm ~/.hermes/SOUL.md
```

不会影响用户原有的主模型配置和微信连接——本 skill 不碰那两个。
