# 初始化 AGENTS.md 草案

类型：`prompt`

## 用途

当一个仓库还没有稳定的 Agent 协作规范时，用这个 prompt 要求 Agent 先调研项目现状，再输出讨论稿。它刻意要求“先不要写文件”，适合在正式初始化 `AGENTS.md`、`AGENTS_CHANGELOGS.md` 和 `CODEGUIDE.md` 前做方案确认。

## 使用方法

把下面的 prompt 粘贴给 Agent。确认讨论稿后，再单独要求 Agent 初始化或更新对应文件。

## Prompt

```text
我要为当前仓库初始化 `AGENTS.md`。请先不要直接写文件，先完成调研和方案讨论，等我确认后再初始化。

你的任务：

1. 先阅读当前仓库中已有的项目文档和关键配置文件，例如：
   - `README.md`
   - `SPEC.md`
   - `ARCHITECTURE.md`
   - `package.json`
   - `pyproject.toml`
   - `Cargo.toml`
   - `docs/`
   - 其他能说明项目目标、架构、命令和约定的文件

2. 基于已有文档，整理一份适合写入 `AGENTS.md` 的开发协作规范草案。

3. 草案需要包含：
   - 项目定位和边界
   - 当前技术栈
   - 推荐开发阶段拆分
   - 代码治理规则
   - CommitLog 规则
   - `AGENTS_CHANGELOGS.md` 规则
   - `CODEGUIDE.md` 规则
   - 数据库 / migration 规则，如果项目涉及数据库
   - API / SDK / MCP / CLI 等接口契约规则，如果项目涉及这些接口
   - 安全与隐私规则
   - 测试、验证和发布规则
   - 每轮任务结束前必须检查的文件

4. 开发阶段不要照搬模板，要根据当前项目实际情况拆分。每个阶段应包含：
   - 阶段目标
   - 主要交付物
   - 完成标准
   - 依赖关系

5. 代码治理规则请默认包含：
   - 开发分支使用 `main`，除非仓库已有明确分支策略。
   - CommitLog 使用中文格式：`类型:修改内容`。
   - 常见类型包括：
     - `feat`
     - `fix`
     - `docs`
     - `refactor`
     - `test`
     - `chore`
     - `ci`
     - `build`
     - `perf`
     - `security`
     - `db`

6. `AGENTS_CHANGELOGS.md` 不是传统 release changelog，而是 AI Agent 工作审计日志。它应记录每一轮 AI Agent 对代码、文档、配置或仓库结构所做的修改，以及做出这些修改的因果链。

   每条记录至少包含：
   - Cause：为什么要做这次修改
   - Changed：实际修改了什么
   - Files：涉及哪些文件
   - Verification：做了哪些验证
   - Notes / Risk：备注、风险或未完成事项

   写入规则：
   - 每次只读取 `AGENTS_CHANGELOGS.md` 前几行，判断顶部日期是否为当天。
   - 如果是当天，把本次记录插入当天标题下方，保持倒序。
   - 如果不是当天，在文件顶部新增当天日期，再插入本次记录。

7. `CODEGUIDE.md` 用来记录代码结构。它应包含：
   - 每个目录的职责
   - 每个重要文件的目的
   - 模块之间如何组合、相互依赖
   - 关键数据流
   - 关键调用链
   - 新增、移动、删除文件后应同步更新

8. 每次任务结束前，Agent 都必须检查以下文件是否需要更新：
   - `AGENTS.md`
   - `AGENTS_CHANGELOGS.md`
   - `CODEGUIDE.md`

9. 如果仓库中已有规范文件，不要覆盖它们。先读取并继承已有约定，再指出是否需要补充。

10. 如果现有文档之间存在冲突，请明确指出：
    - 哪些文件冲突
    - 冲突点是什么
    - 你建议以哪个文件为准
    - 为什么

11. 本轮先只输出讨论稿，不要修改文件。讨论稿确认后，我会再让你初始化 `AGENTS.md`、`AGENTS_CHANGELOGS.md` 和 `CODEGUIDE.md`。
```

## 安全 notes

- 使用前确认当前仓库是否已经有同名治理文件，避免让 Agent 覆盖既有规范。
- 如果仓库包含生产数据库、部署凭据或私有配置，要求 Agent 只做只读调研，写入前必须再次确认。
- Prompt 中的文件名是推荐治理文件名；如果目标仓库已有不同命名，应优先继承当前仓库约定。
