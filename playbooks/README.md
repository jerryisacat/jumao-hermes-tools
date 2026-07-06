# 使用手册

这里收集给人阅读和复用的 workflow、prompt 和 checklist。它们不是 Hermes 或 Codex 的技能文件，不要求 `SKILL.md` frontmatter，也不应该写成只能由 Agent 执行的内部指令。

## 索引

### Prompts

| 条目 | 用途 |
|------|------|
| [初始化 AGENTS.md 草案](prompts/initialize-agents-md.md) | 让 Agent 先调研当前仓库，再输出 `AGENTS.md`、`AGENTS_CHANGELOGS.md` 和 `CODEGUIDE.md` 初始化讨论稿。 |

### Workflows

暂无。

### Checklists

暂无。

## 治理规则

- 一个可复用技巧对应一个 Markdown 文件。
- Prompt 放在 `prompts/`，人工操作流程放在 `workflows/`，短检查清单放在 `checklists/`。
- 文件名使用 lowercase kebab-case。
- 内容面向人类读者，说明使用场景、使用方法、注意事项和可复制内容。
- Prompt 模板使用 `{变量}` 这类占位符，不写真实 token、账号、cookie、私有路径或生产配置。
- 如果新增、重命名或删除条目，同步更新本文件和三份顶层 README 的使用手册索引。
