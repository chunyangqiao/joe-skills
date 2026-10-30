# Repository Guidelines

Each installable skill lives in `skills/<name>/` and includes `SKILL.md`, `README.md`, `README.zh-CN.md`, and a copy of the root `LICENSE`. Development tooling stays at the repository root.

## Develop

Run the scripts in `package.json` from the repository root. Skill runtime code uses Node.js built-ins and local modules only, and requires Node.js 22 or newer. Development tooling in this repository requires Node.js 22.22.1 or newer.

An installed skill ships without `package.json` or dependencies. Run its commands from the skill directory, or pass the script's absolute path from elsewhere. Runtime modules resolve resources from `SKILL_ROOT`. Tests resolve repository fixtures from `REPO_ROOT`.

Read that skill's `SKILL.md` before changing how it installs or runs. For Agent Orchestration adapter, routing, or installation changes, also read `skills/agent-orchestration/references/evaluation.md` and `skills/agent-orchestration/docs/hosts/<host>.json`. Preview an installation before writing it, preserve unrelated profiles and local edits to managed files, and resolve a reported conflict before applying.

## Style

Write runtime JavaScript as ESM (`.mjs`) and format with the `format` script.

Agent Orchestration role ids are lowercase kebab-case, matching `skills/agent-orchestration/docs/roles/<role>.md`. Generated profile names start with `crew-`. Keep the role header, the matching host file, and the generator in agreement.

## Tests

Add tests with `node:test` in `tests/*.test.mjs`. Keep filesystem fixtures in temporary directories. When Agent Orchestration behavior changes, follow `skills/agent-orchestration/references/evaluation.md`, and record static tests, live host loading, model selection, and permissions as separate results.

## Commits and pull requests

Use a short imperative summary, optionally prefixed with `feat:`, `fix:`, or `docs:`. Commit messages, pull request descriptions, and explanations describe the change itself, with no co-author trailer and no agent identity.

In a Git checkout, `pnpm prepare` enables the hook in `.husky/pre-commit`.

A pull request states the behavior change, the hosts it affects, test results, and any runtime verification still open. Include a generated-output example when profiles change.

## Configuration

Keep credentials and personal choices outside skill directories. Repository-root `.crew/` is local project configuration and is gitignored.
