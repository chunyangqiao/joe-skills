// Audit fixture scoring.
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';

export const REPO_ROOT = fileURLToPath(new URL('../', import.meta.url));
export const CASE_ROOT = path.join(REPO_ROOT, 'tests/ui-design/fixtures/audits');

export function findingRules(report) {
  const rules = new Set();
  let severitySection = false;
  let fence = false;
  for (const line of report.split(/\r?\n/)) {
    if (/^\s*(```|~~~)/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    if (/^#{1,6}\s/.test(line)) {
      severitySection = /^#{2,3}\s+P[012]\b/.test(line);
      continue;
    }
    if (!/^\s*\|/.test(line) || /^\s*\|[\s:|\-]+\|\s*$/.test(line)) continue;
    if (severitySection || /\bP[012]\b/.test(line)) {
      for (const rule of line.matchAll(/ui\.[a-z0-9]+(?:-[a-z0-9]+)*/g)) rules.add(rule[0]);
    }
  }
  return rules;
}

export function scoreAudit(expected, report) {
  const found = findingRules(report);
  const hits = (items) =>
    items.map((item) => ({
      ...item,
      hit: item.rules.find((rule) => found.has(rule)) ?? null,
    }));
  const must = hits(expected.must);
  const should = hits(expected.should);
  const forbidden = hits(expected.forbidden).filter((item) => item.hit);
  return {
    id: expected.id,
    passed: must.every((item) => item.hit) && forbidden.length === 0,
    must,
    should,
    forbidden,
    shouldRecall: should.length ? should.filter((item) => item.hit).length / should.length : null,
    foundRules: [...found].sort(),
    evidence: 'report-rule-matching-only',
  };
}

export async function loadCases() {
  const entries = await readdir(CASE_ROOT, { withFileTypes: true });
  const cases = [];
  for (const entry of entries
    .filter((item) => item.isDirectory())
    .sort((a, b) => a.name.localeCompare(b.name))) {
    const expected = JSON.parse(
      await readFile(path.join(CASE_ROOT, entry.name, 'expected.json'), 'utf8'),
    );
    if (expected.id !== entry.name) throw new Error(`Fixture id mismatch: ${entry.name}`);
    for (const key of ['must', 'should', 'forbidden']) {
      if (!Array.isArray(expected[key]) || expected[key].some((item) => !item.rules?.length)) {
        throw new Error(`${entry.name}.${key}: expected an array of rule alternatives`);
      }
    }
    await readFile(path.join(CASE_ROOT, entry.name, 'index.html'));
    cases.push(expected);
  }
  return cases;
}

export async function scoreDirectory(directory) {
  const results = [];
  for (const expected of await loadCases()) {
    let report;
    try {
      report = await readFile(path.join(directory, `${expected.id}.md`), 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
      results.push({ id: expected.id, passed: false, missingReport: true });
      continue;
    }
    results.push(scoreAudit(expected, report));
  }
  return results;
}

async function main() {
  const { values } = parseArgs({
    options: {
      reports: { type: 'string' },
      'self-check': { type: 'boolean' },
      help: { type: 'boolean' },
    },
  });
  if (values.help) {
    console.log('node scripts/evaluate-ui-design.mjs --self-check | --reports DIRECTORY');
    return;
  }
  if (values['self-check']) {
    const cases = await loadCases();
    console.log(
      JSON.stringify(
        {
          fixtures: cases.length,
          status: 'valid',
          note: 'Fixture integrity only; no model or visual acceptance was run.',
        },
        null,
        2,
      ),
    );
    return;
  }
  if (!values.reports) throw new Error('Pass --reports DIRECTORY or --self-check');
  const results = await scoreDirectory(values.reports);
  console.log(JSON.stringify({ passed: results.every((item) => item.passed), results }, null, 2));
  if (results.some((item) => !item.passed)) process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
