# 橘猫的 Hermes 工具箱

[English](README.en.md) | [日本語](README.ja.md)

这是一个公开的个人工具箱，用来收集我在使用 Hermes Agent 的真实流程中，通过 Vibe Coding 做出来的小工具、脚本和配套技能。

这个仓库刻意保持轻量：每个工具或脚本都放在 `tools/` 下的独立文件夹里；每个可复用的 Agent 调用说明放在 `skills/` 下的独立文件夹里。顶层 README 只负责索引这些文件夹。具体用法、依赖、测试方式、副作用和回滚说明，都应该写在对应工具或技能文件夹自己的文档里。

## 工具索引

| 工具 | 状态 | 用途 |
|------|------|------|
| [steam-activity](tools/steam-activity/) | `wip` | 读取 Steam 游戏库、最近游玩和当前正在玩的游戏。 |

## 技能索引

| 技能 | 状态 | 用途 |
|------|------|------|
| [steam-activity](skills/steam-activity/) | `wip` | 指示 Agent 何时以及如何调用 steam-activity 工具。 |

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
- 顶层 README 只做索引，不承载具体工具或技能的详细文档。
- 工具索引和技能索引分开维护。
- 每个工具文件夹必须有自己的 `README.md`，才能在索引中标记为 `usable`。
- 每个技能文件夹必须有自己的 `SKILL.md`。
- 默认 README 是中文；英文和日语版本需要与中文版本同步维护。
- 保持 Git 记录干净：只有工具完成测试并确认可用后，才进行 commit 和 push。
- 不要提交 secrets、token、本地 Hermes 状态、私有配置、session 或 auth 文件。

Agent 维护规则见 `AGENTS.md`。

## License

MIT
