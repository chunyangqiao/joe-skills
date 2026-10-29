---
name: setup-oxc-pre-commit
description: Configure Oxfmt, Oxlint, Husky, and lint-staged so JavaScript and TypeScript commits format and lint staged files. Use when the user asks to set up Prettier, ESLint, Biome, Husky, lint-staged, Oxfmt, Oxlint, pre-commit checks, formatting, or static analysis.
---

# Setup Oxc Pre-Commit

Configure Oxfmt formatting and Oxlint static analysis for a JavaScript / TypeScript repository, then wire both into Husky and lint-staged so every commit formats and checks the files being committed. Staged files are fixed automatically; unfixable lint errors abort the commit.

## What This Sets Up

- **Oxfmt** configuration, scripts, and ignore rules for automatic formatting.
- **Oxlint** configuration, scripts, and stack-appropriate plugins for static analysis.
- **lint-staged** tasks that run `oxlint --fix` then `oxfmt --write` on staged JS/TS files, and `oxfmt --write` on other supported files.
- **Husky** `pre-commit` hook that runs lint-staged, optionally followed by existing `typecheck` and `test` scripts.
- Optional migration from Prettier, Biome formatter options, and ESLint flat config.

## Safety Rules

- Never run `git commit`, `git push`, switch branches, or rewrite history. Leave committing to the user.
- Never overwrite existing configs, hooks, or `package.json` scripts. Merge them, or ask before changing behavior.
- Never delete Prettier, Biome, or ESLint configs or dependencies until the migration is verified.
- Never run repository-wide auto-fixes without explicit approval; they can rewrite many files.
- Never use `oxlint --fix-dangerously`, skip hooks, or bypass checks to make a commit pass.
- Keep changes limited to formatting, linting, and commit hooks.

## 1. Inspect

Record what already exists before changing anything:

- Git repository and `package.json` at the project root.
- Git version (`git --version`): require **2.32.0 or newer** (lint-staged 17 requirement). Stop and ask the user to upgrade if older.
- Node.js version (`node -v`): require **22.22.1 or newer** (lint-staged 17 requirement). Stop and ask the user to upgrade if older; never downgrade dependencies or skip the hook.
- Package manager from the lockfile: `pnpm-lock.yaml` → pnpm, `package-lock.json` / `npm-shrinkwrap.json` → npm, `yarn.lock` → yarn, `bun.lock` / `bun.lockb` → bun. If none, ask; default to npm.
- Yarn generation when the lockfile is `yarn.lock`: Berry (v2+) has `.yarnrc.yml` or a `packageManager` of `yarn@2` or newer. Otherwise treat it as Yarn Classic (v1). Classic runs `prepare` on install; Berry does not.
- Workspace layout: `pnpm-workspace.yaml` or `workspaces` in `package.json`.
- Ignore rules: confirm `.gitignore` covers `node_modules/`, `dist/`, and build output. Both tools honor `.gitignore` while discovering files; without it, Oxlint walks dependency folders and floods the output with errors.
- Existing config: `.oxfmtrc.json`, `.oxlintrc.json`, `.lintstagedrc*`, Prettier config (`.prettierrc*` or a `prettier` key), Biome config (`biome.json` / `biome.jsonc`), ESLint flat config (`eslint.config.*`), and legacy ESLint config (`.eslintrc*`).
- Existing scripts: `fmt`, `format`, `lint`, `typecheck`, `test`, `prepare`, `postinstall`, `prepack`, `postpack`. Note any script that still runs Prettier, Biome, or ESLint.
- Existing `.husky/pre-commit` content, recorded before Husky is initialized.
- `git config core.hooksPath`; stop and ask if it points somewhere other than a Husky-managed path.
- Whether `package.json` sets `"private": true`.

## 2. Ask Once

Ask only for what inspection cannot decide and the user has not already specified, in one message, with defaults:

1. **Hook scope** — default: lint-staged only. Offer to append the existing `typecheck` and/or `test` scripts (only list scripts that exist).
2. **Migration** — if Prettier, Biome, or ESLint is present, default: migrate to Oxfmt/Oxlint but keep the old config and dependencies until verification passes. When the only ESLint config is legacy `.eslintrc*`, say that it cannot be migrated automatically.
3. **Initial repository-wide format** — default: no. Formatting the whole repository rewrites many files; run it only with approval, and keep it in a separate commit made by the user.
4. **Monorepo** — ask only when a workspace is present. Default: configure at the repository root only. Per-package configuration is out of scope unless the user asks.

Skip any item the user already answered. Do not start changing files while a remaining choice is still open.

## 3. Install Dependencies

Run from the project root (the workspace root for monorepos):

