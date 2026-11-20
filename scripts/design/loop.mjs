import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendLog,
  loadRequest,
  loadRubric,
  majority,
  mean,
  median,
  packetDir,
  parseOptionsSample,
  parseScoreTable,
  printResult,
  saveRequest,
  scorePasses,
  die,
} from './lib.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

export function optionEligible(scores, rubric) {
  const ids = rubric.lines.map((line) => line.id);
  if (ids.some((id) => scores[id] == null)) {
    return false;
  }
  if (ids.some((id) => scores[id] < rubric.eligible.minLine)) {
    return false;
  }
  if (
    rubric.eligible.mustPass.some(
      (id) => scores[id] < rubric.eligible.mustPassMin,
    )
  ) {
    return false;
  }
  return mean(ids.map((id) => scores[id])) >= rubric.eligible.meanMin;
}

export function lines16Pass(scores) {
  return scores && scores[1] >= 4 && scores[6] >= 4;
}

function highestMean(options, scoresByOption, explorerPick) {
  let best = null;
  let bestMean = -1;
  for (const option of options) {
    const values = Object.values(scoresByOption[option] || {});
    const value = mean(values);
    if (value > bestMean) {
      best = option;
      bestMean = value;
    } else if (value === bestMean && option === explorerPick) {
      best = option;
    }
  }
  return best;
}

export function decideOptions(input) {
  const {
    round,
    phase,
    scoresByOption,
    preferred,
    sendBackTo,
    explorerPick,
    refineUsed,
    backEdgeResearch,
    backEdgeFrame,
    lateBackEdge,
    refinedOption,
    rubric,
  } = input;
  const lastExploreRound = lateBackEdge ? 3 : 2;
  const optionIds = Object.keys(scoresByOption);
  const eligible = optionIds.filter((option) =>
    optionEligible(scoresByOption[option], rubric),
  );
  const preferredEligible = preferred && eligible.includes(preferred);

  if (phase === 'refine') {
    if (eligible.length === 0) {
      return {
        action: 'escalate',
        reason: 'The refine round left no eligible option.',
      };
    }
    const recommend = eligible.includes(refinedOption)
      ? refinedOption
      : eligible[0];
    return {
      action: 'pass',
      recommend,
      eligible,
      fallback: eligible.filter((option) => option !== recommend),
    };
  }

  if (eligible.length && preferredEligible) {
    return { action: 'pass', recommend: preferred, eligible, fallback: [] };
  }

  if (
    eligible.length &&
    preferred &&
    lines16Pass(scoresByOption[preferred]) &&
    !refineUsed
  ) {
    return {
      action: 'refine',
      option: preferred,
      eligible,
      fallback: eligible,
      reason:
        'Preferred option is not eligible, and lines 1 and 6 are at 4 or more.',
    };
  }

  if (eligible.length) {
    const amongEligible = highestMean(eligible, scoresByOption, explorerPick);
    return { action: 'pass', recommend: amongEligible, eligible, fallback: [] };
  }

  if (round === 1 || round < lastExploreRound) {
    return {
      action: 'back-edge',
      target: sendBackTo || 'explore',
      reason: 'No option is eligible.',
      eligible,
    };
  }

  if ((sendBackTo === 'research' || sendBackTo === 'frame') && !lateBackEdge) {
    const used = sendBackTo === 'research' ? backEdgeResearch : backEdgeFrame;
    if (!used) {
      return {
        action: 'late-back-edge',
        target: sendBackTo,
        reason: 'An unused back-edge still wins over a refine.',
        eligible,
      };
    }
  }

  const refinable = optionIds.filter((option) =>
    lines16Pass(scoresByOption[option]),
  );
  if (refinable.length && !refineUsed) {
    const option =
      preferred && refinable.includes(preferred)
        ? preferred
        : highestMean(refinable, scoresByOption, explorerPick);
    return {
      action: 'refine',
      option,
      eligible,
      fallback: [],
      reason:
        'No option is eligible. Refining the best option that passes lines 1 and 6.',
    };
  }

  return {
    action: 'escalate',
    reason: 'No option is eligible and no legal back-edge or refine remains.',
    eligible,
  };
}

