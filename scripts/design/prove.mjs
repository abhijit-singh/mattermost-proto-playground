import { execFileSync } from 'node:child_process';
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

export function proveCheckout() {
  const id = printIdentity();
  let fetched = '';
  try {
    fetched = execFileSync('git', ['fetch', 'origin'], {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    });
  } catch (error) {
    const detail = error.stderr || error.message || 'git fetch failed';
    console.error(
      stopLine({
        stop: 'escalate',
        reason: `Refusing to start. Could not fetch origin, so this checkout cannot prove it is current. ${String(detail).split('\n')[0]}`,
        sha: id.sha,
      }),
    );
    process.exit(2);
  }
  void fetched;
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
  const behind = Number(counts.split(/\s+/)[1] || 0);
  if (behind > 0) {
    console.error(
      stopLine({
        stop: 'escalate',
        reason: `Refusing to start. Checkout ${id.sha} is ${behind} commit(s) behind ${remote}. Start a new agent on the updated branch. Do not continue this one.`,
        sha: id.sha,
      }),
    );
    process.exit(2);
  }
  return id;
}

if (process.argv[1] && process.argv[1].endsWith('prove.mjs')) {
  proveCheckout();
}