| Package manager | Command |
| --- | --- |
| pnpm | `pnpm add -D husky lint-staged oxfmt oxlint` (add `-w` at a workspace root) |
| npm | `npm install -D husky lint-staged oxfmt oxlint` |
| yarn (classic) | `yarn add -D husky lint-staged oxfmt oxlint` |
| yarn (berry) | `yarn add -D -W husky lint-staged oxfmt oxlint` |
| bun | `bun add -d husky lint-staged oxfmt oxlint` |

Record the resolved versions. At a workspace root, add the workspace flag (`pnpm add -Dw ...`, `yarn add -D -W ...`). Oxfmt is still 0.x, so keep the lockfile and report the installed version.

## 4. Configure Oxfmt

Create `.oxfmtrc.json` at the project root unless one already exists. Use the project's package manager exec form (`pnpm exec oxfmt`, `npx oxfmt`, `yarn oxfmt`, or `bunx oxfmt`):

- Existing `.oxfmtrc.json`: keep it. If `ignorePatterns` omits a tracked lockfile, add that pattern.
- Prettier config present: `oxfmt --migrate=prettier`. YAML, JSON5, and TOML Prettier configs cannot be migrated; convert them to JSON or JS first. Nested configs are not searched; run the command in each directory that has a Prettier config.
- Biome config present: `oxfmt --migrate=biome`. This migrates formatter options only, not Biome lint rules.
- Nothing present: `oxfmt --init`, then add the lockfile and minified-file ignore patterns below.

Format the new config file only: `oxfmt --write .oxfmtrc.json`. Running `oxfmt` without a path writes the current directory, because `--write` is the default.

A minimal config:

```json
{
  "$schema": "./node_modules/oxfmt/configuration_schema.json",
  "ignorePatterns": ["**/*.min.*", "pnpm-lock.yaml", "package-lock.json", "yarn.lock", "bun.lock"]
}
```

Keep the project's existing style options when present. Leave `endOfLine` to `.editorconfig`; do not set it in this config. Oxfmt already honors `.gitignore`, `.prettierignore`, and `.editorconfig`, so do not copy those patterns. `.gitignore` does not apply to paths lint-staged passes explicitly, so tracked lockfiles stay in `ignorePatterns`.

## 5. Configure Oxlint

Create `.oxlintrc.json` at the project root unless one already exists:

- Existing `.oxlintrc.json`: keep it; add only what is needed for this project.
- ESLint flat config (`eslint.config.*`) present: ask before migrating. On approval, run `@oxlint/migrate` at the same version as the installed oxlint, for example `npx @oxlint/migrate@<version>` or the package manager's equivalent. Add `--details` to list rules that could not be migrated. Do not pass `--type-aware`. The tool enables `jsPlugins` by default, so leave the ESLint plugin packages installed until verification passes. Keep the ESLint config and dependencies until the generated config passes verification.
- Legacy ESLint config (`.eslintrc*`): `@oxlint/migrate` does not read it. Ask before writing a fresh `.oxlintrc.json`, and keep the legacy config until verification passes.
- Nothing present: `oxlint --init`, then enable plugins and environments that match the stack (React, Next.js, Vue, Vitest/Jest, jsx-a11y, import, node). Start with the `correctness` category only.

Setting `plugins` replaces the default set. When editing that array, include `typescript`, `unicorn`, and `oxc` along with the stack plugins.

