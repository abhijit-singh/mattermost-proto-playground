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
    inferred_fields: [],
    inference_unreliable: [],
  };
  applyInference(request, text, meta, flags.proposal);
  return { triaged, request };
}

function normalize(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function stripMark(value) {
  return String(value || '')
    .replace(/^\[INFERRED\]\s*/i, '')
    .trim();
}

export function groundedIn(value, text) {
  const needle = normalize(stripMark(value));
  if (!needle) {
    return false;
  }
  return normalize(text).includes(needle);
}

function labeledValue(text, label) {
  const match = String(text).match(new RegExp(`^\\s*${label}:\\s*(.+)$`, 'im'));
  if (!match) {
    return '';
  }
  const value = match[1].trim();
  if (!value || /^(null|~|unassigned)$/i.test(value)) {
    return '';
  }
  return value;
}

function uniquePeople(text) {
  const names = ['reporter', 'assignee', 'creator']
    .map((label) => labeledValue(text, label))
    .filter(Boolean);
  return [...new Set(names)];
}

export function proposeFromSource(text, meta) {
  const proposal = {
    outcome_headline: null,
    decider: null,
    users: null,
    customer_words: null,
    outcome_inferred: false,
    decider_inferred: false,
    users_inferred: false,
    customer_words_inferred: false,
  };
  if (!isBlank(meta.outcome_headline) || !isBlank(meta.outcome)) {
    proposal.outcome_headline = asText(meta.outcome_headline || meta.outcome);
  } else {
    const expected = String(text).match(/\*{0,2}expected:\*{0,2}\s*(.+)/i);
    const summary = labeledValue(text, 'summary');
    const withoutFrontmatter = String(text).replace(
      /^---\r?\n[\s\S]*?\r?\n---\r?\n?/,
      '',
    );
    const heading = withoutFrontmatter.match(/^#\s+(.+)$/m);
    const paragraph = withoutFrontmatter
      .split(/\r?\n/)
      .map((line) => line.trim())
      .find((line) => line && !line.startsWith('#'));
    const candidate = expected
      ? expected[1].trim()
      : summary || (heading ? heading[1].trim() : paragraph || '');
    if (candidate && groundedIn(candidate, text)) {
      proposal.outcome_headline = candidate;
      proposal.outcome_inferred = true;
    }
  }
  if (!isBlank(meta.decider)) {
    proposal.decider = asText(meta.decider);
  } else {
    const explicit = labeledValue(text, 'decider');
    if (explicit && groundedIn(explicit, text)) {
      proposal.decider = explicit;
      proposal.decider_inferred = true;
    } else {
      const people = uniquePeople(text);
      if (people.length === 1 && groundedIn(people[0], text)) {
        proposal.decider = people[0];
        proposal.decider_inferred = true;
      }
    }
  }
  if (!isBlank(meta.users)) {
    proposal.users = asText(meta.users);
  } else {
    const users = labeledValue(text, 'users');
    if (users && groundedIn(users, text)) {
      proposal.users = users;
      proposal.users_inferred = true;
    }
  }
  if (!isBlank(meta.customer_words)) {
    proposal.customer_words = asText(meta.customer_words);
  } else {
    const words = labeledValue(text, 'customer words');
    const said = String(text).match(
      /(?:customer|user)s?\s+said:\s*["“]([^"”]+)["”]/i,
    );
    const quote = words || (said ? said[1].trim() : '');
    if (quote && groundedIn(quote, text)) {
      proposal.customer_words = quote;
      proposal.customer_words_inferred = true;
    }
  }
  return proposal;
}

export function acceptProposal(proposal, text) {
  const problems = [];
  if (!proposal || !groundedIn(proposal.outcome_headline, text)) {
    problems.push('outcome_headline');
  }
  if (!proposal || !groundedIn(proposal.decider, text)) {
    problems.push('decider');
  }
  if (proposal && proposal.users && !groundedIn(proposal.users, text)) {
    problems.push('users');
  }
  if (
    proposal &&
    proposal.customer_words &&
    !groundedIn(proposal.customer_words, text)
  ) {
    problems.push('customer_words');
  }
  return problems;
}

function markInferred(request, field, value) {
  request[field] = `[INFERRED] ${value}`;
  request.inferred_fields.push(field);
  request.needs_confirmation.push({
    field,
    value: request[field],
    added_by: 'intake',
  });
}

function applyProposal(request, proposal) {
  const fields = [
    ['outcome_headline', 'outcome_inferred'],
    ['decider', 'decider_inferred'],
    ['users', 'users_inferred'],
    ['customer_words', 'customer_words_inferred'],
  ];
  for (const [field, inferredFlag] of fields) {
    if (isBlank(proposal[field])) {
      continue;
    }
    if (proposal[inferredFlag]) {
      markInferred(request, field, stripMark(proposal[field]));
    } else if (isBlank(request[field])) {
      request[field] = stripMark(proposal[field]);
    }
  }
  const missing = ['outcome_headline', 'decider'].filter((field) =>
    isBlank(request[field]),
  );
  request.inference_unreliable = missing;
  if (missing.length > 0) {
    request.stop = 'escalate';
    request.stop_reason = `Cannot ground ${missing.join(', ')} in the source.`;
  }
}

function applyInference(request, text, meta, proposal) {
  if (!request.tier) {
    return;
  }
  const chosen = proposal || proposeFromSource(text, meta);
  if (proposal && proposal.tier && proposal.tier !== request.tier) {
    request.stop = 'escalate';
    request.stop_reason = `Script rejected proposed tier ${proposal.tier}. The gate decided ${request.tier}.`;
    return;
  }
  const problems = acceptProposal(chosen, text);
  if (problems.length > 0) {
    request.stop = 'escalate';
    request.inference_unreliable = problems;
    const invented = problems.filter(
      (field) => field === 'users' || field === 'customer_words',
    );
    request.stop_reason = invented.length
      ? `Script rejected ${invented.join(', ')}. Those values are not in the source.`
      : `Cannot ground ${problems.join(', ')} in the source.`;
    return;
  }
  applyProposal(request, chosen);
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
  const { flags, positionals } = parseFlags(process.argv.slice(2));
  const ref = positionals[0];
  if (!ref) {
    die(
      'usage: npm run design:request -- <source> [--gated|--autopilot] [--tier X] [--size X] [--compliance on|off]',
    );
  }
  if (flags.proposalPath) {
    flags.proposal = loadYaml(flags.proposalPath);
  }
  const read = readFullSource(ref, flags.sourceFile);
  if (read.fetch === 'unreadable') {
    printResult({
      source: ref,
      stop: 'unreadable',
      reason: 'The source was unreadable.',
    });
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
    if (!request.stop) {
      request.stop = 'skip';
      request.stop_reason = triaged.tierReason;
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
}

if (isMain()) {
  main();
}
