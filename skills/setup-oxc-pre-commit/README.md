# Setup Oxc Pre-Commit

**English** | [简体中文](README.zh-CN.md)

Configure Oxfmt formatting and Oxlint static analysis for a JavaScript or TypeScript repository, then run both from a Husky pre-commit hook through lint-staged. Staged files are fixed automatically. Lint errors that cannot be fixed stop the commit.

## What this configures

- **Oxfmt** for formatting.
- **Oxlint** for static analysis.
- **lint-staged** so `oxlint --fix` runs before `oxfmt --write` on staged JavaScript and TypeScript, and Oxfmt formats other supported files.
- **Husky** `pre-commit` hook that runs lint-staged. Existing `typecheck` and `test` scripts can be appended when you ask for them.

## Requirements

- Node.js **22.22.1** or newer.
- Git **2.32.0** or newer.

## Use the skill

Copy this directory through your host's skill installation mechanism and keep the directory name `setup-oxc-pre-commit`. Ask the agent to follow [SKILL.md](SKILL.md).

```text
Use $setup-oxc-pre-commit to configure Oxfmt, Oxlint, Husky, and lint-staged
in this repository. Read SKILL.md and follow it. Inspect the project first,
ask once for anything still unresolved, and do not create a commit.
```

## Safety

- Do not create a commit, push, switch branches, or rewrite history. Leave committing to the person using the repository.
- Do not overwrite existing configs, hooks, or `package.json` scripts. Merge them, or ask before changing behavior.
- Do not format or auto-fix the whole repository unless that was explicitly approved.

The step-by-step procedure, package-manager commands, and verification checks are in [SKILL.md](SKILL.md).
