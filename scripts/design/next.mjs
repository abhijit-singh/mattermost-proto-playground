import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendLog,
  die,
  loadRequest,
  loadRubric,
  minutesSince,
  missingCritical,
  packetDir,
  parseScoreTable,
  personaProfiles,
  saveRequest,
  scorePasses,
  stageModel,
} from './lib.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

function agentStep(stage, extra = {}) {
  const model = stageModel(stage);
  return {
    kind: 'agent',
    next: stage,
    agent: model.agent,
    modelName: model.name,
    modelId: model.modelId,
    modelClass: model.class,
    ...extra,
  };
}

function scriptStep(name, command, extra = {}) {
  return {
    kind: 'script',
    next: name,
    agent: null,
    command,
    ...extra,
  };
}

function stopStep(stop, reason, extra = {}) {
  return {
    kind: 'stop',
    stop,
    reason,
    agent: null,
    ...extra,
  };
}

function samples(dir, prefix) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  return fs
    .readdirSync(dir)
    .filter((name) => name.startsWith(prefix) && name.endsWith('.md'))
    .sort();
}

function confirm(request, field, value, addedBy) {
  request.needs_confirmation = request.needs_confirmation || [];
  request.needs_confirmation.push({ field, value, added_by: addedBy });
}

function applyResearchInvalidation(request) {
  if (
    !request.research_invalidates_frame ||
    request.research_invalidation_applied
  ) {
    return null;
  }
  request.frame_invalidations = (request.frame_invalidations || 0) + 1;
  request.research_invalidation_applied = true;
  if (request.frame_invalidations >= 2) {
    request.stop = 'escalate';
    request.stop_reason = 'Research marked the frame invalid a second time.';
    return stopStep('escalate', request.stop_reason);
  }
  request.stage_frame = 'pending';
  request.stage_research = 'pending';
  request.stage_explore = 'pending';
  request.stage_critique_options = 'pending';
  return agentStep('frame', {
    reason: 'Research marked the frame invalid once. Frame re-runs.',
  });
}

function applyOptions(request) {
  if (!request.options_decision || request.options_applied) {
    return null;
  }
  const decision = request.options_decision;
  request.options_applied = true;
  if (decision === 'escalate') {
    request.stop = 'escalate';
    request.stop_reason =
      request.options_reason || 'Options critique escalated.';
    return stopStep('escalate', request.stop_reason);
  }
  if (decision === 'pass') {
    const eligible = request.eligible_options || [];
    if (eligible.length === 1) {
      request.chosen_option = eligible[0];
      request.chosen_by = 'sole-eligible';
      confirm(request, 'chosen_option', eligible[0], 'sole-eligible');
    } else if (request.mode === 'autopilot') {
      request.chosen_option = request.recommended_option;
      request.chosen_by = 'autopilot';
      if (
        request.explorer_pick &&
        request.explorer_pick !== request.recommended_option
      ) {
        confirm(
          request,
          'chosen_option',
          `autopilot copied ${request.recommended_option}; explorer picked ${request.explorer_pick}`,
          'autopilot',
        );
      }
    } else {
      request.options_applied = false;
      return {
        kind: 'wait',
        next: 'option-gate',
        wait: 'person',
        reason: 'Gated mode waits for a person to pick an option.',
        recommended: request.recommended_option,
      };
    }
    request.stage_critique_options = 'complete';
    return null;
  }
  if (decision === 'refine') {
    request.refine_used = true;
    request.options_phase = 'refine';
    request.stage_explore = 'pending';
    request.stage_critique_options = 'pending';
    request.options_round = (request.options_round || 1) + 1;
    request.options_decision = null;
    request.options_applied = false;
    return agentStep('explore', {
      reason: request.options_reason,
      refine: request.refine_option,
    });
  }
  if (decision === 'back-edge' || decision === 'late-back-edge') {
    const target = request.options_target || 'explore';
    if (decision === 'late-back-edge') {
      request.late_back_edge = true;
    }
    if (target === 'research') {
      request.back_edge_research = true;
      request.stage_research = 'pending';
    }
    if (target === 'frame') {
      request.back_edge_frame = true;
      request.stage_frame = 'pending';
      request.stage_research = 'pending';
    }
    request.stage_explore = 'pending';
    request.stage_critique_options = 'pending';
    request.options_phase = 'explore';
    request.options_round = (request.options_round || 1) + 1;
    request.options_decision = null;
    request.options_applied = false;
    if (target === 'frame') {
      return agentStep('frame', { reason: request.options_reason });
    }
    if (target === 'research') {
      return agentStep('research', { reason: request.options_reason });
    }
    return agentStep('explore', { reason: request.options_reason });
  }
  return stopStep('escalate', `Unknown options decision: ${decision}`);
}

