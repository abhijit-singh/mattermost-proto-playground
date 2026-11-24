import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  appendLog,
  die,
  loadRequest,
  packetDir,
  printResult,
  saveRequest,
  writeText,
} from './lib.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

export function emitPacket(slug) {
  const request = loadRequest(slug);
  if (request.check_ok !== true) {
    die('Refusing to emit before a passing final design:check.');
  }
  const built =
    request.tier === 'prototype' ||
    (request.tier === 'tweak' && request.prototype === 'scenes');
  const dir = path.join(packetDir(slug), 'emit');
  const confirms = (request.needs_confirmation || [])
    .map(
      (item) => `- ${item.field}: ${item.value} (added_by: ${item.added_by})`,
    )
    .join('\n');
  const designer = request.designer_recommendation;
  const designerText = designer
    ? `${designer.involve ? 'A designer should be involved' : 'A designer is not required'}. ${designer.reason} This is a recommendation, not a gate.`
    : 'No designer recommendation was recorded.';
  const approval = `Decider: ${request.decider}. The person who started this run is the decider and may assign the pull request to someone else.\n\n${designerText}\n`;
  writeText(
    path.join(dir, 'pr-body.md'),
    `# ${request.title}\n\nTier: ${request.tier}\nSize: ${request.size}\nCompliance: ${request.compliance}\nChosen option: ${request.chosen_option || 'n/a'}\nChosen by: ${request.chosen_by || 'n/a'}\nRisk: ${request.risk_score} (${request.approval_required})\n\n## Approval\n\n${approval}\n## Needs confirmation\n\n${confirms || 'None.'}\n\nThis draft was not posted.\n`,
  );
  writeText(
    path.join(dir, 'source-comment.md'),
    `Design Pass prepared a ${request.tier} result for ${request.source_ref}.\n\n${approval}\nThis comment was not posted.\n`,
  );
  writeText(
    path.join(dir, 'seed-log.md'),
    `# Seed log draft\n\nslug: ${slug}\noutcome: ${request.outcome_headline}\n\nA person opens any Seed pull request. This file was not written to internal-product-knowledge.\n`,
  );
  const complete = {
    slug,
    tier: request.tier,
    mode: request.mode,
    stop: 'emit',
    prs: built ? 1 : 0,
    targets: built ? 'playground' : 'none',
    posted: false,
    pull_request_opened: false,
    risk_score: request.risk_score,
    approval_required: request.approval_required,
    chosen_option: request.chosen_option,
    chosen_by: request.chosen_by,
    decider: request.decider,
    designer_recommendation: request.designer_recommendation || null,
    needs_confirmation: request.needs_confirmation || [],
  };
  writeText(
    path.join(dir, 'design-complete.json'),
    JSON.stringify(complete, null, 2),
  );
  request.prs = complete.prs;
  saveRequest(slug, request);
  appendLog(slug, 'emit', 'Drafts only. Posted nothing.');
  return complete;
}

function main() {
  const slug = process.argv.slice(2).find((arg) => !arg.startsWith('--'));
  if (!slug) {
    die('usage: npm run design:emit -- <slug>');
  }
  const complete = emitPacket(slug);
  printResult({
    slug,
    wrote: 'design/' + slug + '/emit/',
    posted: false,
    prs: complete.prs,
    targets: complete.targets,
  });
}

if (isMain()) {
  main();
}
