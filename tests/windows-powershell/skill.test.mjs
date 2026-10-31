import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { parse as parseYaml } from 'yaml';

const root = path.join(import.meta.dirname, '../../skills/windows-powershell');

test('windows-powershell skill documents the 5.1 command rewrites', async () => {
  for (const file of ['SKILL.md', 'README.md', 'README.zh-CN.md', 'agents/openai.yaml']) {
    await readFile(path.join(root, file));
  }

  const instructions = await readFile(path.join(root, 'SKILL.md'), 'utf8');
  const frontmatter = parseYaml(/^---\n([\s\S]*?)\n---/.exec(instructions)[1]);
  assert.equal(frontmatter.name, 'windows-powershell');
  assert.ok(typeof frontmatter.description === 'string' && frontmatter.description.length <= 1024);
  assert.doesNotMatch(frontmatter.description, /[<>]|\[TODO:/);
  assert.deepEqual(Object.keys(frontmatter).sort(), ['description', 'name']);
  assert.match(frontmatter.description, /PowerShell 5\.1/);
  assert.match(frontmatter.description, /InvalidEndOfLine/);

  for (const marker of [
    'InvalidEndOfLine',
    'MissingFileSpecification',
    'NamedParameterNotFound',
    'ParameterArgumentValidationErrorNullNotAllowed',
    'CommandNotFoundException',
    '$LASTEXITCODE',
    "git commit -m @'",
    '[char]60',
    'corepack pnpm',
    'ComSpec',
    'DEP0190',
  ]) {
    assert.ok(instructions.includes(marker), `Missing ${marker}`);
  }

  const metadata = parseYaml(await readFile(path.join(root, 'agents/openai.yaml'), 'utf8'));
  assert.ok(metadata.interface.default_prompt.includes('$windows-powershell'));
  assert.ok(
    metadata.interface.short_description.length >= 25 &&
      metadata.interface.short_description.length <= 64,
  );
  assert.notEqual(metadata.policy?.allow_implicit_invocation, false);

  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const readmeZh = await readFile(path.join(root, 'README.zh-CN.md'), 'utf8');
  assert.match(readme, /\[SKILL\.md\]\(SKILL\.md\)/);
  assert.match(readmeZh, /\[SKILL\.md\]\(SKILL\.md\)/);
});