function critiqueState(slug, request) {
  request.regression_pending = false;
  const round = request.build_round;
  const dir = path.join(packetDir(slug), 'rounds', String(round));
  const critique = samples(dir, 'critique.sample-');
  const persona = samples(dir, 'persona.');
  const profiles = personaProfiles();
  if (!profiles.length) {
    request.stop = 'escalate';
    request.stop_reason =
      'FY26 persona catalog is not on this branch (design/personas/).';
    return stopStep('escalate', request.stop_reason);
  }
  const wanted = profiles
    .slice(0, 2)
    .map((file) => path.basename(file, path.extname(file)));
  const missingPersonas = wanted.filter(
    (name) => !persona.some((file) => file.includes(name)),
  );
  if (!critique.length || missingPersonas.length) {
    const steps = [];
    if (!critique.length) {
      steps.push(agentStep('critique', { sample: 1 }));
    }
    for (const name of missingPersonas) {
      steps.push(agentStep('persona', { persona: name }));
    }
    return { kind: 'parallel', next: 'critique', parallel: true, steps };
  }
  const firstText = fs.readFileSync(path.join(dir, critique[0]), 'utf8');
  const firstScores = {};
  for (const row of parseScoreTable(firstText)) {
    firstScores[row.id] = row.score;
  }
  const first = scorePasses(
    firstScores,
    loadRubric().prototype.lines,
    request.risk_score || 0,
  );
  if (first.ok && critique.length < 3) {
    const steps = [];
    for (let sample = critique.length + 1; sample <= 3; sample += 1) {
      steps.push(agentStep('critique', { sample }));
    }
    return { kind: 'parallel', next: 'critique', parallel: true, steps };
  }
  const personaMerged = path.join(packetDir(slug), 'persona.md');
  const personaText = fs.existsSync(personaMerged)
    ? fs.readFileSync(personaMerged, 'utf8')
    : '';
  if (!personaText.includes(`round ${round}`)) {
    return scriptStep(
      'merge-persona',
      `node scripts/design/loop.mjs ${slug} merge-persona`,
    );
  }
  const merged = path.join(packetDir(slug), 'critique.md');
  const mergedText = fs.existsSync(merged)
    ? fs.readFileSync(merged, 'utf8')
    : '';
  if (!mergedText.includes(`round ${round}`)) {
    return scriptStep(
      'merge-critique',
      `node scripts/design/loop.mjs ${slug} merge-critique`,
    );
  }
  return null;
}

function startBuild(request) {
  if (
    (request.build_round || 0) >= request.rounds_max &&
    !request.verify_repair_open
  ) {
    request.stop = 'escalate';
    request.stop_reason = `Build round budget is spent (${request.rounds_max}).`;
    return stopStep('escalate', request.stop_reason);
  }
  request.build_round = (request.build_round || 0) + 1;
  request.verify_repair_open = false;
  request.stage_build = 'active';
  request.stage_critique = 'pending';
  request.stage_persona = 'pending';
  request.last_verdict = null;
  return agentStep('build', {
    round: request.build_round,
    regression: Boolean(request.regression_pending),
  });
}

function buildLoop(slug, request) {
  if (request.stage_build !== 'complete') {
    if (request.stage_build === 'pending') {
      return startBuild(request);
    }
    return agentStep('build', {
      round: request.build_round,
      regression: Boolean(request.regression_pending),
    });
  }
  if (request.last_verdict === 'pass') {
    return null;
  }
  if (request.last_verdict === 'regression') {
    request.regression_pending = true;
    request.stage_build = 'pending';
    return startBuild(request);
  }
  if (request.last_verdict === 'plateau') {
    request.stop = 'escalate';
    request.stop_reason =
      'Two rounds with no rubric line improving and no fewer persona blockers.';
    return stopStep('escalate', request.stop_reason);
  }
  if (request.last_verdict === 'iterate') {
    request.regression_pending = false;
    request.stage_build = 'pending';
    return startBuild(request);
  }
  return critiqueState(slug, request);
}