function sampleFiles(dir, prefix) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.md'))
    .sort()
    .map((name) => path.join(dir, name));
}

function mergeLineScores(samples, lineIds) {
  const merged = {};
  for (const id of lineIds) {
    const values = samples
      .map((sample) => sample[id])
      .filter((score) => score != null);
    if (!values.length) {
      continue;
    }
    merged[id] = median(values);
  }
  return merged;
}

function readCritiqueSamples(slug, round) {
  const dir = path.join(packetDir(slug), 'rounds', String(round));
  return sampleFiles(dir, 'critique.sample-').map((file) => {
    const rows = parseScoreTable(fs.readFileSync(file, 'utf8'));
    const scores = {};
    for (const row of rows) {
      scores[row.id] = row.score;
    }
    return { file, scores };
  });
}

export function verdictForScores(
  current,
  previous,
  previousBlockers,
  blockerCount,
  rubricLines,
  riskScore,
) {
  const rubricPass = scorePasses(current, rubricLines, riskScore);
  const regression = [];
  if (previous) {
    for (const line of rubricLines) {
      const before = Number(previous[line.id]);
      const after = Number(current[line.id]);
      if (!before || !after) {
        continue;
      }
      const must =
        line.must_pass === true ||
        (line.must_pass === 'risk>=2' && riskScore >= 2);
      const wasPassing = before >= 3 && (!must || before >= 4);
      const nowPassing = after >= 3 && (!must || after >= 4);
      if (wasPassing && !nowPassing) {
        regression.push(line.id);
      }
    }
  }
  if (regression.length) {
    return { verdict: 'regression', lines: regression, rubricPass };
  }
  if (rubricPass.ok && blockerCount === 0) {
    return { verdict: 'pass', rubricPass };
  }
  if (previous) {
    let improved = false;
    for (const line of rubricLines) {
      if (
        previous[line.id] != null &&
        current[line.id] > Number(previous[line.id])
      ) {
        improved = true;
      }
    }
    const fewerBlockers =
      previousBlockers != null && blockerCount < Number(previousBlockers);
    if (!improved && !fewerBlockers) {
      return { verdict: 'plateau', rubricPass };
    }
  }
  return { verdict: 'iterate', rubricPass };
}

function personaBlockerCount(slug, round) {
  const dir = path.join(packetDir(slug), 'rounds', String(round));
  const files = sampleFiles(dir, 'persona.');
  let blockers = 0;
  let incomplete = 0;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    const completed = /completed:\s*true/i.test(text);
    const open = /blocker:\s*true/i.test(text);
    if (!completed) {
      incomplete += 1;
    }
    if (open) {
      blockers += 1;
    }
  }
  return { files: files.length, blockers, incomplete };
}

function writeMerged(file, title, body) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, `${title}\n\n${body.trim()}\n`);
}

