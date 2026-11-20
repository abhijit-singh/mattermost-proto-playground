import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CRITICAL_FIELDS,
  DRAFTABLE_FIELDS,
  appendLog,
  die,
  isDraft,
  loadRequest,
  loadYaml,
  packetDir,
  printResult,
  repoRoot,
  saveRequest,
} from './lib.mjs';

const STAGES = [
  'frame',
  'research',
  'explore',
  'critique-options',
  'build',
  'critique',
  'persona',
  'verify',
  'handoff',
];

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

function stageKey(stage) {
  return `stage_${stage.replace(/-/g, '_')}`;
}

function parseArgs(argv) {
  const positionals = [];
  const sets = [];
  let by = null;
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      continue;
    }
    if (arg === '--set') {
      sets.push(argv[++i]);
    } else if (arg === '--by') {
      by = argv[++i];
    } else if (!arg.startsWith('--')) {
      positionals.push(arg);
    } else {
      die(`Unknown flag: ${arg}`);
    }
  }
  return { positionals, sets, by };
}

function assignSet(request, expression, { allowCritical, by }) {
  const eq = expression.indexOf('=');
  if (eq === -1) {
    die(`--set must look like key=value: ${expression}`);
  }
  const key = expression.slice(0, eq).trim();
  const raw = expression.slice(eq + 1);
  const field =
    key === 'outcome.headline' ? 'outcome_headline' : key.replace(/\./g, '_');
  if (CRITICAL_FIELDS.includes(field) && !allowCritical) {
    die(
      `Refusing to draft ${field}. Outcome, users, customer words, and the decider are filled by a person with stage.mjs fill --by.`,
    );
  }
  if ((raw === 'true' || raw === 'false') && field !== 'verified') {
    request[field] = raw === 'true';
  } else if (field === 'risk_flags') {
    request.risk_flags = raw
      ? raw
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
  } else {
    request[field] = raw;
  }
  if (isDraft(raw)) {
    if (CRITICAL_FIELDS.includes(field)) {
      die(`Refusing [AI DRAFT] for ${field}.`);
    }
    request.needs_confirmation = request.needs_confirmation || [];
    request.needs_confirmation.push({
      field,
      value: raw,
      added_by: by || 'unspecified',
    });
  }
  return field;
}

function main() {
  const { positionals, sets, by } = parseArgs(process.argv.slice(2));
  const [slug, command, stage] = positionals;
  if (!slug || !command) {
    die(
      'usage: node scripts/design/stage.mjs <slug> start <stage> | complete <stage> [--set k=v] | fill --set k=v --by <name>',
    );
  }
  const request = loadRequest(slug);
  if (command === 'fill') {
    if (!by) {
      die('fill requires --by "<name>" so the audit trail names the person.');
    }
    if (!sets.length) {
      die('fill requires at least one --set.');
    }
    const fields = sets.map((expression) =>
      assignSet(request, expression, { allowCritical: true, by }),
    );
    saveRequest(slug, request);
    appendLog(slug, `fill by ${by}`, fields.join(', '));
    printResult({ slug, command: 'fill', fields: fields.join(', '), by });
    return;
  }
  if (!STAGES.includes(stage)) {
    die(`Unknown stage: ${stage}`);
  }
  const key = stageKey(stage);
  if (command === 'start') {
    if (request[key] === 'complete') {
      die(
        `Refusing to restart a complete ${stage} block. next.mjs reopens a stage when the loop says so.`,
      );
    }
    request[key] = 'active';
    saveRequest(slug, request);
    appendLog(
      slug,
      `${stage} start`,
      `status: active${by ? `\nby: ${by}` : ''}`,
    );
    printResult({ slug, command: 'start', stage });
    return;
  }
  if (command === 'complete') {
    if (request[key] === 'complete') {
      die(
        `${stage} is already complete. This script does not edit another pass over that block.`,
      );
    }
    for (const expression of sets) {
      assignSet(request, expression, { allowCritical: false, by });
    }
    if (
      stage === 'frame' &&
      request.prototype !== 'scenes' &&
      request.prototype !== 'none'
    ) {
      die(
        'complete frame requires --set prototype=scenes or --set prototype=none.',
      );
    }
    if (stage === 'frame' || stage === 'handoff') {
      const risk = loadYaml(path.join(repoRoot, 'design', 'risk.yaml'));
      let score = 0;
      for (const flag of request.risk_flags || []) {
        if (risk.flags[flag] == null) {
          die(`Unknown risk flag: ${flag}`);
        }
        score += Number(risk.flags[flag]);
      }
      request.risk_score = score;
      request.approval_required = score >= 2 ? 'designer' : 'pm-or-eng';
    }
    if (stage === 'research' && request.frame_invalid === true) {
      request.research_invalidates_frame = true;
      request.research_invalidation_applied = false;
    }
    if (
      stage === 'explore' &&
      request.explorer_pick == null &&
      request.recommended_option
    ) {
      request.explorer_pick = request.recommended_option;
    }
    const expected =
      stage === 'handoff'
        ? request.tier === 'tweak'
          ? 'design-note.md'
          : 'handoff.md'
        : null;
    if (expected && !fs.existsSync(path.join(packetDir(slug), expected))) {
      die(
        `complete handoff requires design/${slug}/${expected} to exist first.`,
      );
    }
    request[key] = 'complete';
    saveRequest(slug, request);
    appendLog(slug, `${stage} complete`, sets.join('\n') || 'status: complete');
    printResult({ slug, command: 'complete', stage });
    return;
  }
  die(`Unknown stage command: ${command}`);
}

if (isMain()) {
  main();
}
