import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { die, loadRequest, packetDir, readText } from './lib.mjs';

function isMain() {
  return (
    process.argv[1] &&
    fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
  );
}

function section(markdown, heading) {
  const pattern = new RegExp(`^## ${heading}\\s*$`, 'im');
  const match = pattern.exec(markdown);
  if (!match) {
    return '';
  }
  const rest = markdown.slice(match.index);
  const next = rest.slice(1).search(/^## /m);
  return next === -1 ? rest.trim() : rest.slice(0, next + 1).trim();
}

function chosenOption(markdown, optionId) {
  if (!optionId) {
    return '';
  }
  const parts = markdown.split(/^## Option /m).slice(1);
  const found = parts.find((part) => part.trim().startsWith(optionId));
  return found ? `## Option ${found.trim()}` : '';
}

export function buildBrief(slug, kind, persona) {
  const request = loadRequest(slug);
  const dir = packetDir(slug);
  const frame = fs.existsSync(path.join(dir, 'frame.md'))
    ? readText(path.join(dir, 'frame.md'))
    : '';
  const research = fs.existsSync(path.join(dir, 'research.md'))
    ? readText(path.join(dir, 'research.md'))
    : '';
  const options = fs.existsSync(path.join(dir, 'options.md'))
    ? readText(path.join(dir, 'options.md'))
    : '';
  const header = [
    `slug: ${slug}`,
    `kind: ${kind}`,
    `risk_score: ${request.risk_score}`,
    `approval_required: ${request.approval_required}`,
    `chosen_option: ${request.chosen_option || ''}`,
    'This brief omits the other options, the explorer recommendation, persona.md, and any earlier critique.',
  ].join('\n');
  if (kind === 'persona') {
    return [
      header,
      section(frame, 'Problem'),
      section(frame, 'Outcome'),
      section(frame, 'Users'),
      section(frame, 'Assumptions'),
      persona ? `persona: ${persona}` : '',
    ]
      .filter(Boolean)
      .join('\n\n');
  }
  const parts = [
    header,
    section(frame, 'Problem'),
    section(frame, 'Outcome'),
    section(frame, 'Baseline map'),
    section(frame, 'Assumptions'),
    section(research, 'Prior decisions'),
    section(research, 'Sibling work'),
    section(research, 'Control table'),
    chosenOption(options, request.chosen_option),
  ];
  if (kind === 'verify') {
    const check = path.join(dir, 'check.md');
    parts.push(
      fs.existsSync(check) ? readText(check) : 'design:check output: none yet',
    );
  }
  return parts.filter(Boolean).join('\n\n');
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--json');
  const [slug, kind, persona] = args;
  if (!slug || !['critique', 'verify', 'persona'].includes(kind)) {
    die(
      'usage: node scripts/design/brief.mjs <slug> critique|verify|persona <persona>',
    );
  }
  if (kind === 'persona' && !persona) {
    die('persona brief requires the persona slug.');
  }
  console.log(buildBrief(slug, kind, persona));
}

if (isMain()) {
  main();
}