function optionsLoop(slug, request) {
  if ((request.options_round || 0) === 0) {
    request.options_round = 1;
    request.options_phase = 'explore';
  }
  const dir = path.join(
    packetDir(slug),
    'rounds',
    `options-${request.options_round}`,
  );
  const files = samples(dir, 'critique-options.sample-');
  if (files.length < 3) {
    const steps = [];
    for (let sample = files.length + 1; sample <= 3; sample += 1) {
      steps.push(
        agentStep('critique-options', { sample, round: request.options_round }),
      );
    }
    return {
      kind: 'parallel',
      next: 'critique-options',
      parallel: true,
      steps,
    };
  }
  const merged = path.join(packetDir(slug), 'critique-options.md');
  const text = fs.existsSync(merged) ? fs.readFileSync(merged, 'utf8') : '';
  if (!text.includes(`round ${request.options_round}`)) {
    return scriptStep(
      'merge-critique-options',
      `node scripts/design/loop.mjs ${slug} merge-critique-options`,
    );
  }
  return applyOptions(request);
}

function afterOptions(slug, request) {
  if (request.tier === 'explore') {
    return finish(slug, request);
  }
  return afterBuild(slug, request);
}

function afterBuild(slug, request) {
  const built = buildLoop(slug, request);
  if (built) {
    return built;
  }
  if ((request.verify_round || 0) === 0) {
    request.verify_round = 1;
  }
  const verifyDir = path.join(
    packetDir(slug),
    'rounds',
    `verify-${request.verify_round}`,
  );
  const verifyFiles = samples(verifyDir, 'verify.sample-');
  if (verifyFiles.length < 3) {
    const steps = [];
    for (let sample = verifyFiles.length + 1; sample <= 3; sample += 1) {
      steps.push(
        agentStep('verify', { sample, attempt: request.verify_round }),
      );
    }
    const buildName = stageModel('build').name;
    const verifyName = stageModel('verify').name;
    return {
      kind: 'parallel',
      next: 'verify',
      parallel: true,
      steps,
      note:
        verifyName === buildName
          ? 'Verify is on the same model name as build. Set DESIGN_PASS_MODEL_VERIFY to a different family.'
          : `Verify model name ${verifyName} is a different family from build ${buildName}.`,
    };
  }
  const verifyMerged = path.join(packetDir(slug), 'verify.md');
  const verifyText = fs.existsSync(verifyMerged)
    ? fs.readFileSync(verifyMerged, 'utf8')
    : '';
  if (!verifyText.includes(`attempt ${request.verify_round}`)) {
    return scriptStep(
      'merge-verify',
      `node scripts/design/loop.mjs ${slug} merge-verify`,
    );
  }
  if (request.last_verify_pass === false) {
    if ((request.verify_repairs || 0) >= 2) {
      request.stop = 'escalate';
      request.stop_reason = 'Verify failed after its one repair.';
      return stopStep('escalate', request.stop_reason);
    }
    request.verify_repair_open = true;
    request.stage_build = 'pending';
    request.stage_verify = 'pending';
    request.verify_round += 1;
    return startBuild(request);
  }
  return handoff(slug, request);
}

function handoff(slug, request) {
  if (request.stage_handoff !== 'complete') {
    return agentStep('handoff', {
      artifact: request.tier === 'tweak' ? 'design-note.md' : 'handoff.md',
    });
  }
  return finish(slug, request);
}

function finish(slug, request) {
  if (!request.check_ran || request.check_ok !== true) {
    if (request.check_ran && request.check_ok === false) {
      request.stop = 'escalate';
      request.stop_reason = 'design:check failed.';
      return stopStep('escalate', request.stop_reason);
    }
    return scriptStep('check', `npm run design:check -- ${slug} --final`);
  }
  if (
    !fs.existsSync(path.join(packetDir(slug), 'emit', 'design-complete.json'))
  ) {
    return scriptStep('emit', `npm run design:emit -- ${slug}`);
  }
  const built =
    request.tier === 'prototype' ||
    (request.tier === 'tweak' && request.prototype === 'scenes');
  request.stop = 'emit';
  request.prs = built ? 1 : 0;
  request.stop_reason = built
    ? 'Drafts are in the packet. Open one playground pull request. Do not post the source comment or the Seed.'
    : 'Drafts are in the packet. This tier does not open a pull request.';
  return stopStep('emit', request.stop_reason, {
    prs: request.prs,
    targets: built ? 'playground' : 'none',
  });
}

