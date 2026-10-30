import assert from 'node:assert/strict';
import { readdir, readFile, rm } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';
import { buildPreview, REPO_ROOT } from '../../scripts/preview-ui-design.mjs';

test('generated v4 theme compiles', async (t) => {
  const root = await buildPreview();
  t.after(() => rm(root, { recursive: true, force: true }));
  const css = await readFile(path.join(root, 'styles.css'), 'utf8');
  for (const selector of [
    '.bg-primary',
    '.bg-background',
    '.text-foreground',
    '.border-input',
    '.rounded-lg',
    '.min-h-11',
  ])
    assert.ok(css.includes(selector), `Missing compiled utility ${selector}`);
  assert.match(css, /background-color:\s*var\(--ui-color-primary\)/);
  assert.match(css, /--ui-color-background:/);
  assert.match(css, /\[data-theme="dark"\]/);
  assert.doesNotMatch(css, /@theme\s/);
});

test('all shipped skill document links resolve and package contains required files', async () => {
  const root = path.join(REPO_ROOT, 'skills/ui-design');
  for (const file of ['SKILL.md', 'README.md', 'README.zh-CN.md', 'LICENSE', 'agents/openai.yaml'])
    await readFile(path.join(root, file));
  const instructions = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const frontmatter = parseYaml(/^---\n([\s\S]*?)\n---/.exec(instructions)[1]);
  assert.equal(frontmatter.name, 'ui-design');
  assert.ok(typeof frontmatter.description === 'string' && frontmatter.description.length <= 1024);
  assert.doesNotMatch(frontmatter.description, /[<>]|\[TODO:/);
  assert.deepEqual(Object.keys(frontmatter).sort(), ['description', 'name']);
  const metadata = parseYaml(await readFile(path.join(root, 'agents/openai.yaml'), 'utf8'));
  assert.ok(metadata.interface.default_prompt.includes('$ui-design'));
  assert.ok(
    metadata.interface.short_description.length >= 25 &&
      metadata.interface.short_description.length <= 64,
  );
  assert.notEqual(metadata.policy?.allow_implicit_invocation, false);
  assert.equal(
    await readFile(path.join(root, 'LICENSE'), 'utf8'),
    await readFile(path.join(REPO_ROOT, 'LICENSE'), 'utf8'),
  );
  async function visit(directory) {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const filename = path.join(directory, entry.name);
      if (entry.isDirectory()) await visit(filename);
      else if (entry.name.endsWith('.md')) {
        const text = await readFile(filename, 'utf8');
        for (const match of text.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
          const target = match[1].split('#')[0];
          if (!target || /^(https?:|mailto:|\/)/.test(target)) continue;
          await readFile(path.resolve(directory, target)).catch((error) => {
            throw new Error(`${filename}: missing link ${target}`, { cause: error });
          });
        }
      }
    }
  }
  await visit(root);
});
