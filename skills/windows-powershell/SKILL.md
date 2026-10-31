---
name: windows-powershell
description: >-
  Rewrite shell commands for Windows PowerShell 5.1 and repair parser failures
  caused by bash syntax. Use when the shell is powershell or powershell.exe, when
  a command fails with InvalidEndOfLine, MissingFileSpecification,
  NamedParameterNotFound, ParameterArgumentValidationErrorNullNotAllowed, or
  CommandNotFoundException, and when chaining commands, writing a git commit
  message, calling node -e, Format-Hex, or Node child_process with shell:true
  on Windows.
---

# Windows PowerShell

Cursor runs each shell call as a Windows PowerShell 5.1 script when the host shell is `powershell`. Bash syntax fails while the script is parsing, so later statements in that call do not run. Apply the rules below before issuing a command, and again after any error in [Recognize a failure](#recognize-a-failure).

On Windows, `powershell` means version 5.1 until `$PSVersionTable` shows otherwise. `pwsh` 7 and newer accept `&&` and `||`; the quoting, heredoc, cmdlet, and `cmd.exe` rules still apply.

Confirm once per session when the version is unknown:

```powershell
$PSVersionTable.PSVersion.ToString()
$PSVersionTable.PSEdition
```

`Desktop` with major version 5 is Windows PowerShell 5.1.

## Chain commands

`&&` and `||` produce `InvalidEndOfLine` (不是此版本中的有效语句分隔符). Put each command on its own line. After a command that must succeed, stop on `$LASTEXITCODE`:

```powershell
git add -- README.md
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
git status
```

`git diff` returns 0 when it prints a diff. Chain display commands with separate statements, without an exit-code check:

```powershell
git diff
git diff --staged
```

`|| true` is the same parser error. For a command whose exit code 1 is an expected result:

```powershell
git check-ignore -v package-lock.json
if ($LASTEXITCODE -eq 1) { exit 0 }
exit $LASTEXITCODE
```

## Commit messages

`$(cat <<'EOF' ... EOF)` is not a PowerShell here-string, and `bash -c` fails because `bash` is not on PATH. Pass the message as a single-quoted here-string:

```powershell
git commit -m @'
feat: add the skill

Explain why this change is needed.
'@
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

The body is literal: no variable expansion and no nested quotes to escape.

## Angle brackets

`<` and `>` are redirection. Raw `<` in the script produces `MissingFileSpecification` (重定向运算符后面缺少文件规范) or “`<` 运算符是保留的”. Put the argument in a single-quoted here-string:

```powershell
git commit -m @'
feat: add the filter <pattern> handler
'@
```

If the parser still rejects the brackets, build them without those characters in the source:

```powershell
$lt = [char]60
$gt = [char]62
$subject = "feat: add the filter ${lt}pattern${gt} handler"
git commit -m $subject
```

Do not add a co-author trailer unless the user asked for one.

## Quotes and inline scripts

A double-quoted `node -e` or `python -c` string is still PowerShell source. Backticks disappear, `$(...)` runs as a subexpression, and a leftover word such as `value` is executed (`CommandNotFoundException`, 无法将“value”项识别为 cmdlet).

Write the program to a temporary `.mjs` file, run `node` on that path, and delete the file afterward. A one-line `node -e` is safe only when the code has no backtick, no `$()`, and no nested quotes.

## Node child processes

`shell: true` on Windows starts `cmd.exe` from `ComSpec`, not the current PowerShell. `ls` then fails with `'ls' 不是内部或外部命令` because it is only a PowerShell alias. Passing an argument array with `shell: true` also emits Node `DEP0190`.

Pass one command string and do not set `shell: true`:

```js
import { spawn } from 'node:child_process';

const child = spawn(process.env.ComSpec ?? 'cmd.exe', ['/d', '/s', '/c', 'dir'], {
  shell: false,
  stdio: 'inherit',
});
```

Use `dir` in a `cmd.exe` string. To run PowerShell aliases, set the executable to `powershell.exe` and pass one `-NoProfile -Command` string.

## Cmdlets in 5.1

`Format-Hex -Count` does not exist (`NamedParameterNotFound`, 找不到与参数名称“Count”). Read a prefix in Node, or:

```powershell
Format-Hex -Path file | Select-Object -First 4
```

`Get-ItemProperty -Path $null` throws `ParameterArgumentValidationErrorNullNotAllowed` (无法将参数绑定到参数“Path”，因为该参数是空值). Skip empty paths:

```powershell
foreach ($item in $items) {
  if (-not $item.PSPath) { continue }
  Get-ItemProperty -Path $item.PSPath
}
```

## Unix commands

| Bash | Windows PowerShell 5.1 |
| --- | --- |
| `export NAME=value` | `$env:NAME = 'value'` |
| `cmd >/dev/null` | `cmd > $null` |
| `ls -la` | `Get-ChildItem` |
| `grep pattern` | `Select-String -Pattern 'pattern'` |
| `head` / `tail` | `Select-Object -First` / `-Last` |
| `which name` | `Get-Command name -ErrorAction SilentlyContinue` |

## Missing programs

`CommandNotFoundException` for `pnpm`, `gh`, `py`, or `bash` means that executable is absent from PATH.

- `pnpm`: run `corepack pnpm` when `Get-Command corepack` succeeds. Leave the package manager uninstalled unless the user asked to install it.
- `gh`, `py`, and `bash`: stop and name the missing program. Do not route the task through another tool unless the user asked.

## Recognize a failure

Rewrite the command once, using the matching row, and run the rewritten command. Do not repeat the original syntax.

| Output | Fix |
| --- | --- |
| `InvalidEndOfLine`, 不是此版本中的有效语句分隔符 | [Chain commands](#chain-commands) |
| `MissingFileSpecification`, 运算符是保留 | [Angle brackets](#angle-brackets) or [Commit messages](#commit-messages) |
| `CommandNotFoundException` for `bash`, or a `<<'EOF'` heredoc | [Commit messages](#commit-messages) |
| `NamedParameterNotFound` on `Format-Hex` | [Cmdlets in 5.1](#cmdlets-in-51) |
| `ParameterArgumentValidationErrorNullNotAllowed` | [Cmdlets in 5.1](#cmdlets-in-51) |
| `CommandNotFoundException` for `pnpm`, `gh`, or `py` | [Missing programs](#missing-programs) |
| 不是内部或外部命令, `DEP0190` | [Node child processes](#node-child-processes) |
| 无法将“…”项识别为 cmdlet after `node -e` or SQL | [Quotes and inline scripts](#quotes-and-inline-scripts) |
