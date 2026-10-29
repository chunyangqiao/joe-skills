# Joe Skills

**English** | [简体中文](README.zh-CN.md)

**Version: 1.0.1**

A personal collection of agent skills.

## Skills

| Skill | Description |
| --- | --- |
| [agent-orchestration](skills/agent-orchestration/README.md) | Portable multi-agent orchestration for Codex, Claude Code, Kimi Code, and Cursor. |
| [setup-oxc-pre-commit](skills/setup-oxc-pre-commit/README.md) | Configure Oxfmt, Oxlint, Husky, and lint-staged so JavaScript and TypeScript commits format and lint staged files. |

## Install a skill

Copy the chosen `skills/<name>/` directory through your host's skill installation mechanism. Keep that directory name, then follow the README in the skill directory.

## Development

The repository separates installable skills from development tooling:

```text
skills/agent-orchestration/   # Complete installable skill
  README.md                   # English skill guide
  README.zh-CN.md             # Chinese skill guide
  SKILL.md                    # Coordination workflow
  scripts/                    # Configuration CLI and runtime modules
  docs/                       # Role duties and host facts
  references/                 # Evaluation and interactive testing
  agents/openai.yaml          # Skill UI metadata
  LICENSE                     # License included with the skill
skills/setup-oxc-pre-commit/  # Oxc formatting, linting, and pre-commit setup skill
  README.md                   # English skill guide
  README.zh-CN.md             # Chinese skill guide
  SKILL.md                    # Setup workflow
  agents/openai.yaml          # Skill UI metadata
  LICENSE                     # License included with the skill
tests/                        # Repository tests and legacy fixtures
package.json                  # Development tools and repository shortcuts
```

The root README describes this collection. Each skill includes `README.md` and `README.zh-CN.md`. Contribution guidelines, the root license, and development configuration stay at the repository root. A skill directory works independently of the checkout and contains no development package or test suite.

Development tooling requires **Node.js 22.22.1+** and the pnpm version declared in `package.json`. Run these commands from the repository root:

```bash
pnpm install --frozen-lockfile
pnpm format:check
pnpm test
```

Use `pnpm format` to format `.mjs`, JSON, and YAML files with LF line endings. Use `pnpm lint-staged` to format the same types when they are staged. The lockfile and legacy fixtures are excluded. In a Git checkout, `pnpm prepare` enables the Husky pre-commit hook, which runs `pnpm lint-staged` followed by `pnpm test`.

Tests cover configuration validation, profile generation, bootstrap previews and post-install checks, installation conflicts, idempotency, rollback, and rejection of captured schema 1 fixtures. Runtime commands are also exercised without development dependencies. See [evaluation](skills/agent-orchestration/references/evaluation.md) for live host acceptance checks and [AGENTS.md](AGENTS.md) for contribution guidelines.

### Configuration shortcuts

Run these scripts from the repository root using the pnpm version declared in `package.json`. Configuration commands do not require `pnpm install`. Arguments after the script name are forwarded to the CLI; no extra `--` separator is needed with `pnpm run`.

In an installed Agent Orchestration directory, use `node scripts/configure.mjs <command>` instead. Behavior, hosts, and presets are documented in [agent-orchestration](skills/agent-orchestration/README.md).

| Command | Purpose |
| --- | --- |
| `pnpm run configure --help` | Show CLI commands and options |
| `pnpm run configure:bootstrap` | Preview configuration and profiles; add `--apply` to save, install, and check |
| `pnpm run configure:init` | Create a source configuration; refuses an existing file |
| `pnpm run configure:render` | Display generated profiles without installing them |
| `pnpm run configure:install` | Preview profile changes; add `--apply` to write them |
| `pnpm run configure:check` | Compare installed profiles with the source configuration |

The repository entrypoint is `node skills/agent-orchestration/scripts/configure.mjs <command>`.
