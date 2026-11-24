import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  CRITICAL_FIELDS,
  appendLog,
  die,
  isBlank,
  kebab,
  loadYaml,
  nowIso,
  packetDir,
  parseYaml,
  printResult,
  saveRequest,
  writeText,
} from './lib.mjs';
import { gateTriage } from './gate.mjs';
import {
  printIdentity,
  proveCheckout,
  runStarter,
  stopLine,
} from './prove.mjs';
import { readFullSource } from './source.mjs';
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
  const request = {
    slug,
    title: asText(meta.title) || slug,
    source_kind: kind,
    source_ref: ref,
    source_fetch: flags.fetch || (fs.existsSync(ref) ? 'local' : 'not-fetched'),
    tier: null,
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
    outcome_headline: null,
    users: null,
    customer_words: null,
    decider: flags.starter || null,
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
    inferred_fields: [],
    inference_unreliable: [],
    signals: [],
    designer_recommendation: null,
    commit: flags.commit || null,
    design_pass_version: flags.version || null,
  };
  const gated = gateTriage({
    text,
    triage: flags.proposal,
    overrides: { tier: flags.tier },
    starter: request.decider || flags.starter,
  });
  request.signals = gated.signals || [];
  request.rules_fired = [
    ...triaged.rulesFired,
    ...(gated.signals || []).map(
      (item) => `signal:${item.kind}:${item.tier}:${item.hits.join('+')}`,
    ),
  ];
  if (!gated.ok) {
    request.tier = gated.tier || null;
    request.stop = 'escalate';
    request.stop_reason = gated.stopReason;
    return { triaged, request, gated };
  }
  request.tier = gated.tier;
  request.size = gated.size;
  request.rounds_max = gated.roundsMax;
  request.compliance = gated.compliance;
  request.designer_recommendation = gated.designerRecommendation;
  request.decider = gated.decider;
  if (gated.outcome) {
    request.outcome_headline = `[INFERRED] ${gated.outcome}`;
    request.inferred_fields.push('outcome_headline');
    request.needs_confirmation.push({
      field: 'outcome_headline',
      value: request.outcome_headline,
      added_by: 'triage',
    });
  }
  if (gated.users) {
    request.users = `[INFERRED] ${gated.users}`;
    request.inferred_fields.push('users');
  }
  if (gated.customerWords) {
    request.customer_words = `[INFERRED] ${gated.customerWords}`;
    request.inferred_fields.push('customer_words');
  }
  return { triaged, request, gated };
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
    } else if (arg === '--source-file') {
      flags.sourceFile = argv[++i];
    } else if (arg === '--proposal') {
      flags.proposalPath = argv[++i];
    } else if (!arg.startsWith('--')) {
      positionals.push(arg);
    } else {
      die(`Unknown flag: ${arg}`);
    }
  }
  return { flags, positionals };
}

function main() {
  const id = proveCheckout();
  const { flags, positionals } = parseFlags(process.argv.slice(2));
  const ref = positionals[0];
  if (!ref) {
    die(
      'usage: npm run design:request -- <source> [--gated|--autopilot] [--tier X] [--size X] [--compliance on|off]',
    );
  }
  flags.starter = runStarter();
  flags.commit = id.sha;
  flags.version = id.version;
  if (flags.proposalPath) {
    const proposalText = fs.readFileSync(flags.proposalPath, 'utf8');
    flags.proposal = proposalText.trim().startsWith('{')
      ? JSON.parse(proposalText)
      : loadYaml(flags.proposalPath);
  } else {
    const guessed = kebab(flags.slug || path.basename(ref, path.extname(ref)));
    const candidate = path.join(packetDir(guessed), 'triage.json');
    if (fs.existsSync(candidate)) {
      const proposalText = fs.readFileSync(candidate, 'utf8');
      flags.proposal = proposalText.trim().startsWith('{')
        ? JSON.parse(proposalText)
        : loadYaml(candidate);
    }
  }
  const read = readFullSource(ref, flags.sourceFile);
  if (read.fetch === 'unreadable') {
    console.log(
      stopLine({
        stop: 'escalate',
        reason: 'The source was unreadable.',
        sha: id.sha,
      }),
    );
    process.exit(2);
  }
  if (!flags.proposal) {
    console.log(
      stopLine({
        stop: 'escalate',
        reason:
          'triage.json is missing. The triage agent has not proposed. Keyword matches are signals and do not decide the tier.',
        sha: id.sha,
      }),
    );
    process.exit(2);
  }
  flags.fetch = read.fetch;
  const { request, triaged } = buildRequest({ ref, text: read.text, flags });
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
        text: read.text,
      },
      null,
      2,
    ),
  );
  appendLog(
    request.slug,
    'intake',
    [
      `commit: ${request.commit}`,
      `design_pass_version: ${request.design_pass_version}`,
      `tier: ${request.tier}`,
      `size: ${request.size}`,
      `rounds_max: ${request.rounds_max}`,
      `compliance: ${request.compliance}`,
      `mode: ${request.mode}`,
      `decider: ${request.decider}`,
      `rules: ${request.rules_fired.join('; ')}`,
      'Posted nothing. Wrote nothing outside this packet.',
    ].join('\n'),
  );
  if (request.tier === 'skip') {
    if (!request.stop) {
      request.stop = 'skip';
      request.stop_reason = 'Tier is skip.';
      request.stage_frame = 'skipped';
      saveRequest(request.slug, request);
    }
    writeText(
      path.join(dir, 'decision.md'),
      `# Decision\n\ntier: skip\nreason: ${triaged.tierReason}\nrules: ${request.rules_fired.join('; ')}\nsource: ${ref}\n`,
    );
  }
  const criticalMissing = CRITICAL_FIELDS.filter((field) =>
    isBlank(request[field]),
  );
  printResult({
    slug: request.slug,
    tier: request.tier,
    size: request.size,
    rounds_max: request.rounds_max,
    compliance: request.compliance,
    mode: request.mode,
    stop: request.stop,
    stop_reason: request.stop_reason,
    inferred: (request.inferred_fields || []).join(', '),
    unreliable: (request.inference_unreliable || []).join(', '),
    missing_critical: criticalMissing.join(', '),
    rules: request.rules_fired.join('; '),
  });
  if (request.stop) {
    console.log(
      stopLine({
        stop: request.stop,
        prs: 0,
        targets: 'none',
        reason: request.stop_reason,
        sha: id.sha,
      }),
    );
    if (request.stop === 'escalate') {
      process.exit(2);
    }
  }
}

if (isMain()) {
  main();
}
