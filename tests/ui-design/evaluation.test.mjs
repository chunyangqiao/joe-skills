import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { findingRules, loadCases, scoreAudit, scoreDirectory } from './harness/evaluate.mjs';

test('audit matching counts findings, not prose, code examples or rule prefixes', () => {
  const found = findingRules(
    [
      'ui.density is deliberate and is not a defect.',
      '| Rule | Note |',
      '| ui.empty-state | not a finding |',
      '```markdown',
      '| P0 | ui.image-contrast | example only |',
      '```',
      '### P1 — consistency',
      '| Place | Rule |',
      '| --- | --- |',
      '| action | ui.action-rank |',
      '### Deliberate conventions',
      '| layout | ui.generous-space |',
      '| P2 | ui.uppercase-tracking |',
    ].join('\n'),
  );
  assert.deepEqual([...found], ['ui.action-rank', 'ui.uppercase-tracking']);
  const result = scoreAudit(
    { id: 'test', must: [{ rules: ['ui.text-align'] }], should: [], forbidden: [] },
    '| P1 | ui.numeric-align |',
  );
  assert.equal(result.passed, false);
  const prefix = scoreAudit(
    { id: 'test', must: [{ rules: ['ui.density'] }], should: [], forbidden: [] },
    '| P1 | ui.generous-space |',
  );
  assert.equal(prefix.passed, false);
});

test('preserved gold cases detect must misses and deliberate-density false positives', async () => {
  const cases = await loadCases();
  assert.equal(cases.length, 8);
  for (const expected of cases) {
    const report = expected.must
      .map((item) => `| P1 | ${item.rules[0]} | observed defect |`)
      .join('\n');
    assert.equal(scoreAudit(expected, report).passed, true, expected.id);
    if (expected.must.length) assert.equal(scoreAudit(expected, '').passed, false, expected.id);
  }
  const density = cases.find((item) => item.id === '08-blotter');
  assert.equal(scoreAudit(density, '| P1 | ui.generous-space | add whitespace |').passed, false);
  assert.equal(
    scoreAudit(
      density,
      'Density is deliberate (ui.density).\n| P1 | ui.action-rank | Equal toolbar actions |',
    ).passed,
    true,
  );
});

test('suite scoring fails missing reports rather than silently accepting a subset', async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'ui-audit-score-'));
  try {
    await writeFile(
      path.join(directory, '08-blotter.md'),
      'Dense by convention.\n| P1 | ui.action-rank | Equal toolbar actions |',
    );
    const results = await scoreDirectory(directory);
    assert.equal(results.length, 8);
    assert.equal(results.filter((item) => item.missingReport).length, 7);
    assert.equal(results.find((item) => item.id === '08-blotter').passed, true);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
