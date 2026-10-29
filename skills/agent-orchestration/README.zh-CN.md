# Agent Orchestration

[English](README.md) | **简体中文**

面向 Codex、Claude Code、Kimi Code 和 Cursor 的可移植多智能体编排技能，支持自定义角色和模型。

使用职责明确的子智能体完成代码探索、资料研究、实现、浏览器操作和独立审查。主智能体负责控制任务范围、架构设计、结果集成和最终验收。显式调用并提供具体任务时，必须派发至少一个真实子智能体；隐式采用时，仍按委派收益决定是否派发。

## 功能

- 七种共享角色，为不同宿主生成原生配置。
- 可配置启用的角色、模型、宿主支持的推理强度，以及同时运行的子智能体上限。
- 支持由 AI 智能体在对话中完成安装，以及非交互式引导命令。
- 支持安装预览、冲突检测和可重复更新，保留无关配置及本地修改过的托管文件。

智能体由宿主运行，权限也由宿主管理。本技能提供协调指令和角色配置生成能力；模型认证和工具访问需在宿主中配置。

## 支持的宿主

| 宿主 | 生成的配置格式 | 模型选择方式 |
| --- | --- | --- |
| [Codex](docs/hosts/codex.json) | TOML | 源文件写 `model` 和 `strength`，原生字段来自宿主文件 |
| [Claude Code](docs/hosts/claude-code.json) | 带 YAML frontmatter 的 Markdown | 源文件写 `model` 和 `strength`，原生字段来自宿主文件 |
| [Kimi Code](docs/hosts/kimi-code.json) | 带 YAML frontmatter 的 Markdown | 源文件写 API 模型名和 `strength`，派发卡携带模型池别名 |
| [Cursor](docs/hosts/cursor.json) | 带 YAML frontmatter 的 Markdown | 源文件写模型名和 `strength`，角色文件保存编码后的模型字符串，派发卡的 `spawn` 是 Task slug |

用户级安装把角色配置写入 `~/.codex/agents`、`~/.claude/agents`、`~/.kimi-code/agents` 或 `~/.cursor/agents`。设置了 `CODEX_HOME`、`CLAUDE_CONFIG_DIR` 或 `KIMI_CODE_HOME` 时，该变量分别替代 `~/.codex`、`~/.claude` 和 `~/.kimi-code`。角色配置仍在其下的 `agents` 目录中。Cursor 没有对应的环境变量。项目级安装写入 `<root>/.codex/agents`、`<root>/.claude/agents`、`<root>/.kimi-code/agents` 或 `<root>/.cursor/agents`。在 Codex 上，项目级安装会整体替换用户级安装。

Kimi 以 Markdown Agent 为目标。kimi-cli 的旧版 YAML Agent 文件是另一种格式。模型可用性、浏览器工具、权限及配置发现取决于已安装的宿主。完成配置后，请在实际会话中验证。

## 快速开始

### 让 AI 智能体安装

把本技能目录，或包含它的仓库路径，提供给智能体，并发送以下请求：

```text
请从这个技能为我当前使用的智能体宿主安装 Agent Orchestration。
阅读 SKILL.md，并按其安装请求操作。
检查已有配置，展示默认角色和并发数，并一次性询问尚未确定的安装范围、
角色，以及每个角色的模型和思考强度。
然后部署完整技能，预览并应用角色配置，验证安装结果。
分别报告技能部署、配置静态检查和子智能体实际运行验证的结果；
如果实际运行验证受阻，请给出明确的下一步操作。
```

智能体使用非交互式 CLI 完成已授权的安装，不应只复制技能目录就结束。完整流程见 [SKILL.md](SKILL.md)。

配置 CLI 要求 **Node.js 22+**，推荐使用 Node.js 24 LTS。运行命令无需安装依赖或执行构建。

### 手动安装

通过宿主的技能安装机制部署本目录。保留目录名 `agent-orchestration`，包含其中的 README、脚本、文档、参考资料、元数据和许可证。在已安装的技能目录中预览并应用配置：

```bash
node --version
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit --apply
```

已安装的技能只需要 Node.js，没有 `package.json`，也不需要安装依赖。在其他工作目录中执行时，使用 `scripts/configure.mjs` 的绝对路径。如果不想使用预设，让当前宿主里的智能体在对话中收集每个角色的模型和思考强度。保存的配置位于技能目录之外。静态检查通过后仍需验证宿主实际运行。

让宿主发现技能和安装智能体角色配置，这两步都必须完成。

### 使用技能

宿主发现技能和已安装的角色配置后，可以用范围明确的任务调用它，例如：

```text
使用 $agent-orchestration 实现这个功能。将范围明确的工作委派给至少一个
真实子智能体，保留现有行为，并验证结果。
```

如果宿主尚未加载角色配置，请新建会话。在依赖新配置开展工作前，先用一个小任务确认所选模型和可用工具。
仅调用技能不会启动子智能体，还需要提供具体任务。显式调用并提供具体任务后，协调者必须派发至少一个真实子智能体并采用其结果，小型任务也不例外。主智能体加一个子智能体即可满足要求，不强制并行。如果宿主、角色配置或所需能力导致无法派发，协调者应明确报告限制和未满足的要求，同时完成可行且已获授权的工作。这是工作流程指令，并非宿主强制执行的调度器。

## 引导安装角色配置

在已安装的技能目录中运行这些命令。以下示例先预览 Codex 用户级安装，再按需保存新配置、安装角色配置并检查已安装文件：

```bash
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit --apply

# 可选：稍后单独复查
node scripts/configure.mjs check --config ~/.config/crew/codex.json --scope user
```