function mergeCritique(slug) {
  const request = loadRequest(slug);
  const rubric = loadRubric().prototype;
  const round = request.build_round;
  const samples = readCritiqueSamples(slug, round);
  if (!samples.length) {
    die(`No critique samples for round ${round}.`);
  }
  const first = scorePasses(
    samples[0].scores,
    rubric.lines,
    request.risk_score || 0,
  );
  if (samples.length < 3 && first.ok) {
    die(
      'merge-critique refuses to pass a round on one sample. Two more fresh samples are required.',
    );
  }
  if (samples.length < 3 && !first.ok && samples.length !== 1) {
    die(
      'A failing first sample stands alone. Do not merge a partial confirmation set.',
    );
  }
  const merged = mergeLineScores(
    samples.map((sample) => sample.scores),
    rubric.lines.map((line) => line.id),
  );
  const personas = personaBlockerCount(slug, round);
  if (personas.files === 0) {
    die(
      'merge-critique needs the persona samples for this round before a verdict.',
    );
  }
  const decision = verdictForScores(
    merged,
    request.last_scores && Object.keys(request.last_scores).length
      ? request.last_scores
      : null,
    request.previous_blockers,
    personas.blockers + personas.incomplete,
    rubric.lines,
    request.risk_score || 0,
  );
  const passed =
    decision.verdict === 'pass' &&
    personas.blockers === 0 &&
    personas.incomplete === 0;
  const verdict = passed
    ? 'pass'
    : decision.verdict === 'pass'
      ? 'iterate'
      : decision.verdict;
  request.previous_scores = request.last_scores || {};
  request.previous_blockers = personas.blockers + personas.incomplete;
  request.last_scores = merged;
  request.last_verdict = verdict;
  saveRequest(slug, request);
  const rows = rubric.lines
    .map((line) => `| ${line.id} | ${line.name} | ${merged[line.id]} |`)
    .join('\n');
  writeMerged(
    path.join(packetDir(slug), 'critique.md'),
    `# Critique: ${slug}, round ${round}`,
    `| # | Line | Median |\n|---|---|---|\n${rows}\n\nverdict: ${verdict}\npersona_blockers: ${personas.blockers}\npersona_incomplete: ${personas.incomplete}\n`,
  );
  appendLog(slug, `merge-critique round ${round}`, `verdict: ${verdict}`);
  printResult({ slug, command: 'merge-critique', verdict, round });
}

function mergeCritiqueOptions(slug) {
  const request = loadRequest(slug);
  const rubric = loadRubric().options;
  const round = request.options_round || 1;
  const dir = path.join(packetDir(slug), 'rounds', `options-${round}`);
  const files = sampleFiles(dir, 'critique-options.sample-');
  if (files.length < 3) {
    die(`merge-critique-options needs 3 samples, found ${files.length}.`);
  }
  const parsed = files.map((file) =>
    parseOptionsSample(fs.readFileSync(file, 'utf8')),
  );
  const optionIds = [
    ...new Set(parsed.flatMap((sample) => Object.keys(sample.options))),
  ];
  const scoresByOption = {};
  for (const option of optionIds) {
    const perLine = {};
    for (const line of rubric.lines) {
      const values = parsed
        .map((sample) => sample.options[option]?.[line.id])
        .filter((score) => score != null);
      if (values.length) {
        perLine[line.id] = median(values);
      }
    }
    if (
      request.options_phase === 'refine' &&
      perLine[2] == null &&
      request.last_option_scores?.[option]?.[2] != null
    ) {
      perLine[2] = request.last_option_scores[option][2];
    }
    scoresByOption[option] = perLine;
  }
  const preferred =
    majority(parsed.map((sample) => sample.recommended)) ||
    request.explorer_pick ||
    optionIds[0];
  const sendBack = majority(parsed.map((sample) => sample.sendBack));
  const decision = decideOptions({
    round,
    phase: request.options_phase || 'explore',
    scoresByOption,
    preferred,
    sendBackTo: sendBack,
    explorerPick: request.explorer_pick,
    refineUsed: Boolean(request.refine_used),
    backEdgeResearch: Boolean(request.back_edge_research),
    backEdgeFrame: Boolean(request.back_edge_frame),
    lateBackEdge: Boolean(request.late_back_edge),
    refinedOption: request.refine_option,
    rubric,
  });
  request.last_option_scores = scoresByOption;
  request.options_decision = decision.action;
  request.recommended_option = decision.recommend || null;
  request.eligible_options = decision.eligible || [];
  request.fallback_options = decision.fallback || [];
  request.options_target = decision.target || decision.option || null;
  request.options_reason = decision.reason || '';
  if (decision.action === 'refine') {
    request.refine_option = decision.option;
  }
  saveRequest(slug, request);
  const sections = optionIds
    .map((option) => {
      const rows = rubric.lines
        .map(
          (line) =>
            `| ${line.id} | ${line.name} | ${scoresByOption[option][line.id] ?? ''} |`,
        )
        .join('\n');
      return `## Option ${option}\n\n| # | Line | Median |\n|---|---|---|\n${rows}\n`;
    })
    .join('\n');
  writeMerged(
    path.join(packetDir(slug), 'critique-options.md'),
    `# Options critique: ${slug}, round ${round}`,
    `${sections}\npreferred: ${preferred}\ndecision: ${decision.action}\nrecommend: ${decision.recommend || ''}\ntarget: ${decision.target || decision.option || ''}\n`,
  );
  appendLog(
    slug,
    `merge-critique-options round ${round}`,
    `decision: ${decision.action}`,
  );
  printResult({
    slug,
    command: 'merge-critique-options',
    decision: decision.action,
    target: decision.target || decision.option || null,
  });
}

