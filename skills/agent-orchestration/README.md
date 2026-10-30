# Agent Orchestration

**English** | [简体中文](README.zh-CN.md)

A portable multi-agent orchestration skill for Codex, Claude Code, Kimi Code, and Cursor, with configurable roles and models.

Use focused subagents for exploration, research, implementation, browser work, and independent review. The main agent keeps responsibility for task scope, architecture, integration, and final acceptance. Explicit invocation with a concrete task requires at least one real subagent; implicit use remains conditional on the benefit of delegation.

## Features

- Seven shared roles with host-specific native profiles.
- Configurable role selection, models, host reasoning levels, and a cap on active children.
- AI-driven installation and a non-interactive bootstrap command.
- Installation previews, conflict detection, and repeatable updates that preserve unrelated profiles and locally edited managed files.

The host runs the agents and controls their permissions. This skill provides coordination instructions and profile generation; model authentication and tool access are configured in the host.

## Hosts

| Host | Generated profiles | Model selection |
| --- | --- | --- |
| [Codex](docs/hosts/codex.json) | TOML | Source `model` and `strength`; native fields come from the host file |
| [Claude Code](docs/hosts/claude-code.json) | Markdown with YAML frontmatter | Source `model` and `strength`; native fields come from the host file |
| [Kimi Code](docs/hosts/kimi-code.json) | Markdown with YAML frontmatter | Source API id and `strength`; the dispatch card carries the pool alias |
| [Cursor](docs/hosts/cursor.json) | Markdown with YAML frontmatter | Source model id and `strength`; the profile stores the encoded model string; the dispatch card's `spawn` is the Task slug |

User scope writes profiles to `~/.codex/agents`, `~/.claude/agents`, `~/.kimi-code/agents`, or `~/.cursor/agents`. `CODEX_HOME`, `CLAUDE_CONFIG_DIR`, and `KIMI_CODE_HOME` replace `~/.codex`, `~/.claude`, and `~/.kimi-code` when set. Profiles stay in the `agents` directory under the selected base. Cursor has no equivalent variable. Project scope writes `<root>/.codex/agents`, `<root>/.claude/agents`, `<root>/.kimi-code/agents`, or `<root>/.cursor/agents`. On Codex, a project installation replaces the user installation as a whole.

Kimi support targets Markdown agents. Older YAML agent files from kimi-cli are a different format. Model availability, browser tools, permissions, and profile discovery depend on the installed host. Verify them in a live session after configuration.

## Quick start

### Install with an AI agent

Give your agent this skill directory, or the repository path that contains it, and this request:

```text
Install Agent Orchestration from this skill for my current agent host.
Read SKILL.md and follow its installation requests.
Inspect existing choices and ask once for unresolved scope, roles, and each
role's model and thinking strength, showing the default roles and concurrency.
Then deploy the complete skill, preview and apply the profiles, and verify
the installation. Report skill deployment, static profile checks, and live
subagent verification separately; if live verification is blocked, give the
exact next step.
```

The agent completes the authorized installation using the non-interactive CLI. It should not stop after copying the skill folder. See [SKILL.md](SKILL.md) for the installation requests.

The configuration CLI requires **Node.js 22+**; Node.js 24 LTS is recommended. Runtime commands need no package installation or build step.

### Manual installation

Deploy this directory through your host's skill installation mechanism. Keep its directory name as `agent-orchestration` and include its README files, scripts, docs, references, metadata, and license. From the installed skill directory, preview and apply a configuration:

```bash
node --version
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit --apply
```

The installed skill needs only Node.js. There is no `package.json` and no dependency installation. From another working directory, use the absolute path to `scripts/configure.mjs`. Ask the host's agent to collect model and thinking-strength choices in conversation when you do not want the preset. Saved configurations remain outside the skill directory. Static success still requires a live host probe.

Making the skill discoverable and installing its agent profiles are both required.

### Use the skill

After the host discovers the skill and installed profiles, invoke it with a bounded task, for example:

```text
Use $agent-orchestration to implement this feature. Delegate bounded work to
at least one real subagent, preserve existing behavior, and verify the result.
```

Start a fresh session if the host has not loaded the profiles yet. Confirm the selected models and available tools with a small task before relying on a new setup.
Invoking the skill alone does not start subagents: provide a concrete task. With an explicit invocation and a concrete task, the coordinator must dispatch at least one real child and use its result, even for a small task. The main agent plus one child is sufficient; concurrency is optional. If the host, profiles, or required capabilities prevent delegation, the coordinator reports the exact limitation and unmet requirement while completing feasible authorized work. These are workflow instructions, not a host-enforced scheduler.

## Bootstrap profiles

Run these commands from the installed skill directory. This example previews a Codex user installation, then saves a new configuration if needed, installs profiles, and checks the installed files:

```bash
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit
node scripts/configure.mjs bootstrap --host codex --scope user --config ~/.config/crew/codex.json --preset inherit --apply

# Optional independent recheck later:
node scripts/configure.mjs check --config ~/.config/crew/codex.json --scope user
```