export function planNext(slug) {
  const request = loadRequest(slug);
  if (request.stop === 'gap' && missingCritical(request).length === 0) {
    request.stop = null;
    request.stop_reason = null;
    request.stage_frame = 'pending';
    appendLog(
      slug,
      'gap filled',
      'Critical fields are present. Frame re-runs.',
    );
  }
  if (request.stop) {
    return stopStep(request.stop, request.stop_reason || '', {
      prs: request.prs || 0,
      targets: request.prs === 1 ? 'playground' : 'none',
    });
  }
  if (minutesSince(request.started_at) >= (request.budget_minutes || 90)) {
    request.stop = 'escalate';
    request.stop_reason =
      '90 minutes have passed since intake. The script cannot see the 50 USD cap.';
    saveRequest(slug, request);
    appendLog(slug, 'budget', request.stop_reason);
    return stopStep('escalate', request.stop_reason);
  }
  if (request.tier === 'skip') {
    request.stop = 'skip';
    request.stop_reason =
      request.stop_reason || 'No UI surface. See decision.md.';
    saveRequest(slug, request);
    return stopStep('skip', request.stop_reason, { prs: 0, targets: 'none' });
  }

  let step = null;
  if (request.stage_frame !== 'complete') {
    step = agentStep('frame');
  } else {
    const missing = missingCritical(request);
    if (missing.length) {
      request.stage_frame = 'pending';
      request.stop = 'gap';
      request.stop_reason = `Missing ${missing.join(', ')}. Do not draft these. A person fills the named field and the frame re-runs.`;
      step = stopStep('gap', request.stop_reason, {
        fields: missing.join(', '),
      });
    }
  }
  if (!step && request.tier !== 'tweak') {
    step = applyResearchInvalidation(request);
  }
  if (!step && (request.tier === 'explore' || request.tier === 'prototype')) {
    if (request.stage_research !== 'complete') {
      step = agentStep('research');
    } else if (
      request.stage_explore !== 'complete' &&
      request.chosen_option == null &&
      request.options_decision !== 'pass'
    ) {
      step = agentStep('explore');
    } else if (request.chosen_option == null) {
      step = optionsLoop(slug, request);
    }
  }
  if (!step && request.tier === 'tweak') {
    if (request.prototype === 'none') {
      step = handoff(slug, request);
    } else if (request.prototype === 'scenes') {
      step = afterBuild(slug, request);
    } else {
      request.stop = 'gap';
      request.stop_reason = 'Frame must set prototype to scenes or none.';
      step = stopStep('gap', request.stop_reason, { fields: 'prototype' });
    }
  }
  if (!step && request.tier === 'explore') {
    step = finish(slug, request);
  }
  if (!step && request.tier === 'prototype') {
    step = afterBuild(slug, request);
  }
  if (!step) {
    request.stop = 'escalate';
    request.stop_reason = `No next step for tier ${request.tier}.`;
    step = stopStep('escalate', request.stop_reason);
  }
  saveRequest(slug, request);
  return step;
}

function printStep(slug, step) {
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify({ slug, ...step }, null, 2));
    return;
  }
  console.log(`slug: ${slug}`);
  if (step.steps) {
    for (const child of step.steps) {
      const sample = child.sample ? ` sample: ${child.sample}` : '';
      const persona = child.persona ? ` persona: ${child.persona}` : '';
      console.log(
        `agent: ${child.agent} model: ${child.modelId || 'unset'} name: ${child.modelName}${sample}${persona}`,
      );
    }
  } else if (step.agent) {
    console.log(
      `agent: ${step.agent} model: ${step.modelId || 'unset'} name: ${step.modelName}`,
    );
  }
  const skip = new Set([
    'steps',
    'agent',
    'modelName',
    'modelId',
    'modelClass',
  ]);
  for (const [key, value] of Object.entries(step)) {
    if (skip.has(key) || value == null || value === false) {
      continue;
    }
    console.log(
      `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`,
    );
  }
}

function main() {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  if (!slug) {
    die('usage: npm run design:next -- <slug>');
  }
  printStep(slug, planNext(slug));
}

if (isMain()) {
  main();
}
