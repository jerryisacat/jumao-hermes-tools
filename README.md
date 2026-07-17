# 橘猫的 Hermes 工具箱

[English](README.en.md) | [日本語](README.ja.md)

这是一个公开的个人工具箱，用来收集我在使用 Hermes Agent 的真实流程中，通过 Vibe Coding 做出来的小工具、脚本和配套技能。

这个仓库刻意保持轻量：每个工具或脚本都放在 `tools/` 下的独立文件夹里；每个可复用的 Agent 调用说明放在 `skills/` 下的独立文件夹里；给人阅读和复用的工作流、提示词和检查清单放在 `playbooks/` 下。顶层 README 只负责索引这些文件夹。具体用法、依赖、测试方式、副作用和回滚说明，都应该写在对应文件夹自己的文档里。

## 工具索引

| 工具 | 状态 | 用途 |
|------|------|------|
| [aria2-download](tools/aria2-download/) | `usable` | 用 aria2 安全下载大文件、多文件和断点续传任务。 |
| [hosted-ppt](tools/hosted-ppt/) | `wip` | 面向人类和 AI Agent 的演示文稿托管平台，含邮箱门控、浏览追踪、分析仪表盘和 Agent API。 |
| [steam-activity](tools/steam-activity/) | `usable` | 读取 Steam 游戏库、最近游玩和当前正在玩的游戏。 |

## 技能索引

| 技能 | 状态 | 用途 |
|------|------|------|
| [aria2-download](skills/aria2-download/) | `usable` | 当用户需要大文件、批量下载或断点续传时，指导 Agent 使用本地 aria2 wrapper 并完成校验。 |
| [chinese-formal-documents](skills/chinese-formal-documents/) | `usable` | 创建和检查中文政府公文、合同及协议时，指导 Agent 使用 Typst 与 OfficeCLI 输出经过字体、结构和全页视觉验证的 PDF/DOCX。 |
| [hosted-ppt](skills/hosted-ppt/) | `wip` | 当用户需要部署、添加演示页或排查 hosted-ppt 平台问题时，指导 Agent 完成本地开发、部署、API 调用和页面验证。 |
| [initialize-github-repository](skills/initialize-github-repository/) | `usable` | 初始化 GitHub 仓库时，指导 Agent 完成安全检查、部署平台决策、治理文件、Issue/PR 模板、首次 commit 和 push。 |
| [modern-editorial-documents](skills/modern-editorial-documents/) | `usable` | 创建现代中文报告、方案、白皮书或研究简报时，指导 Agent 使用克制的编辑式设计，并通过 Typst 与 OfficeCLI 输出经过全页验证的 PDF/DOCX。 |
| [steam-activity](skills/steam-activity/) | `usable` | 当用户询问 Steam 当前状态、最近游玩、游戏库或时长排行时，规范使用本地工具查询并解读结果。 |
| [weixin-elder-setup](skills/weixin-elder-setup/) | `wip` | 当 Hermes 已安装、主模型和微信已连接后，将其配置为长辈微信助手：辅助模型、SOUL.md 人格、DM 白名单、每日天气 cron。 |

## 使用手册索引

| 条目 | 类型 | 用途 |
|------|------|------|
| [初始化 AGENTS.md 草案](playbooks/prompts/initialize-agents-md.md) | `prompt` | 引导 Agent 先调研当前仓库，再讨论 `AGENTS.md`、`AGENTS_CHANGELOGS.md` 和 `CODEGUIDE.md` 初始化方案。 |
| [代码文档分层维护规则](playbooks/prompts/code-documentation-layered-maintenance.md) | `prompt` | 引导 Agent 按 L0-L4 分层维护代码结构文档，避免文档混层。 |

## 状态说明

| 状态 | 含义 |
|------|------|
| `idea` | 只是想法或方向记录，尚未实现，不预期可运行。 |
| `wip` | 开发中，可能不完整、不稳定或尚未测试。 |
| `usable` | 已实现、已测试，并确认能完成文档中描述的用途。 |
| `deprecated` | 保留作为参考，但不建议继续使用。 |

## 仓库规则

- 一个工具或脚本对应 `tools/` 下的一个独立文件夹。
- 一个可复用的 Agent 调用说明对应 `skills/` 下的一个独立文件夹。
- 一个给人阅读和复用的工作流、提示词或检查清单对应 `playbooks/` 下的一个 Markdown 文件。
- 顶层 README 只做索引，不承载具体工具或技能的详细文档。
- 工具索引、技能索引和使用手册索引分开维护。
- 每个工具文件夹必须有自己的 `README.md`，才能在索引中标记为 `usable`。
- 每个技能文件夹必须有自己的 `SKILL.md`。
- `playbooks/README.md` 维护人类可读的使用手册目录和治理规则。
- 默认 README 是中文；英文和日语版本需要与中文版本同步维护。
- 保持 Git 记录干净：只有工具完成测试并确认可用后，才进行 commit 和 push。
- 不要提交 secrets、token、本地 Hermes 状态、私有配置、session 或 auth 文件。

Agent 维护规则见 `AGENTS.md`。

## License

MIT