- 其他宿主使用 `claude-code`、`kimi-code` 或 `cursor`，并分别保存独立配置。
- 项目级安装需在 `bootstrap` 和 `check` 命令中同时使用 `--scope project --root /path/to/project`。
- 新配置默认启用全部七种角色，将 `max_parallel` 设为 3，并把每个角色的 `model` 设为 `inherit`。`max_parallel` 只计算正在运行的子智能体，不含主智能体。确认模型访问权限后，`--preset recommended` 会选用 Codex、Kimi 和 Cursor 的内置方案。Claude Code 没有 recommended 预设。当 Kimi 角色写了模型和思考强度时，JSON 结果包含 `host_setup`，需要手动合并进宿主配置。`inherit` 不会输出 `host_setup`。Cursor 的角色文件保存编码后的模型字符串，编码规则见 [docs/hosts/cursor.json](docs/hosts/cursor.json)。有些模型不接受思考强度，例如 `composer-2.5`。
- 已有配置会原样复用；`--preset` 仅在创建配置时生效。如需自定义模型、角色子集或 `max_parallel`，让智能体写一份 schema 2 源文件，或自行编辑后再执行引导安装。
- 预览不会创建文件或目录。`--apply` 只写入源配置和托管的角色配置。源配置应保存在技能目录及托管 Agent 目录之外。引导命令不会复制技能本身。
- JSON 结果会标明配置是新建还是复用，以及静态检查状态。`runtime_verified: false` 表示仍需验证宿主是否实际加载并执行配置，即使静态检查已经通过。

### Codex 推荐模型

以下 `--preset recommended` 方案的核对日期为 **2026-10-29**。默认预设仍为 `inherit`；已有源配置会原样复用。

| 角色 | 模型 | 思考强度 |
| --- | --- | --- |
| explorer | `gpt-6-luna` | `high` |
| docs-researcher | `gpt-6-luna` | `high` |
| browser-debugger | `gpt-6.1-terra` | `medium` |
| executor | `gpt-6.1-terra` | `medium` |
| ui-styler | `gpt-6.1-terra` | `medium` |
| implementer | `gpt-6.1-sol` | `high` |
| reviewer | `gpt-6-astra` | `high` |

本项目按官方模型定位分配角色：Luna 用于聚焦探索和来源查证，Terra 用于视觉操作、计算机操作和局部实现，Sol 用于复杂实现，Astra 用于需要判断力的审查。角色映射和思考强度是本项目依据[API 模型目录](https://developers.openai.com/api/docs/models)、[模型选择指南](https://developers.openai.com/api/docs/guides/model-selection)及[Codex 模型文档](https://developers.openai.com/codex/models)作出的推荐，尚未经同任务模型对比验证。

GPT-6.1 Terra 要求 **Codex CLI 0.159.0+**。请确认账号和客户端提供所选模型，并在实际会话中验证生成的角色配置。静态检查仅验证生成和安装结果。

### 命令

在已安装的技能目录中运行。在其他工作目录中执行时，使用 `scripts/configure.mjs` 的绝对路径。

| 命令 | 用途 |
| --- | --- |
| `node scripts/configure.mjs --help` | 查看 CLI 命令和选项 |
| `node scripts/configure.mjs bootstrap` | 预览配置和角色文件；添加 `--apply` 后保存、安装并检查 |
| `node scripts/configure.mjs init` | 创建源配置；目标文件已存在时拒绝写入 |
| `node scripts/configure.mjs render` | 展示生成的角色配置，不执行安装 |
| `node scripts/configure.mjs install` | 预览角色配置变更；添加 `--apply` 后写入 |
| `node scripts/configure.mjs check` | 对比已安装的角色配置与源配置 |

如需分步初始化和安装，请使用新的配置路径：

```bash
node scripts/configure.mjs init --host codex --config ~/.config/crew/codex.json --preset inherit
node scripts/configure.mjs render --config ~/.config/crew/codex.json
node scripts/configure.mjs install --config ~/.config/crew/codex.json --scope user
node scripts/configure.mjs install --config ~/.config/crew/codex.json --scope user --apply
node scripts/configure.mjs check --config ~/.config/crew/codex.json --scope user
```

编辑已保存的配置后，重新执行生成、预览、应用和检查步骤。检查成功仅验证已安装文件，不代表宿主已实际加载或执行配置。项目级和个人级配置是完整的替代关系，不会合并。

在源码仓库中，仓库根目录的 `pnpm run configure:*` 会转发到这个 CLI。这些快捷命令列在[仓库 README](../../README.zh-CN.md#配置快捷命令)。

Agent Orchestration 的旧名称为 Crew。为保持安装兼容性，现有的 `crew-*` 角色配置名、模型别名、状态文件和配置路径继续保留。角色职责在 [docs/roles](docs/roles)。宿主链接、限制和推荐模型在 [docs/hosts](docs/hosts)。

## 角色与协作

可用角色包括 `explorer`、`docs-researcher`、`browser-debugger`、`executor`、`ui-styler`、`implementer` 和 `reviewer`。按需启用角色，并为各角色独立配置模型。

协调者分配范围明确的工作，指定责任归属和验收检查，集成返回结果，并将尚未解决的决策保留在主会话中。紧密耦合的实现交给同一个执行者。调用规则、角色选择和完整工作流程见 [SKILL.md](SKILL.md)。

## 参考文档

- [协作工作流程](SKILL.md)
- [宿主事实](docs/hosts)
- [角色职责](docs/roles)
- [宿主验收与评估](references/evaluation.md)
- [交互式测试](references/interactive-testing.md)
