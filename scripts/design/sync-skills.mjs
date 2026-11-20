import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expectedFiles, writeAgents } from './agents.mjs';
import { die, readText, repoRoot } from './lib.mjs';

function drift() {
  const mismatches = [];
  for (const file of expectedFiles()) {
    let current = '';
    try {
      current = readText(file.path);
    } catch {
      mismatches.push(`${path.relative(repoRoot, file.path)} missing`);
      continue;
    }
    const expected = file.contents.endsWith('\n')
      ? file.contents
      : `${file.contents}\n`;
    if (current !== expected) {
      mismatches.push(path.relative(repoRoot, file.path));
    }
  }
  return mismatches;
}

export function assertSkillsInSync() {
  const mismatches = drift();
  if (mismatches.length) {
    throw new Error(
      `Design Pass agents drifted from models.json:\n${mismatches.join('\n')}`,
    );
  }
}

function main() {
  if (process.argv.includes('--check')) {
    const mismatches = drift();
    if (mismatches.length) {
      die(`design:sync-skills drift:\n${mismatches.join('\n')}`);
    }
    console.log('design:sync-skills: in sync');
    return;
  }
  const written = writeAgents();
  console.log(`wrote ${written.length} agent and skill files`);
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main();
}
