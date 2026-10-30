# Coding Conventions

Runtime JavaScript is ESM in `.mjs` files. `pnpm format` runs oxfmt. The rules that apply only to `.mjs` are the `**/*.mjs` override in `.oxfmtrc.json`.

## Formatting

oxfmt formats every `.mjs` file. Leave quotes, semicolons, trailing commas, and line wrapping to that file.

Those options are two-space indentation, single quotes, semicolons, trailing commas where the syntax allows them, parentheses around every arrow-function parameter, a print width of 100, LF line endings, and a final newline. Object keys are quoted only when the syntax requires it.

Imports stay in one block, with no blank line between groups. The order is Node.js built-ins, then external packages, then relative modules. Each group is sorted ascending.

Leave comments as written. When an object literal fits on one line, keep the wrapping the author chose.

## Modules

Import Node.js built-ins with the `node:` prefix. Use named exports, and include the `.mjs` extension on relative imports.

A skill command entrypoint, `skills/<name>/scripts/<command>.mjs`, starts with `#!/usr/bin/env node`. Libraries, tests, and repository scripts invoked from `package.json` do not.

Skill runtime code uses Node.js built-ins and modules inside that skill. Tests and repository scripts may import the repository's devDependencies.

## Naming

Use lowercase file names. Separate words with hyphens (`kebab-case`).

- Prefer: `design-system.mjs`, `palette.mjs`.
- Avoid: `DesignSystem.mjs`, `colorPalette.mjs`, `color_palette.mjs`.

Use `camelCase` for a function, method, property, or local variable, such as `generatePalette` and `normalizeHex`.

Use `PascalCase` for a class, such as `ConfigError`.

Use `UPPER_SNAKE_CASE` for a module-level primitive constant whose value is fixed, such as `const SKILL_ROOT`. Keep a local binding in `camelCase`, such as `const hex`.

A name states what the value is for. Use a whole word, omit a redundant qualifier, and avoid an obscure abbreviation.

- Prefer `palette` over `colorPalette` for a palette.
- Prefer `palette.mjs` over `color-palette-utils.mjs` for a module that builds a palette.
- Use a short action name for a function, such as `generatePalette` and `normalizeHex`.
- When a name would collide with a reserved word, choose another name.
- Add a qualifier to distinguish meaning, such as `writeNewConfig` and `atomicWrite`.

`design-system` is a valid file name. It is not a valid JavaScript identifier.

## Imports

The paths below are illustrative. They only show how groups are ordered. A test or a repository script may import a devDependency in the external group.

```js
import path from 'node:path';
import test from 'node:test';
import { parse as yaml } from 'yaml';
import { readJson } from './config.mjs';
```

Re-export a binding from the module that defines it:

```js
export { generatePalette } from './lib/palette.mjs';
```

## Functions

Declare a top-level function with `function`, and export it as `export function generatePalette()`. The declaration name shows up in a stack trace. Write a callback as an arrow function. Use `async` and `await`.

Use `const` for a binding that is not reassigned and `let` for one that is.

Build a string with a template literal.

Put the body of `if`, `else`, `for`, and `while` in curly braces. A body that is only a `return`, `throw`, or `continue` on the same line may omit them.

When a function produces no value, exit with `return`, including an early exit. When it produces a value and has nothing to give, return `undefined`, unless that absence is `null` for a reason listed under Values.

The function below is illustrative.

```js
export async function writeReport(directory, report) {
  const text = `${report.title}\n`;
  if (!text.trim()) return;
  await writeFile(directory, text);
}
```

## Values

Represent an absent value with `undefined`. Use `null` when a JSON document or an external contract requires `null`. A configuration field may be `null`. `JSON.stringify` takes `null` as its replacer.

## Paths

Join path segments with `path.join`. Use `os.tmpdir()` for the temporary directory.

## Comments

Write JSDoc on an exported function only when the signature cannot express a constraint the caller must follow. Skip a comment that repeats the signature.

```js
/** @param {string} host stem, not a path */
export function loadHost(host, root = SKILL_ROOT) {
  if (typeof host !== 'string' || !ROLE_ID.test(host)) throw new ConfigError('Unknown host');
}
```

An algorithm or a heuristic may keep a sentence that states why:

```js
// Bisect lightness, compensate saturation, and cap hue rotation at 20 degrees.
// The compensation formula is a heuristic.
```