- Use `claude-code`, `kimi-code`, or `cursor` with a separate configuration for those hosts.
- For a project installation, use `--scope project --root /path/to/project` on both `bootstrap` and `check`.
- New configurations enable all seven roles, set `max_parallel` to 3, and set each role's `model` to `inherit`. `max_parallel` counts active children and does not include the main agent. After you confirm model access, `--preset recommended` selects the bundled choices for Codex, Kimi, and Cursor. Claude Code has no recommended preset. When a Kimi role names a model and a strength, the JSON result includes `host_setup` for a manual merge into the host config. `inherit` omits `host_setup`. Cursor profiles store the encoded model string defined by [docs/hosts/cursor.json](docs/hosts/cursor.json). Some models, including `composer-2.5`, take no strength.
- Existing configurations are reused unchanged; `--preset` only affects creation. For custom models, a role subset, or `max_parallel`, ask the agent to write a schema 2 source file, or edit one yourself, then bootstrap it.
- Preview creates no files or directories. `--apply` writes only the source configuration and managed profiles. Keep the source outside the skill and managed Agent directories. Bootstrap does not copy the skill itself.
- The JSON result identifies configuration creation/reuse and static check status. `runtime_verified: false` means live host loading and execution still need verification, even after static checks pass.

### Codex recommended models

The `--preset recommended` choices below were checked on **2026-10-29**. The default preset remains `inherit`; existing source configurations are reused unchanged.

| Role | Model | Strength |
| --- | --- | --- |
| explorer | `gpt-6-luna` | `high` |
| docs-researcher | `gpt-6-luna` | `high` |
| browser-debugger | `gpt-6.1-terra` | `medium` |
| executor | `gpt-6.1-terra` | `medium` |
| ui-styler | `gpt-6.1-terra` | `medium` |
| implementer | `gpt-6.1-sol` | `high` |
| reviewer | `gpt-6-astra` | `high` |

This project maps the official model guidance to its roles: Luna for focused discovery and source verification, Terra for visual work, computer use, and localized implementation, Sol for complex implementation, and Astra for review requiring judgment. The role mappings and strengths are project recommendations based on the [API model catalog](https://developers.openai.com/api/docs/models), [model selection guide](https://developers.openai.com/api/docs/guides/model-selection), and [Codex model documentation](https://developers.openai.com/codex/models). They have not been validated through same-task model comparisons.

GPT-6.1 Terra requires **Codex CLI 0.159.0+**. Confirm that your account and client expose the selected models, and verify the generated profiles in a live session. Static checks establish generation and installation only.

### Commands

Run these from the installed skill directory. From another working directory, use the absolute path to `scripts/configure.mjs`.

| Command | Purpose |
| --- | --- |
| `node scripts/configure.mjs --help` | Show CLI commands and options |
| `node scripts/configure.mjs bootstrap` | Preview configuration and profiles; add `--apply` to save, install, and check |
| `node scripts/configure.mjs init` | Create a source configuration; refuses an existing file |
| `node scripts/configure.mjs render` | Display generated profiles without installing them |
| `node scripts/configure.mjs install` | Preview profile changes; add `--apply` to write them |
| `node scripts/configure.mjs check` | Compare installed profiles with the source configuration |

For separate initialization and installation steps, use a new configuration path:

```bash
node scripts/configure.mjs init --host codex --config ~/.config/crew/codex.json --preset inherit
node scripts/configure.mjs render --config ~/.config/crew/codex.json
node scripts/configure.mjs install --config ~/.config/crew/codex.json --scope user
node scripts/configure.mjs install --config ~/.config/crew/codex.json --scope user --apply
node scripts/configure.mjs check --config ~/.config/crew/codex.json --scope user
```

After editing a saved configuration, repeat the render, preview, apply, and check steps. A successful check verifies installed files, not live host loading or execution. Project and user scopes are complete alternatives and are not merged.

In the source repository, `pnpm run configure <command>` from the repository root forwards to this CLI. Those shortcuts are listed in [AGENTS.md](../../AGENTS.md#build-test-and-development-commands).

Agent Orchestration was previously named Crew. Existing `crew-*` profile and model alias names, state files, and configuration paths are retained for installation compatibility. Role duties live in [docs/roles](docs/roles). Host links, limits, and recommended pins live in [docs/hosts](docs/hosts).

## Roles and coordination

The available roles are `explorer`, `docs-researcher`, `browser-debugger`, `executor`, `ui-styler`, `implementer`, and `reviewer`. Enable only the roles you need and configure their models independently.

The coordinator assigns bounded work with explicit ownership and acceptance checks, integrates returned results, and keeps unresolved decisions in the main conversation. Coupled implementation stays with one writer. See [SKILL.md](SKILL.md) for invocation rules, role selection, and the full workflow.

## Reference

- [Coordination workflow](SKILL.md)
- [Host facts](docs/hosts)
- [Role duties](docs/roles)
- [Host acceptance and evaluation](references/evaluation.md)
- [Interactive testing](references/interactive-testing.md)