function mergePersona(slug) {
  const request = loadRequest(slug);
  const round = request.build_round;
  const info = personaBlockerCount(slug, round);
  if (!info.files) {
    die('No persona samples to merge.');
  }
  const dir = path.join(packetDir(slug), 'rounds', String(round));
  const body = sampleFiles(dir, 'persona.')
    .map(
      (file) =>
        `## ${path.basename(file)}\n\n${fs.readFileSync(file, 'utf8').trim()}`,
    )
    .join('\n\n');
  writeMerged(
    path.join(packetDir(slug), 'persona.md'),
    `# Persona: ${slug}, round ${round}`,
    body,
  );
  appendLog(
    slug,
    `merge-persona round ${round}`,
    `samples: ${info.files} blockers: ${info.blockers}`,
  );
  printResult({
    slug,
    command: 'merge-persona',
    samples: info.files,
    blockers: info.blockers,
  });
}

function mergeVerify(slug) {
  const request = loadRequest(slug);
  const attempt = request.verify_round || 1;
  const dir = path.join(packetDir(slug), 'rounds', `verify-${attempt}`);
  const files = sampleFiles(dir, 'verify.sample-');
  if (files.length < 3) {
    die(`merge-verify needs 3 samples, found ${files.length}.`);
  }
  const rubric = loadRubric().prototype;
  const samples = files.map((file) => {
    const scores = {};
    for (const row of parseScoreTable(fs.readFileSync(file, 'utf8'))) {
      scores[row.id] = row.score;
    }
    return scores;
  });
  const merged = mergeLineScores(
    samples,
    rubric.lines.map((line) => line.id),
  );
  const result = scorePasses(merged, rubric.lines, request.risk_score || 0);
  request.last_verify_scores = merged;
  request.last_verify_pass = result.ok;
  if (!result.ok) {
    request.verify_repairs = (request.verify_repairs || 0) + 1;
  }
  saveRequest(slug, request);
  const rows = rubric.lines
    .map((line) => `| ${line.id} | ${line.name} | ${merged[line.id]} |`)
    .join('\n');
  writeMerged(
    path.join(packetDir(slug), 'verify.md'),
    `# Verify: ${slug}, attempt ${attempt}`,
    `| # | Line | Median |\n|---|---|---|\n${rows}\n\npass: ${result.ok}\nreason: ${result.reason}\nrepairs: ${request.verify_repairs || 0}\n`,
  );
  appendLog(slug, `merge-verify attempt ${attempt}`, `pass: ${result.ok}`);
  printResult({
    slug,
    command: 'merge-verify',
    pass: result.ok,
    repairs: request.verify_repairs || 0,
  });
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--json');
  const [slug, command] = args;
  if (!slug || !command) {
    die(
      'usage: node scripts/design/loop.mjs <slug> merge-critique-options|merge-critique|merge-persona|merge-verify',
    );
  }
  if (command === 'merge-critique-options') {
    mergeCritiqueOptions(slug);
  } else if (command === 'merge-critique') {
    mergeCritique(slug);
  } else if (command === 'merge-persona') {
    mergePersona(slug);
  } else if (command === 'merge-verify') {
    mergeVerify(slug);
  } else {
    die(`Unknown loop command: ${command}`);
  }
}

if (isMain()) {
  main();
}
