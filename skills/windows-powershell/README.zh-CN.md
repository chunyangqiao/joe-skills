# Windows PowerShell

[English](README.md) | **简体中文**

把 shell 命令改写成 Windows PowerShell 5.1 能解析的形式。bash 运算符、heredoc，以及少数更高版本才有的 cmdlet，会在程序启动前就失败。

## 覆盖的问题

- 用独立语句和 `$LASTEXITCODE` 替换 `&&` 和 `||`。
- 用 PowerShell here-string 传递提交说明。
- 不让 `<` 和 `>` 进入脚本解析器。
- 避免把会被 PowerShell 拆开的 `node -e` 或 SQL 内联进命令。
- 在 Windows 上调用 Node 子进程时不使用 `shell: true`。
- 按 5.1 的实际参数使用 `Format-Hex` 和 `Get-ItemProperty`。
- 把缺失的 `pnpm`、`gh`、`py`、`bash` 和语法错误区分开。

## 使用技能

通过宿主的技能安装机制复制本目录，并保留目录名 `windows-powershell`。让智能体按 [SKILL.md](SKILL.md) 执行。

```text
在 Windows 上执行 shell 命令时使用 $windows-powershell。阅读 SKILL.md 并按其执行。
按 PowerShell 5.1 书写，不要使用 bash 语法。命令若在解析阶段失败，只改写一次再执行。
```

替换写法和对应的报错原文见 [SKILL.md](SKILL.md)。
