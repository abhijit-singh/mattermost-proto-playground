import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { gateTriage } from './gate.mjs';
import { wordingHits } from './wording.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, 'fixtures', 'triage');
const starter = 'Test Starter';

function field(value, quote, confidence = 'high') {
  return {
    value,
    confidence,
    evidence: quote ? [quote] : [],
  };
}

function read(dir, name) {
  return fs.readFileSync(path.join(dir, name), 'utf8');
}

const hits = wordingHits();
if (hits.length) {
  console.error(hits.join('\n'));
  process.exit(1);
}

let failed = 0;
for (const name of fs.readdirSync(root).sort()) {
  const dir = path.join(root, name);
  if (!fs.statSync(dir).isDirectory()) {
    continue;
  }
  const text = read(dir, 'source.md');
  const triage = JSON.parse(read(dir, 'triage.json'));
  const expected = JSON.parse(read(dir, 'expected.json'));
  const result = gateTriage({ text, triage, starter });
  const problems = [];
  if (Boolean(result.ok) !== expected.continues) {
    problems.push(
      `continues ${result.ok} != ${expected.continues} (${result.stopReason || ''})`,
    );
  }
  if (expected.tier && result.tier !== expected.tier) {
    problems.push(`tier ${result.tier} != ${expected.tier}`);
  }
  if (
    expected.continues &&
    expected.compliance != null &&
    result.compliance !== expected.compliance
  ) {
    problems.push(`compliance ${result.compliance} != ${expected.compliance}`);
  }
  if (expected.continues && result.decider !== starter) {
    problems.push(
      `decider ${result.decider} was not the person who started the run`,
    );
  }
  if (expected.continues && result.tier !== 'skip' && !result.outcome) {
    problems.push('outcome missing');
  }
  if (expected.continues && (result.users || result.customerWords)) {
    problems.push('optional users or customer words were filled');
  }
  if (problems.length) {
    failed += 1;
    console.error(`${name}: ${problems.join('; ')}`);
  } else {
    console.log(`${name}: ok`);
  }
}

if (failed) {
  process.exit(1);
}
console.log('design:test-triage pass');
