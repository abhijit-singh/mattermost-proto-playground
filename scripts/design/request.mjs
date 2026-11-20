import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendLog,
  die,
  isBlank,
  kebab,
  nowIso,
  packetDir,
  parseYaml,
  printResult,
  readText,
  saveRequest,
  writeText,
} from './lib.mjs';
import { triageText } from './triage.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

function frontmatter(text) {
  const match = String(text).match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) {
    return {};
  }
  return parseYaml(match[1]);
}

function asText(value) {
  if (value == null) {
    return null;
  }
  if (Array.isArray(value)) {
    return value.map((item) => String(item)).join('; ');
  }
  return String(value);
}

export function classifySource(ref, text) {
  if (/^https?:\/\//.test(ref)) {
    return ref.includes('/pull/') ? 'pr' : 'issue';
  }
  if (/^[A-Z][A-Z0-9]+-\d+$/.test(ref)) {
    return 'jira';
  }
  if (/\.ya?ml$/.test(ref) || /^\s*ask:/m.test(text)) {
    return 'seed';
  }
  return 'brief';
}

function modeFor(kind, text, flags) {
  if (flags.autopilot) {
    return 'autopilot';
  }
  if (flags.gated || /design:gated/.test(text)) {
    return 'gated';
  }
  if (kind === 'brief' || kind === 'seed') {
    return 'gated';
  }
  return 'autopilot';
}

export function buildRequest({ ref, text, flags }) {
  const meta = frontmatter(text);
  const kind = flags.kind || classifySource(ref, text);
  const triaged = triageText(text, {
    tier: flags.tier,
    size: flags.size,
    compliance: flags.compliance,
  });
  const slug = kebab(
    flags.slug ||
      meta.slug ||
      path.basename(ref, path.extname(ref)) ||
      'effort',
  );
  return {
    triaged,
    request: {
      slug,
      title: asText(meta.title) || slug,
      source_kind: kind,
      source_ref: ref,
      source_fetch:
        flags.fetch || (fs.existsSync(ref) ? 'local' : 'not-fetched'),
      tier: triaged.tier,
      size: triaged.size,
      rounds_max: triaged.roundsMax,
      compliance: triaged.compliance,
      mode: modeFor(kind, text, flags),
      rules_fired: triaged.rulesFired,
      size_signals: triaged.signals,
      prototype: null,
      risk_flags: [],
      risk_score: 0,
      approval_required: 'pm-or-eng',
      outcome_headline: asText(meta.outcome_headline || meta.outcome),
      users: asText(meta.users),
      customer_words: asText(meta.customer_words),
      decider: asText(meta.decider),
      lighthouse_name: asText(meta.lighthouse_name),
      verified: asText(meta.verified),
      needs_confirmation: [],
      stage_frame: 'pending',
      stage_research: 'pending',
      stage_explore: 'pending',
      stage_critique_options: 'pending',
      stage_build: 'pending',
      stage_critique: 'pending',
      stage_persona: 'pending',
      stage_verify: 'pending',
      stage_handoff: 'pending',
      stage_check: 'pending',
      frame_invalidations: 0,
      research_invalidates_frame: false,
      research_invalidation_applied: false,
      options_round: 0,
      options_phase: 'explore',
      options_decision: null,
      options_applied: false,
      refine_used: false,
      refine_option: null,
      back_edge_research: false,
      back_edge_frame: false,
      late_back_edge: false,
      recommended_option: null,
      chosen_option: null,
      chosen_by: null,
      eligible_options: [],
      fallback_options: [],
      explorer_pick: null,
      build_round: 0,
      verify_round: 0,
      verify_repairs: 0,
      verify_repair_open: false,
      last_verdict: null,
      last_scores: {},
      previous_scores: {},
      previous_blockers: null,
      regression_pending: false,
      check_ok: false,
      check_ran: false,
      stop: null,
      stop_reason: null,
      prs: 0,
      started_at: nowIso(),
      budget_minutes: 90,
    },
  };
}

