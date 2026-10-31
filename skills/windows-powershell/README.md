# Windows PowerShell

**English** | [简体中文](README.zh-CN.md)

Rewrite shell commands so they parse in Windows PowerShell 5.1. Bash operators, heredocs, and a few newer cmdlets fail before the program runs.

## What this covers

- Replacing `&&` and `||` with separate statements and `$LASTEXITCODE`.
- Passing commit messages with a PowerShell here-string.
- Keeping `<` and `>` out of the script parser.
- Avoiding inline `node -e` or SQL that PowerShell splits apart.
- Calling Node child processes without `shell: true` on Windows.
- Using `Format-Hex` and `Get-ItemProperty` as they exist in 5.1.
- Telling a missing `pnpm`, `gh`, `py`, or `bash` apart from a parser error.

## Use the skill

Copy this directory through your host's skill installation mechanism and keep the directory name `windows-powershell`. Ask the agent to follow [SKILL.md](SKILL.md).

```text
Use $windows-powershell for shell commands on Windows. Read SKILL.md and follow it.
Write PowerShell 5.1. Do not use bash syntax. If a command fails to parse, rewrite it once.
```

The replacements and the error strings they match are in [SKILL.md](SKILL.md).
