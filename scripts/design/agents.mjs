import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadModels, repoRoot } from './lib.mjs';

const descriptions = {
  frame:
    'Design Pass frame. States the problem, outcome, users, baseline, and risk. Does not build.',
  research:
    'Design Pass research. Reads prior decisions and, when compliance is on, writes the control table. Does not build.',
  explore:
    'Design Pass explore. Writes two or three options that differ in interaction model. Does not build the product.',
  'critique-options':
    'Design Pass options critic. Scores one fresh sample of the 7-line options rubric.',
  critique:
    'Design Pass prototype critic. Scores one fresh sample of the 10-line rubric.',
  persona:
    'Design Pass persona. One synthetic FY26 profile attempts the primary task.',
  verify: 'Design Pass verify. One fresh judge scores the finished prototype.',
  handoff:
    'Design Pass handoff. Writes the walkthrough and handoff.md, or design-note.md for a tweak.',
  build:
    'Design Pass build. Builds the prototype with compass-build on the real app shell.',
  lookup: 'Design Pass lookup. Read-only. Decides nothing and writes nothing.',
};

const compassBuild =
  '../compass-design/skills/compass-toolkit/skills/compass-build/SKILL.md';
const compassReview =
  '../compass-design/skills/compass-toolkit/skills/compass-review/SKILL.md';

function modelInstruction(stage) {
  const name = loadModels().stages[stage].name;
  return `This stage runs on ${name}. The orchestrator is the cloud agent's selected model, which is the default frontier model. Do not ask anyone to paste a model id, and do not invent a Cursor model slug.`;
}

function common(stage) {
  return `Read \`design/README.md\` and the packet \`design/<slug>/\` before you write. \`<slug>\` is the slug \`next.mjs\` printed.

${modelInstruction(stage)}

Write only inside this repo, under \`design/<slug>/\` and, for a build, \`src/pages/prototypes/\`. Never write to \`mattermost/mattermost\` or \`internal-product-knowledge\`. Never post a pull request, a source comment, or a Seed.

Do not run \`compass-migrate\`. Do not run \`prototype-to-production\`.

Record this stage with \`node scripts/design/stage.mjs <slug> start ${stage}\` and \`complete ${stage}\`. Do not edit another stage's block.

Never draft outcome, users, customer words, or the decider. If one is missing, stop and name the field. In autopilot, draft any other missing human-only field as \`[AI DRAFT]\` and pass it with \`--set\` so it is listed under \`needs_confirmation\`. In gated mode, leave human-only fields as \`GAP (owner)\`.

A person is required only for an escalation, or when outcome, users, customer words, or the decider is missing.`;
}