function readGithub(ref) {
  const match = String(ref).match(
    /github\.com\/([^/\s]+)\/([^/\s]+)\/(issues|pull)\/(\d+)/,
  );
  if (!match) {
    return null;
  }
  const [, owner, repo, kind, number] = match;
  try {
    const out = execFileSync(
      'gh',
      [
        kind === 'pull' ? 'pr' : 'issue',
        'view',
        number,
        '--repo',
        `${owner}/${repo}`,
        '--json',
        'title,body',
      ],
      {
        timeout: 15000,
        encoding: 'utf8',
        stdio: ['ignore', 'pipe', 'pipe'],
        env: {
          ...process.env,
          GIT_TERMINAL_PROMPT: '0',
          GH_PROMPT_DISABLED: '1',
        },
      },
    );
    const json = JSON.parse(out);
    return `${json.title || ''}\n\n${json.body || ''}`;
  } catch {
    return null;
  }
}

function parseFlags(argv) {
  const flags = { set: [] };
  const positionals = [];
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--json') {
      continue;
    }
    if (arg === '--gated') {
      flags.gated = true;
    } else if (arg === '--autopilot') {
      flags.autopilot = true;
    } else if (arg === '--tier') {
      flags.tier = argv[++i];
    } else if (arg === '--size') {
      flags.size = argv[++i];
    } else if (arg === '--compliance') {
      flags.compliance = argv[++i];
    } else if (arg === '--slug') {
      flags.slug = argv[++i];
    } else if (!arg.startsWith('--')) {
      positionals.push(arg);
    } else {
      die(`Unknown flag: ${arg}`);
    }
  }
  return { flags, positionals };
}

function main() {
  const { flags, positionals } = parseFlags(process.argv.slice(2));
  const ref = positionals[0];
  if (!ref) {
    die(
      'usage: npm run design:request -- <source> [--gated|--autopilot] [--tier X] [--size X] [--compliance on|off]',
    );
  }
  let text = ref;
  if (fs.existsSync(ref)) {
    text = readText(ref);
    flags.fetch = 'local';
  } else {
    const remote = readGithub(ref);
    if (remote) {
      text = remote;
      flags.fetch = 'github-read';
    } else {
      flags.fetch = 'not-fetched';
    }
  }
  const { request, triaged } = buildRequest({ ref, text, flags });
  if (!request.tier) {
    printResult({
      tier: null,
      rules: triaged.rulesFired.join('; '),
      reason: triaged.tierReason,
    });
    process.exit(2);
  }
  const dir = packetDir(request.slug);
  if (fs.existsSync(path.join(dir, 'request.yaml'))) {
    die(`design/${request.slug}/ already exists. Refusing to overwrite it.`);
  }
  fs.mkdirSync(dir, { recursive: true });
  saveRequest(request.slug, request);
  writeText(
    path.join(dir, 'source.json'),
    JSON.stringify(
      {
        source_kind: request.source_kind,
        source_ref: request.source_ref,
        source_fetch: request.source_fetch,
        text,
      },
      null,
      2,
    ),
  );
  appendLog(
    request.slug,
    'intake',
    [
      `tier: ${request.tier}`,
      `size: ${request.size}`,
      `rounds_max: ${request.rounds_max}`,
      `compliance: ${request.compliance}`,
      `mode: ${request.mode}`,
      `rules: ${request.rules_fired.join('; ')}`,
      'Posted nothing. Wrote nothing outside this packet.',
    ].join('\n'),
  );
  if (request.tier === 'skip') {
    request.stop = 'skip';
    request.stop_reason = triaged.tierReason;
    request.stage_frame = 'skipped';
    saveRequest(request.slug, request);
    writeText(
      path.join(dir, 'decision.md'),
      `# Decision\n\ntier: skip\nreason: ${triaged.tierReason}\nrules: ${request.rules_fired.join('; ')}\nsource: ${ref}\n`,
    );
  }
  const criticalMissing = [
    'outcome_headline',
    'users',
    'customer_words',
    'decider',
  ].filter((field) => isBlank(request[field]));
  printResult({
    slug: request.slug,
    tier: request.tier,
    size: request.size,
    rounds_max: request.rounds_max,
    compliance: request.compliance,
    mode: request.mode,
    stop: request.stop,
    missing_critical: criticalMissing.join(', '),
    rules: request.rules_fired.join('; '),
  });
}

if (isMain()) {
  main();
}
