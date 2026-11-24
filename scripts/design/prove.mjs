import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { repoRoot } from './lib.mjs';
import versionFile from './version.json' with { type: 'json' };

function git(args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

export function designPassVersion() {
  return versionFile.design_pass_version;
}

export function headSha() {
  return git(['rev-parse', 'HEAD']);
}

export function identity() {
  return { sha: headSha(), version: designPassVersion() };
}

export function printIdentity(id = identity()) {
  console.log(`commit: ${id.sha}`);
  console.log(`design_pass_version: ${id.version}`);
  return id;
}

export function stopLine({ stop, prs = 0, targets = 'none', reason, sha }) {
  return `STOP ${stop} | prs=${prs} | targets=${targets} | sha=${sha} | reason=${reason}`;
}

export function runStarter() {
  const attempts = [
    ['gh', ['api', 'user', '--jq', '.name']],
    ['gh', ['api', 'user', '--jq', '.login']],
    ['git', ['config', 'user.name']],
  ];
  for (const [cmd, args] of attempts) {
    try {
      const value = execFileSync(cmd, args, {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      }).trim();
      if (value) {
        return value;
      }
    } catch {
      // try the next source
    }
  }
  return 'the person who started this run';
}

function versionOnDisk() {
  return JSON.parse(
    fs.readFileSync(path.join(repoRoot, 'scripts/design/version.json'), 'utf8'),
  ).design_pass_version;
}

function refuse(id, reason) {
  console.error(stopLine({ stop: 'escalate', reason, sha: id.sha }));
  process.exit(2);
}

export function proveCheckout() {
  const id = printIdentity();
  try {
    execFileSync('git', ['fetch', 'origin'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error.stderr || error.message || 'git fetch failed';
    console.error(
      `Could not fetch origin. Continuing at ${id.sha}. ${String(detail).split('\n')[0]}`,
    );
    return id;
  }
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (branch === 'HEAD') {
    return id;
  }
  const remote = `origin/${branch}`;
  try {
    git(['rev-parse', '--verify', '--quiet', remote]);
  } catch {
    return id;
  }
  const counts = git([
    'rev-list',
    '--left-right',
    '--count',
    `HEAD...${remote}`,
  ]);
  const [ahead, behind] = counts.split(/\s+/).map((part) => Number(part || 0));
  const dirty = git(['status', '--porcelain']);
  if (dirty) {
    refuse(id, `Refusing to start. Checkout ${id.sha} is dirty.`);
  }
  if (ahead > 0 && behind > 0) {
    refuse(
      id,
      `Refusing to start. Checkout ${id.sha} has diverged from ${remote}.`,
    );
  }
  if (behind > 0) {
    try {
      execFileSync('git', ['pull', '--ff-only', 'origin', branch], {
        cwd: repoRoot,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
    } catch (error) {
      const detail = error.stderr || error.message || 'git pull failed';
      refuse(
        id,
        `Refusing to start. Fast-forward of ${id.sha} failed. ${String(detail).split('\n')[0]}`,
      );
    }
    const next = { sha: headSha(), version: versionOnDisk() };
    console.log(`commit: ${id.sha}`);
    console.log(`commit: ${next.sha}`);
    console.log(`design_pass_version: ${next.version}`);
    if (process.argv[1] && !process.argv[1].endsWith('prove.mjs')) {
      const result = spawnSync(process.execPath, process.argv.slice(1), {
        cwd: repoRoot,
        stdio: 'inherit',
        env: process.env,
      });
      process.exit(result.status ?? 1);
    }
    return next;
  }
  return id;
}

if (process.argv[1] && process.argv[1].endsWith('prove.mjs')) {
  proveCheckout();
}
