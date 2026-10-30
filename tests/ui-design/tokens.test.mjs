import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  SKILL_ROOT,
  buildArtifacts,
  contrastRatio,
  createTokens,
  generatePalette,
  hexToHsl,
  resolveToken,
  runCli,
  validateTokens,
  writeArtifacts,
} from '../../skills/ui-design/scripts/design-system.mjs';

const REPO_ROOT = fileURLToPath(new URL('../../', import.meta.url));
const SCRIPT = path.join(SKILL_ROOT, 'scripts/design-system.mjs');
const defaults = () => createTokens({ brand: '#0f766e', name: 'Lumen' });

async function temporary(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'ui-design-test-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  return root;
}

function cli(args, cwd, script = SCRIPT) {
  return spawnSync(process.execPath, [script, ...args], { cwd, encoding: 'utf8', timeout: 10000 });
}

test('palette ports the source ladder and keeps the exact brand anchor', () => {
  assert.deepEqual(generatePalette('#0f766e'), {
    50: '#f6ffff',
    100: '#ebffff',
    200: '#99f7f5',
    300: '#5ed9d4',
    400: '#2eb0a8',
    500: '#0f766e',
    600: '#0d7265',
    700: '#0b6d5d',
    800: '#096954',
    900: '#07644c',
    950: '#003b23',
  });
  for (const brand of ['#000', '#fff', '#123', '#fefffe', '#010001', '#f00', '#00f', '#abc']) {
    const ramp = generatePalette(brand);
    assert.equal(Object.keys(ramp).length, 11);
    assert.equal(
      ramp[500],
      brand.length === 4 ? `#${[...brand.slice(1)].map((c) => c + c).join('')}` : brand,
    );
    let previous = 101;
    for (const hex of Object.values(ramp)) {
      assert.match(hex, /^#[\da-f]{6}$/);
      const lightness = hexToHsl(hex)[2];
      assert.ok(lightness <= previous + 0.000001, `${brand}: ${hex} is out of order`);
      previous = lightness;
    }
  }
  assert.throws(() => generatePalette('hsl(0, 50%, 50%)'), /unsupported/);
  assert.throws(() => generatePalette('#ffffff00'), /unsupported/);
});

test('generated semantic roles consume the generated ramps and pass both modes', () => {
  for (const brand of ['#0f766e', '#000', '#fff', '#f00', '#0f0', '#00f', '#ff0', '#0ff', '#f0f']) {
    const tokens = createTokens({ brand, name: 'Lumen' });
    assert.deepEqual(tokens.primitive.color.brand, generatePalette(brand));
    assert.match(tokens.semantic.color.primary, /^\{primitive\.color\.brand\./);
    const report = validateTokens(tokens);
    assert.equal(report.valid, true, JSON.stringify(report.results.filter((row) => !row.pass)));
    assert.equal(report.checked, tokens.pairs.length * 2);
    assert.deepEqual([...new Set(report.results.map((row) => row.mode))], ['light', 'dark']);
  }
});

test('input boundaries and destructive error text meet their surface contrast requirements', () => {
  const tokens = defaults();
  const results = validateTokens(tokens).results;
  for (const mode of ['light', 'dark']) {
    for (const name of ['Input boundary on page', 'Input boundary on card']) {
      const result = results.find((row) => row.mode === mode && row.name === name);
      assert.equal(result.kind, 'ui');
      assert.equal(result.minimum, 3);
      assert.ok(result.ratio >= 3);
    }
    for (const name of ['Form error on page', 'Form error on card']) {
      const result = results.find((row) => row.mode === mode && row.name === name);
      assert.equal(result.kind, 'text');
      assert.equal(result.minimum, 4.5);
      assert.ok(result.ratio >= 4.5);
    }
  }
  tokens.semantic.color.input = '{semantic.color.background}';
  assert.equal(
    validateTokens(tokens).results.find(
      (row) => row.mode === 'light' && row.name === 'Input boundary on page',
    ).pass,
    false,
  );
  tokens.semantic.color.destructive = '{semantic.color.background}';
  assert.equal(
    validateTokens(tokens).results.find(
      (row) => row.mode === 'light' && row.name === 'Form error on page',
    ).pass,
    false,
  );
});

test('partial dark modes redeclare every effective semantic alias inside the dark scope', () => {
  const tokens = defaults();
  tokens.semantic.color['inherited-alias'] = '{semantic.color.foreground}';
  tokens.modes.dark.color = {
    foreground: '{primitive.color.white}',
    background: '{primitive.color.black}',
  };
  tokens.pairs = [tokens.pairs[0]];
  const css = buildArtifacts(tokens)['tokens.css'];
  const dark = css.slice(css.indexOf('.dark,'));
  assert.match(dark, /--ui-color-foreground: var\(--ui-color-white\);/);
  assert.match(dark, /--ui-color-inherited-alias: var\(--ui-color-foreground\);/);
  assert.match(dark, /--ui-color-primary: var\(--ui-color-brand-/);
  assert.equal(
    (dark.match(/--ui-color-[\w-]+:/g) ?? []).length,
    Object.keys(tokens.semantic.color).length,
  );
  assert.equal(
    resolveToken('{semantic.color.inherited-alias}', tokens, { mode: 'dark' }),
    '#ffffff',
  );
});

test('alias resolution applies mode overrides transitively and reports paths', () => {
  const tokens = defaults();
  tokens.semantic.color.foreground = '{semantic.color.card-foreground}';
  assert.equal(
    resolveToken('{semantic.color.foreground}', tokens),
    tokens.primitive.color.neutral[950],
  );
  assert.equal(
    resolveToken('{semantic.color.foreground}', tokens, { mode: 'dark' }),
    tokens.primitive.color.neutral[50],
  );
  tokens.modes.dark.color = { 'card-foreground': '{primitive.color.white}' };
  assert.equal(resolveToken('{semantic.color.foreground}', tokens, { mode: 'dark' }), '#ffffff');
  tokens.semantic.color['card-foreground'] = '{semantic.color.foreground}';
  assert.throws(
    () => validateTokens(tokens),
    /light.semantic.color.foreground: circular.*foreground.*card-foreground/,
  );
  tokens.semantic.color['card-foreground'] = '{primitive.color.missing.500}';
  assert.throws(() => validateTokens(tokens), /unresolved.*primitive.color.missing.500.*missing/);
  tokens.semantic.color['card-foreground'] = '{primitive.color.brand}';
  assert.throws(() => validateTokens(tokens), /points to a group/);
});

test('contrast uses live aliases, covers modes, and implements exact text and UI thresholds', () => {
  const tokens = defaults();
  tokens.semantic.color.foreground = '{primitive.color.neutral.500}';
  tokens.semantic.color.background = '{primitive.color.white}';
  tokens.pairs = [
    {
      name: 'Sample',
      fg: '{semantic.color.foreground}',
      bg: '{semantic.color.background}',
      kind: 'text',
    },
  ];
  delete tokens.modes;
  const normal = validateTokens(tokens);
  assert.ok(normal.results[0].ratio >= 3 && normal.results[0].ratio < 4.5);
  assert.equal(normal.valid, false);
  assert.equal(normal.results[0].minimum, 4.5);
  tokens.pairs[0].fontSize = 24;
  assert.equal(validateTokens(tokens).valid, true);
  tokens.pairs[0].fontSize = 18.6666;
  tokens.pairs[0].fontWeight = 700;
  assert.equal(validateTokens(tokens).valid, false);
  tokens.pairs[0].fontSize = 56 / 3; // 14pt in CSS pixels, without rounding up the threshold.
  assert.equal(validateTokens(tokens).valid, true);
  tokens.pairs[0].fontWeight = 600;
  assert.equal(validateTokens(tokens).valid, false);
  tokens.pairs[0].kind = 'ui';
  assert.equal(validateTokens(tokens).valid, true);
  tokens.semantic.color.foreground = '{semantic.color.background}';
  assert.equal(validateTokens(tokens).results[0].ratio, 1);
  tokens.modes = { dark: { color: { foreground: '{primitive.color.white}' } } };
  assert.equal(validateTokens(tokens).results.find((row) => row.mode === 'dark').pass, false);
  assert.equal(contrastRatio('#000', '#fff'), 21);
});

test('schema errors reject ambiguous pairs, unsupported colors and unsafe CSS before output', () => {
  for (const [mutate, pattern] of [
    [
      (tokens) => {
        tokens.version = 2;
      },
      /version/,
    ],
    [
      (tokens) => {
        tokens.pairs = [];
      },
      /pairs/,
    ],
    [
      (tokens) => {
        tokens.pairs[0].fg = '#fff';
      },
      /absolute token reference/,
    ],
    [
      (tokens) => {
        tokens.pairs[0].fontSize = '24';
      },
      /fontSize/,
    ],
    [
      (tokens) => {
        tokens.primitive.color.brand[500] = 'red';
      },
      /primitive.color.brand.500.*unsupported/,
    ],
    [
      (tokens) => {
        tokens.semantic.color.primary = 'rgb(0 0 0)';
      },
      /semantic.color.primary.*unsupported/,
    ],
    [
      (tokens) => {
        tokens.primitive.font.sans = 'serif; color:red';
      },
      /unsafe/,
    ],
    [
      (tokens) => {
        tokens.primitive.font.sans = 'serif\/*';
      },
      /unsafe/,
    ],
    [
      (tokens) => {
        tokens.primitive.space = { 1: '4px' };
      },
      /unsupported token group/,
    ],
    [
      (tokens) => {
        tokens.modes.print = { color: {} };
      },
      /only dark/,
    ],
  ]) {
    const tokens = defaults();
    mutate(tokens);
    assert.throws(() => buildArtifacts(tokens), pattern);
  }
});

test('artifacts connect semantic variables, Tailwind v4 namespaces and escaped previews', () => {
  const tokens = createTokens({ brand: '#eab308', name: '<img src=x onerror=alert(1)> "&' });
  const artifacts = buildArtifacts(tokens);
  assert.deepEqual(Object.keys(artifacts), [
    'design-tokens.json',
    'tokens.css',
    'theme.css',
    'DESIGN.md',
    'preview.html',
  ]);
  assert.deepEqual(JSON.parse(artifacts['design-tokens.json']), tokens);
  assert.match(artifacts['tokens.css'], /--ui-color-primary: var\(--ui-color-brand-/);
  assert.match(artifacts['tokens.css'], /\.dark,\n\[data-theme="dark"\]/);
  assert.match(artifacts['theme.css'], /@import "tailwindcss";/);
  assert.match(artifacts['theme.css'], /@import "\.\/tokens.css";/);
  assert.match(artifacts['theme.css'], /@theme inline/);
  assert.match(artifacts['theme.css'], /--color-primary: var\(--ui-color-primary\)/);
  assert.match(artifacts['theme.css'], /--font-weight-semibold: var\(--ui-weight-semibold\)/);
  assert.match(artifacts['theme.css'], /--spacing-4: var\(--ui-spacing-4\)/);
  assert.match(artifacts['theme.css'], /--radius-md: var\(--ui-radius-md\)/);
  assert.doesNotMatch(artifacts['theme.css'], /@theme \{|--weight-/);
  assert.match(artifacts['preview.html'], /&lt;img src=x onerror=alert\(1\)&gt; &quot;&amp;/);
  assert.doesNotMatch(artifacts['preview.html'], /<img|https?:\/\//);
  assert.match(artifacts['preview.html'], /background:var\(--ui-color-primary\)/);
  assert.match(artifacts['preview.html'], /aria-pressed.*Dark theme/);
  assert.match(artifacts['preview.html'], /classList.toggle\("dark"\)/);
  assert.match(
    artifacts['preview.html'],
    /input\{[^}]*background:var\(--ui-color-background\)[^}]*border:1px solid var\(--ui-color-input\)/,
  );
  assert.match(artifacts['preview.html'], /\.space\{[^}]*max-width:100%/);
  assert.match(
    artifacts['preview.html'],
    /\.row>span\{[^}]*min-width:0[^}]*max-width:100%[^}]*overflow-wrap:anywhere/,
  );
  assert.match(artifacts['DESIGN.md'], /personality decisions/);
  assert.match(artifacts['DESIGN.md'], /#eab308/);
  assert.match(artifacts['DESIGN.md'], /unsupported/);
});

test('dry-run creates no directory, normal emit is idempotent, conflicts preflight the whole batch', async (t) => {
  const root = await temporary(t);
  const out = path.join(root, 'new', 'system');
  const artifacts = buildArtifacts(defaults());
  const preview = await writeArtifacts(artifacts, out, { dryRun: true });
  assert.ok(preview.files.every((file) => file.status === 'create'));
  await assert.rejects(fs.stat(out), { code: 'ENOENT' });
  const written = await writeArtifacts(artifacts, out);
  assert.equal(written.files.length, 5);
  const repeated = await writeArtifacts(artifacts, out);
  assert.ok(repeated.files.every((file) => file.status === 'unchanged'));
  await fs.writeFile(path.join(out, 'theme.css'), 'user theme');
  await fs.unlink(path.join(out, 'preview.html'));
  const conflicts = await writeArtifacts(artifacts, out, { dryRun: true });
  assert.deepEqual(conflicts.conflicts, [path.join(out, 'theme.css')]);
  await assert.rejects(writeArtifacts(artifacts, out), /Output conflicts; no files were written/);
  assert.equal(await fs.readFile(path.join(out, 'theme.css'), 'utf8'), 'user theme');
  await assert.rejects(fs.stat(path.join(out, 'preview.html')), { code: 'ENOENT' });
  const blocked = path.join(root, 'blocked');
  await fs.mkdir(path.join(blocked, 'tokens.css'), { recursive: true });
  await assert.rejects(writeArtifacts(artifacts, blocked), /Output conflicts/);
  assert.deepEqual(await fs.readdir(blocked), ['tokens.css']);
});

test('CLI emit accepts its existing input token path without requiring canonical formatting', async (t) => {
  const root = await temporary(t);
  const input = path.join(root, 'design-tokens.json');
  const source = JSON.stringify(defaults());
  await fs.writeFile(input, source);
  const emitted = cli(['emit', input, '--out', root], root);
  assert.equal(emitted.status, 0, emitted.stderr);
  assert.equal(JSON.parse(emitted.stdout).files[0].status, 'unchanged');
  assert.equal(await fs.readFile(input, 'utf8'), source);
  const validate = cli(['validate', input], root);
  assert.equal(validate.status, 0, validate.stderr);
  assert.equal(JSON.parse(validate.stdout).valid, true);
});

test('failed output batches roll back newly created files while preserving pre-existing output', async (t) => {
  const root = await temporary(t);
  await fs.writeFile(path.join(root, 'existing.css'), 'keep this');
  await assert.rejects(
    writeArtifacts(
      { 'existing.css': 'keep this', 'first.css': 'new output', 'second.css': null },
      root,
    ),
    /newly written files rolled back/,
  );
  assert.deepEqual(await fs.readdir(root), ['existing.css']);
  assert.equal(await fs.readFile(path.join(root, 'existing.css'), 'utf8'), 'keep this');
});

test('installed runtime works from another cwd using only the copied skill scripts', async (t) => {
  const root = await temporary(t);
  const installed = path.join(root, 'installed-skill');
  await fs.cp(path.join(REPO_ROOT, 'skills/ui-design/scripts'), path.join(installed, 'scripts'), {
    recursive: true,
  });
  assert.deepEqual(await fs.readdir(installed), ['scripts']);
  const script = path.join(installed, 'scripts/design-system.mjs');
  const out = path.join(root, 'output with spaces');
  const init = cli(['init', '--brand', '#0f766e', '--name', 'Lumen', '--out', out], root, script);
  assert.equal(init.status, 0, init.stderr);
  assert.equal((await fs.readdir(out)).length, 5);
  const palette = cli(['palette', '--base', '#abc'], root, script);
  assert.equal(palette.status, 0, palette.stderr);
  assert.equal(JSON.parse(palette.stdout)[500], '#aabbcc');
  const preview = cli(
    ['init', '--brand', '#f00', '--name', 'Changed', '--out', out, '--dry-run'],
    root,
    script,
  );
  assert.equal(preview.status, 1);
  assert.ok(JSON.parse(preview.stdout).conflicts.length > 0);
  assert.equal(
    JSON.parse(await fs.readFile(path.join(out, 'design-tokens.json'))).meta.name,
    'Lumen',
  );
});

test('CLI reports failing pairs as JSON and exits nonzero without an exception stack', async (t) => {
  const root = await temporary(t);
  const input = path.join(root, 'tokens.json');
  const tokens = defaults();
  tokens.semantic.color.foreground = '{semantic.color.background}';
  await fs.writeFile(input, JSON.stringify(tokens));
  const failure = cli(['validate', input], root);
  assert.equal(failure.status, 1);
  assert.equal(JSON.parse(failure.stdout).valid, false);
  assert.equal(failure.stderr, '');
  const output = path.join(root, 'must-not-exist');
  const emit = cli(['emit', input, '--out', output], root);
  assert.equal(emit.status, 1);
  assert.match(emit.stderr, /Contrast validation failed/);
  assert.doesNotMatch(emit.stderr, /at file:/);
  await assert.rejects(fs.stat(output), { code: 'ENOENT' });
  for (const args of [
    ['init', '--brand', '#abc'],
    ['palette', '--base', '#abc', '--force'],
    ['emit', input, '--out'],
    ['unknown'],
  ]) {
    const bad = cli(args, root);
    assert.equal(bad.status, 1);
    assert.match(bad.stderr, /^Error:/);
  }
  let help = '';
  assert.equal(
    await runCli(['--help'], {
      stdout: (value) => {
        help += value;
      },
    }),
    0,
  );
  assert.match(help, /Tailwind v4/);
});