const bodies = {
  frame: `${common('frame')}

Write \`design/<slug>/frame.md\` from \`design/templates/frame.md\`. Cover the problem, the outcome headline and measure, the users, what ships today with \`path:line\`, the baseline map, the Compass components in play, the assumptions, the risk flags, and open questions with recommended answers.

Keep any outcome, users, customer words, or decider already copied from the source. Do not replace them.

Complete the stage with \`--set prototype=scenes\` or \`--set prototype=none\`, and \`--set risk_flags=\` using only keys from \`design/risk.yaml\`.

Use the \`design-pass-lookup\` subagent for read-only questions. This stage does not build.`,
  research: `${common('research')}

Write \`design/<slug>/research.md\` from \`design/templates/research.md\`. Cover prior decisions, Seeds, earlier Figma reached through links, the last 2–3 releases on the surface, sibling work, and outside precedent.

When \`request.yaml\` has \`compliance: true\`, add \`## Control table\` with 3 to 10 controls drawn from NIST 800-53, 800-207, 800-162, DoD Zero Trust, ACP 240, and NATO STANAG. Rubric line 10 checks that table.

You may mark the frame invalid once with \`--set frame_invalid=true\`. A second invalidation escalates. The script counts it.

Use \`design-pass-lookup\` for read-only questions. If a sibling repo is missing, say it was not searched. This stage does not build.`,
  explore: `${common('explore')}

Write \`design/<slug>/options.md\` from \`design/templates/options.md\`. Two or three options, differing in interaction model, not in styling. Each option has an \`After-flow\`, a precedent or a reason for novelty, a Compass component map, and the roadmap doors it opens or closes.

Set \`--set explorer_pick=<option id>\` to the option you would take forward.

On an explore-tier run, put sketches in \`src/pages/prototypes/<slug>-options/\`. Do not build the product prototype.

On a refine, change only the option \`next.mjs\` named. Keep its interaction model. Copy the other options under \`## Compared options\`.

Use \`design-pass-lookup\` for read-only questions.`,
  'critique-options': `${common('critique-options')}

You are one fresh sample. Do not read another sample, the explorer's recommendation, or a previous critique.

Read \`design/rubric-options.md\` and score every option. Write \`design/<slug>/rounds/options-<n>/critique-options.sample-<k>.md\` in the output format in that rubric, including \`send_back_to\` and \`recommended\`.

You do not merge and you do not pick the option the run will build. The script takes the median.`,
  critique: `${common('critique')}

You are one fresh sample. Read \`node scripts/design/brief.mjs <slug> critique\`, \`design/rubric.md\`, the prototype, the screenshots, and \`state-matrix.yaml\`. Do not read the other options, \`persona.md\`, or an earlier critique.

Read \`${compassReview}\` and audit the prototype with it. That audit does not replace the rubric or \`design:check\`.

Write \`design/<slug>/rounds/<n>/critique.sample-<k>.md\` in the output format in \`design/rubric.md\`. Quote the anchor nearest the score. If screenshots are missing, say so in the evidence. Do not invent a screenshot.

The script takes the median. A failing first sample is not confirmed by more samples.`,
  persona: `${common('persona')}

Read \`node scripts/design/brief.mjs <slug> persona <persona>\` and that one profile under \`design/personas/\`. Attempt the primary task. Write \`design/<slug>/rounds/<n>/persona.<persona>.md\` with \`completed: true\` or \`completed: false\`, and \`blocker: true\` or \`blocker: false\`.

This finding is synthetic. Do not present it as customer evidence. Do not read a critique sample. The critique step picks that profile from the FY26 catalog. Do not invent a persona.`,
  verify: `${common('verify')}

You are one fresh judge. Read \`node scripts/design/brief.mjs <slug> verify\`, \`design/rubric.md\`, the final prototype, and the \`design:check\` output. Read \`${compassReview}\`. That audit does not replace the rubric or \`design:check\`.

Write \`design/<slug>/rounds/verify-<a>/verify.sample-<k>.md\` in the critique output format. The script merges three samples. One repair is allowed. You do not start a second repair.`,
  handoff: `${common('handoff')}

A tweak writes \`design/<slug>/design-note.md\` from \`design/templates/design-note.md\`. Every other tier that reaches handoff writes \`design/<slug>/handoff.md\` from \`design/templates/handoff.md\` and a guided walkthrough inside the prototype (\`useRegisterWalkthrough\`). Focus targets are sub-regions, not the whole view.

Copy \`risk_flags\` into the artifact frontmatter. Do not open a pull request. Do not run \`prototype-to-production\`.`,
  build: `${common('build')}

Read \`${compassBuild}\` before writing UI. Build on the real app shell, Compass only. Import \`@mattermost/compass-ui\` by subpath, never the root barrel. Do not build a design-system component in the playground.

Write the prototype under \`src/pages/prototypes/<slug>/\` with \`scenes/\`, not \`views/\`. Copy \`design/templates/state-matrix.yaml\` and \`design/templates/copy.yaml\` into the packet. Every required state is present or \`n/a\` with a reason. Reuse \`en.json\` keys when they exist.

Run \`npm run design:check -- <slug>\` before you complete the stage. Do not pass \`--final\`. Fix what it fails.

If this round is a regression, revert to the previous round's prototype, then re-issue the fix. The round still counts.

Do not run \`compass-migrate\` or \`prototype-to-production\`.`,
  lookup: `You are a read-only lookup for frame and research. Decide nothing. Write no files.

Answer the parent's question from this repo. You may read \`../compass-design\` and \`../mattermost\` when they are present. You may not write to either, and you may not write to \`internal-product-knowledge\`. If a sibling is missing, say it was not searched.

Do not run \`compass-migrate\` or \`prototype-to-production\`. ${modelInstruction('lookup')}`,
};

export function renderAgent(stage) {
  const models = loadModels();
  const spec = models.stages[stage];
  const body = bodies[stage];
  if (!spec || !body) {
    throw new Error(`No agent contract for ${stage}`);
  }
  return `---
name: design-pass-${stage}
description: ${descriptions[stage]}
model: inherit
---

# design-pass-${stage}

Model name: ${spec.name}
Model class: ${spec.class}

${body}
`;
}

export function renderSkill(stage) {
  const agent = renderAgent(stage);
  const body = agent.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
  return `---
name: design-pass-${stage}
description: ${descriptions[stage]}
---

${body}
`;
}

export function expectedFiles() {
  const stages = Object.keys(loadModels().stages);
  const files = [];
  for (const stage of stages) {
    files.push({
      path: path.join(repoRoot, '.cursor', 'agents', `design-pass-${stage}.md`),
      contents: renderAgent(stage),
    });
    files.push({
      path: path.join(
        repoRoot,
        '.cursor',
        'skills',
        `design-pass-${stage}`,
        'SKILL.md',
      ),
      contents: renderSkill(stage),
    });
  }
  return files;
}

export function writeAgents() {
  const written = [];
  for (const file of expectedFiles()) {
    fs.mkdirSync(path.dirname(file.path), { recursive: true });
    fs.writeFileSync(
      file.path,
      file.contents.endsWith('\n') ? file.contents : `${file.contents}\n`,
    );
    written.push(file.path);
  }
  return written;
}

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

if (isMain()) {
  for (const file of writeAgents()) {
    console.log(path.relative(repoRoot, file));
  }
}
