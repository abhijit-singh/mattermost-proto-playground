import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assertSkillsInSync } from './sync-skills.mjs';
import { wordingHits } from './wording.mjs';
import {
  CRITICAL_FIELDS,
  DRAFTABLE_FIELDS,
  appendLog,
  die,
  isBlank,
  isDraft,
  listFiles,
  loadRequest,
  loadYaml,
  packetDir,
  parseYaml,
  repoRoot,
  saveRequest,
  writeText,
} from './lib.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

function frontmatter(file) {
  if (!fs.existsSync(file)) {
    return null;
  }
  const match = fs
    .readFileSync(file, 'utf8')
    .match(/^---\r?\n([\s\S]*?)\r?\n---/);
  return match ? parseYaml(match[1]) : {};
}

function approvalFor(score, risk) {
  const rules = risk.rules || [];
  for (const rule of rules) {
    if (rule.if === 'score >= 2' && score >= 2) {
      return rule.approval_required;
    }
    if (rule.else === true || rule.if == null) {
      return rule.approval_required;
    }
  }
  return score >= 2 ? 'designer' : 'pm-or-eng';
}

function optionSections(markdown) {
  return markdown.split(/^## Option /m).slice(1);
}

function controlRows(markdown) {
  const section = markdown.split(/^## Control table/m)[1];
  if (!section) {
    return null;
  }
  const body = section.split(/^## /m)[0];
  return body.split(/\r?\n/).filter((line) => {
    const trimmed = line.trim();
    return (
      trimmed.startsWith('|') &&
      !/^\|\s*-+/.test(trimmed) &&
      !/^\|\s*#/.test(trimmed) &&
      !/control/i.test(trimmed.split('|')[1] || '')
    );
  });
}

function prototypeDir(slug) {
  return path.join(repoRoot, 'src', 'pages', 'prototypes', slug);
}

export function checkPacket(slug) {
  const failures = [];
  const request = loadRequest(slug);
  const dir = packetDir(slug);
  try {
    assertSkillsInSync();
  } catch (error) {
    failures.push(error.message);
  }

  const required = request.tier === 'skip' ? ['decider'] : CRITICAL_FIELDS;
  for (const field of required) {
    if (isBlank(request[field]) || isDraft(request[field])) {
      failures.push(`${field} is missing.`);
    }
  }
  for (const hit of wordingHits()) {
    failures.push(`old intake wording: ${hit}`);
  }
  if (request.mode === 'autopilot') {
    for (const field of DRAFTABLE_FIELDS) {
      if (isBlank(request[field])) {
        failures.push(
          `${field} is empty. Autopilot drafts it as [AI DRAFT] and lists it under needs_confirmation.`,
        );
      }
    }
  }

  const risk = loadYaml(path.join(repoRoot, 'design', 'risk.yaml'));
  const artifact = ['handoff.md', 'design-note.md', 'frame.md']
    .map((name) => path.join(dir, name))
    .find((file) => fs.existsSync(file));
  const flags = artifact
    ? frontmatter(artifact)?.risk_flags || request.risk_flags || []
    : request.risk_flags || [];
  const flagList = Array.isArray(flags)
    ? flags
    : String(flags)
        .split(',')
        .map((item) => item.trim());
  let score = 0;
  for (const flag of flagList) {
    if (flag == null || flag === '') {
      continue;
    }
    if (risk.flags[flag] == null) {
      failures.push(`Unknown risk flag: ${flag}`);
    } else {
      score += Number(risk.flags[flag]);
    }
  }
  const approval = approvalFor(score, risk);
  if (
    artifact &&
    frontmatter(artifact)?.approval_required &&
    frontmatter(artifact).approval_required !== approval
  ) {
    failures.push(
      `approval_required is ${frontmatter(artifact).approval_required}; score ${score} requires ${approval}.`,
    );
  }
  if (
    request.approval_required &&
    request.approval_required !== approval &&
    request.stage_frame === 'complete'
  ) {
    failures.push(
      `request.yaml approval_required is ${request.approval_required}; recomputed ${approval} from score ${score}.`,
    );
  }

  if (request.tier === 'explore' || request.tier === 'prototype') {
    const optionsFile = path.join(dir, 'options.md');
    if (!fs.existsSync(optionsFile)) {
      failures.push('options.md is missing.');
    } else {
      const sections = optionSections(fs.readFileSync(optionsFile, 'utf8'));
      if (!sections.length) {
        failures.push('options.md has no ## Option section.');
      }
      sections.forEach((section, index) => {
        if (!/After-flow/i.test(section)) {
          failures.push(`Option section ${index + 1} has no After-flow.`);
        }
      });
    }
  }

  if (request.compliance) {
    const research = path.join(dir, 'research.md');
    if (!fs.existsSync(research)) {
      failures.push('compliance is on and research.md is missing.');
    } else {
      const rows = controlRows(fs.readFileSync(research, 'utf8'));
      if (rows == null) {
        failures.push(
          'compliance is on and research.md has no ## Control table.',
        );
      } else if (rows.length < 3 || rows.length > 10) {
        failures.push(
          `Control table has ${rows.length} rows; expected 3 to 10.`,
        );
      }
    }
  }

  const built =
    request.tier === 'prototype' ||
    (request.tier === 'tweak' && request.prototype === 'scenes');
  if (built && request.stage_build === 'complete') {
    for (const name of ['state-matrix.yaml', 'copy.yaml']) {
      if (!fs.existsSync(path.join(dir, name))) {
        failures.push(`${name} is missing.`);
      }
    }
    const proto = prototypeDir(request.slug);
    if (fs.existsSync(proto)) {
      for (const file of listFiles(proto, (item) =>
        /\.(tsx|ts|jsx|js)$/.test(item),
      )) {
        const text = fs.readFileSync(file, 'utf8');
        if (/from\s+['"]@mattermost\/compass-ui['"]/.test(text)) {
          failures.push(
            `Root-barrel Compass import in ${path.relative(repoRoot, file)}.`,
          );
        }
      }
    }
    const matrixFile = path.join(dir, 'state-matrix.yaml');
    if (fs.existsSync(matrixFile)) {
      const matrix = loadYaml(matrixFile);
      for (const state of matrix.states || []) {
        if (state.required && !state.scene && !state.na_reason) {
          failures.push(`State ${state.id} has no scene and no n/a reason.`);
        }
      }
    }
  }

  if (request.tier === 'prototype' && request.stage_handoff === 'complete') {
    const proto = prototypeDir(request.slug);
    const hasWalkthrough =
      fs.existsSync(proto) &&
      listFiles(proto, (item) => /\.(tsx|ts|jsx|js|md)$/.test(item)).some(
        (file) =>
          fs.readFileSync(file, 'utf8').includes('useRegisterWalkthrough'),
      );
    if (!hasWalkthrough) {
      failures.push(
        'Prototype handoff has no useRegisterWalkthrough in the prototype.',
      );
    }
  }

  return { failures, score, approval, request };
}

function main() {
  const args = process.argv.slice(2);
  const slug = args.find((arg) => !arg.startsWith('--'));
  const finalCheck = args.includes('--final');
  if (!slug) {
    die('usage: npm run design:check -- <slug> [--final]');
  }
  const { failures, score, approval, request } = checkPacket(slug);
  const body = failures.length
    ? failures.map((item) => `- ${item}`).join('\n')
    : 'pass';
  writeText(
    path.join(packetDir(slug), 'check.md'),
    `# Check\n\nscore: ${score}\napproval_required: ${approval}\n\n${body}\n`,
  );
  if (finalCheck) {
    request.risk_score = score;
    request.approval_required = approval;
    request.check_ran = true;
    request.check_ok = failures.length === 0;
    saveRequest(slug, request);
    appendLog(slug, 'check', failures.length ? failures.join('\n') : 'pass');
  }
  if (failures.length) {
    console.error(body);
    process.exit(1);
  }
  console.log(`design:check pass (${approval}, score ${score})`);
}

if (isMain()) {
  main();
}