A minimal Node config:

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "env": { "node": true },
  "categories": { "correctness": "error" }
}
```

For a browser project, set `env.browser` to true and omit `env.node`. Oxlint already skips `.git`, minified filenames, and gitignored paths during discovery, so do not copy `.gitignore` into `ignorePatterns`.

Verify with `oxlint --print-config <path to an existing source file>`, for example `oxlint --print-config src/index.ts`. If the repository has no source file yet, skip this and rely on the smoke test. Do not enable type-aware linting in this workflow; it needs extra setup.

## 6. Configure lint-staged

Use the location the project already uses: the `lint-staged` key in `package.json`, a `.lintstagedrc*` file, or a JS config. When none exists, create `.lintstagedrc.json`:

```json
{
  "*.{js,mjs,cjs,jsx,ts,mts,cts,tsx}": ["oxlint --fix --no-error-on-unmatched-pattern", "oxfmt --write --no-error-on-unmatched-pattern"],
  "*.{json,jsonc,yaml,yml,toml,md,mdx,css,scss,less,html,vue,svelte,astro,graphql}": ["oxfmt --write --no-error-on-unmatched-pattern"]
}
```

- Order matters: Oxlint applies safe fixes first, Oxfmt writes the final format last.
- lint-staged automatically stages the fixes it makes.
- `--no-error-on-unmatched-pattern` lets the hook succeed when a glob matches only ignored files, such as a lockfile or a minified bundle.
- Merge with existing entries instead of replacing them. Ask before changing an existing glob's commands.
- Do not add `--fix-dangerously`; only safe fixes run at commit time.

## 7. Add Package Scripts

Add only missing scripts:

```json
{
  "scripts": {
    "fmt": "oxfmt",
    "fmt:check": "oxfmt --check",
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

If a script name already exists, leave it unchanged and report the conflict. In the final report, name any `format`, `lint`, or similar script that still runs Prettier, Biome, or ESLint.

## 8. Install the Husky Hook

1. Keep the `.husky/pre-commit` contents recorded in step 1. Initialize Husky with the project's package manager: `pnpm exec husky init`, `npx husky init`, `yarn husky init`, or `bunx husky init`.
2. Restore any install script that `husky init` overwrote.
   - npm, pnpm, bun, and Yarn Classic: `"prepare": "husky"` when none existed, otherwise `"prepare": "husky && <original command>"`.
   - Yarn Berry (v2+): `"postinstall": "husky"` when none existed, otherwise `"postinstall": "husky && <original command>"`. Berry does not run `prepare` on install. If `husky init` created a `prepare` script that was not there before, remove that new script and restore the previous `prepare` command when there was one. If the package is not `"private": true`, also add `pinst` as a devDependency, `"prepack": "pinst --disable"`, and `"postpack": "pinst --enable"`. If `prepack` or `postpack` already exists, leave it and report the conflict.
3. Write `.husky/pre-commit` with the package-manager-specific command, no shebang (Husky v9), LF line endings:
   - npm: `npx lint-staged`
   - pnpm: `pnpm exec lint-staged`
   - yarn: `yarn lint-staged`
   - bun: `bunx lint-staged`
   Discard the placeholder test command `husky init` inserts. Append the approved `typecheck` / `test` commands, for example `pnpm run typecheck` and `pnpm test`.
4. Preserve unrelated commands that were already in the hook before `husky init`, and keep the file executable where the platform supports it. If `core.autocrlf` is `true`, add `.husky/* text eol=lf` to `.gitattributes` (create it if missing) so checkouts keep hook scripts LF.

## 9. Verify

Run these checks and record the results:

1. `oxfmt --check`: report how many files would change. Do not write them unless the user approved the initial format.
2. `oxlint`: record the existing error and warning baseline. Do not mass-fix existing issues.
3. Hook smoke test without committing. Delete the temporary files and restore the index whether the test passes or fails (`git restore --staged <file>`, then remove the files).
   - Create a temporary JS/TS file with a formatting-only problem that the correctness rules accept, for example `export const answer=42;`. `no-unused-vars` is on by default, and `oxlint --fix` does not remove an unused binding.
   - `git add <file>`, run lint-staged with the package manager, and confirm the file was formatted and re-staged.
   - Add a second temporary file containing a `debugger` statement. That rule is correctness, and its fix is a suggestion, so `oxlint --fix` leaves it in place and lint-staged exits non-zero.
   - Remove both temporary files and restore the index.
   - Rerun `oxfmt --check` and `oxlint` on the cleaned tree and report what remains.
4. Confirm `.husky/pre-commit` uses LF line endings and `git config core.hooksPath` still resolves to Husky.

Do not create a commit while verifying.

## 10. Report

Summarize:

- Files created or changed, and the package versions installed.
- The hook commands actually written.
- The Oxfmt/Oxlint baseline and any pre-existing issues left unfixed.
- Scripts left unchanged, especially any that still run Prettier, Biome, or ESLint.
- How to bypass: `git commit --no-verify` or `HUSKY=0`.
- CI recommendation: set `HUSKY=0` when installing dependencies on CI and run `fmt:check` and `lint` as separate CI steps.
- That no commit was created.

## Notes

- **Windows**: Git runs hooks through the POSIX shell from Git for Windows. Keep hook files LF-only. If commits from a GUI cannot find Node, add the version manager setup to `~/.config/husky/init.sh`.
- **CI without devDependencies**: `HUSKY=0` skips hook installation. A `prepare` or `postinstall` script that fails when Husky is absent can be made tolerant with `husky || true`.
- **Framework files**: Oxfmt formats `.vue`, `.svelte`, and `.astro`. The Oxlint Vue plugin stays off until enabled, and `no-unused-vars` ignores those files. Keep them in the formatter glob and add them to the lint glob only after verifying support.
- **Existing lint debt**: this workflow blocks new lint errors in staged files; it does not require fixing the whole repository.

## References

- [Oxfmt CLI](https://oxc.rs/docs/guide/usage/formatter/cli.html)
- [Oxfmt configuration](https://oxc.rs/docs/guide/usage/formatter/config-file-reference.html)
- [Migrate from Prettier](https://oxc.rs/docs/guide/usage/formatter/migrate-from-prettier.html)
- [Oxlint CLI](https://oxc.rs/docs/guide/usage/linter/cli.html)
- [Oxlint configuration](https://oxc.rs/docs/guide/usage/linter/config-file-reference.html)
- [Migrate from ESLint](https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html)
- [lint-staged](https://github.com/lint-staged/lint-staged)
- [Husky](https://typicode.github.io/husky/)
