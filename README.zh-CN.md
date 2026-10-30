# Joe Skills

[English](README.md) | **简体中文**

**版本：1.0.1**

个人使用的 agent skill 集合。

## 技能

| 技能 | 说明 |
| --- | --- |
| [agent-orchestration](skills/agent-orchestration/README.zh-CN.md) | 面向 Codex、Claude Code、Kimi Code 和 Cursor 的可移植多智能体编排技能。 |
| [setup-oxc-pre-commit](skills/setup-oxc-pre-commit/README.zh-CN.md) | 为 JavaScript / TypeScript 配置 Oxfmt、Oxlint、Husky 和 lint-staged，使提交时格式化并检查暂存文件。 |

## 安装技能

通过宿主的技能安装机制复制需要的 `skills/<name>/` 目录。保留该目录名，然后按技能目录中的 README 操作。

## 开发

仓库将可安装技能与开发工具分开：

```text
skills/agent-orchestration/   # 完整的可安装技能
  README.md                   # 英文技能说明
  README.zh-CN.md             # 中文技能说明
  SKILL.md                    # 协作工作流程
  scripts/                    # 配置 CLI 和运行时模块
  docs/                       # 角色职责和宿主事实
  references/                 # 评估和交互式测试
  agents/openai.yaml          # 技能 UI 元数据
  LICENSE                     # 随技能分发的许可证
skills/setup-oxc-pre-commit/  # Oxc 格式化、静态检查与提交前校验技能
  README.md                   # 英文技能说明
  README.zh-CN.md             # 中文技能说明
  SKILL.md                    # 配置工作流程
  agents/openai.yaml          # 技能 UI 元数据
  LICENSE                     # 随技能分发的许可证
tests/                        # 仓库测试和旧版夹具
package.json                  # 开发工具和仓库快捷命令
```

根 README 描述这个集合。每个技能自带 `README.md` 和 `README.zh-CN.md`。贡献指南、根目录许可证和开发配置保留在仓库根目录。技能目录可脱离源码仓库独立运行，不包含开发包配置或测试套件。

开发工具要求 **Node.js 22.22.1+**，并使用 `package.json` 声明的 pnpm 版本。在仓库根目录执行：

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm test
```

使用 `pnpm format` 以 LF 换行格式化 `.mjs`、JSON 和 YAML 文件。使用 `pnpm lint-staged` 格式化暂存的同类文件。锁文件和旧版测试夹具排除在外。在 Git 检出目录中，`pnpm prepare` 会启用 Husky 的 pre-commit 钩子，依次执行 `pnpm lint-staged` 和 `pnpm test`。

测试覆盖配置校验、角色配置生成、引导安装预览及安装后检查、安装冲突、幂等性、回滚，以及拒绝已保存的 schema 1 夹具。测试也会验证不依赖开发依赖的运行命令。宿主实际运行验收见[评估文档](skills/agent-orchestration/references/evaluation.md)，贡献指南见 [AGENTS.md](AGENTS.md)。

### 配置快捷命令

在仓库根目录运行以下脚本，使用 `package.json` 声明的 pnpm 版本。配置命令无需先执行 `pnpm install`。脚本名之后的参数会转发给 CLI；使用 `pnpm run` 时无需额外添加 `--` 分隔符。

在已安装的 Agent Orchestration 目录中，改用 `node scripts/configure.mjs <command>`。行为、宿主和预设见 [agent-orchestration](skills/agent-orchestration/README.zh-CN.md)。

| 命令 | 用途 |
| --- | --- |
| `pnpm run configure --help` | 查看 CLI 命令和选项 |
| `pnpm run configure bootstrap` | 预览配置和角色文件；添加 `--apply` 后保存、安装并检查 |
| `pnpm run configure init` | 创建源配置；目标文件已存在时拒绝写入 |
| `pnpm run configure render` | 展示生成的角色配置，不执行安装 |
| `pnpm run configure install` | 预览角色配置变更；添加 `--apply` 后写入 |
| `pnpm run configure check` | 对比已安装的角色配置与源配置 |

仓库中的 Node 入口为 `node skills/agent-orchestration/scripts/configure.mjs <command>`。
