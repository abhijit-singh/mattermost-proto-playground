import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './lib.mjs';

const roots = [
  'design',
  '.cursor/agents',
  '.cursor/skills',
  '.cursor/design-pass',
  '.cursor/cursor.md',
  '.cursor/scripts',
  'AGENTS.md',
];

const banned = [
  /do not draft/i,
  /don't draft/i,
  /never draft/i,
  /not drafted/i,
  /must not be drafted/i,
  /those four/i,
  /four fields/i,
];

function filesUnder(rel) {
  const full = path.join(repoRoot, rel);
  if (!fs.existsSync(full)) {
    return [];
  }
  const stat = fs.statSync(full);
  if (stat.isFile()) {
    return [full];
  }
  const out = [];
  for (const entry of fs.readdirSync(full, { withFileTypes: true })) {
    const child = path.join(full, entry.name);
    if (entry.isDirectory()) {
      out.push(...filesUnder(path.relative(repoRoot, child)));
    } else if (/\.(md|mjs|json|ya?ml|sh)$/.test(entry.name)) {
      out.push(child);
    }
  }
  return out;
}

export function wordingHits() {
  const hits = [];
  const skip = new Set([path.join(repoRoot, 'scripts/design/wording.mjs')]);
  for (const root of roots) {
    for (const file of filesUnder(root)) {
      if (skip.has(file)) {
        continue;
      }
      const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
      lines.forEach((line, index) => {
        for (const pattern of banned) {
          if (pattern.test(line)) {
            hits.push(
              `${path.relative(repoRoot, file)}:${index + 1}: ${line.trim()}`,
            );
          }
        }
      });
    }
  }
  return hits;
}
