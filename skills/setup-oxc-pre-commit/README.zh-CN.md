# Setup Oxc Pre-Commit

[English](README.md) | **简体中文**

为 JavaScript 或 TypeScript 仓库配置 Oxfmt 格式化与 Oxlint 静态检查，并通过 lint-staged 接到 Husky 的 pre-commit 钩子。暂存文件会自动修复。无法修复的静态检查错误会阻止本次提交。

## 会配置的内容

- **Oxfmt**：代码格式化。
- **Oxlint**：静态检查。
- **lint-staged**：对暂存的 JavaScript 和 TypeScript 先执行 `oxlint --fix`，再执行 `oxfmt --write`；其他支持的文件由 Oxfmt 格式化。
- **Husky** 的 `pre-commit` 钩子，用于运行 lint-staged。如果你要求，也可以在其后追加项目里已有的 `typecheck` 和 `test` 脚本。

## 要求

- Node.js **22.22.1** 或更新版本。
- Git **2.32.0** 或更新版本。

## 使用技能

通过宿主的技能安装机制复制本目录，并保留目录名 `setup-oxc-pre-commit`。让智能体按 [SKILL.md](SKILL.md) 执行。

```text
使用 $setup-oxc-pre-commit 在这个仓库中配置 Oxfmt、Oxlint、Husky 和 lint-staged。
阅读 SKILL.md 并按其执行。先检查项目，尚未确定的选择一次性询问，不要创建提交。
```

## 安全约束

- 不要创建提交、推送、切换分支或改写历史。提交留给使用仓库的人。
- 不要覆盖已有配置、钩子或 `package.json` 脚本。需要合并，或在改变行为前先询问。
- 未经明确同意，不要格式化或自动修复整个仓库。

分步流程、各包管理器命令和验证检查见 [SKILL.md](SKILL.md)。
