import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));

export const repoRoot = path.resolve(here, '../..');
export const designRoot = path.join(repoRoot, 'design');

export const CRITICAL_FIELDS = [
  'outcome_headline',
  'users',
  'customer_words',
  'decider',
];

export const DRAFTABLE_FIELDS = ['lighthouse_name', 'verified'];

export const TIERS = ['skip', 'tweak', 'explore', 'prototype'];

export const TIER_ALIASES = {
  none: 'skip',
  note: 'tweak',
  full: 'prototype',
};

const OUTSIDE_REPO =
  'Refusing to write outside mattermost-proto-playground. This process never writes to mattermost/mattermost or internal-product-knowledge.';

export function assertInsideRepo(target) {
  const resolved = path.resolve(target);
  const real = fs.existsSync(resolved) ? fs.realpathSync(resolved) : resolved;
  const rootReal = fs.realpathSync(repoRoot);
  const inside = (value) =>
    value === rootReal || value.startsWith(rootReal + path.sep);
  if (!inside(resolved) || !inside(real)) {
    throw new Error(`${OUTSIDE_REPO} (${target})`);
  }
  return real;
}

export function readText(file) {
  return fs.readFileSync(file, 'utf8');
}

export function writeText(file, text) {
  assertInsideRepo(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text.endsWith('\n') ? text : `${text}\n`);
}

export function packetDir(slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    throw new Error(`Slug must be kebab-case: ${slug}`);
  }
  return path.join(designRoot, slug);
}

export function requestPath(slug) {
  return path.join(packetDir(slug), 'request.yaml');
}

export function nowIso() {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function kebab(value) {
  return String(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

function stripInlineComment(line) {
  let quote = null;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (quote) {
      if (char === quote) {
        quote = null;
      }
    } else if (char === '"' || char === "'") {
      quote = char;
    } else if (char === '#' && (i === 0 || line[i - 1] === ' ')) {
      return line.slice(0, i).trimEnd();
    }
  }
  return line;
}

export function coerceScalar(raw) {
  const value = raw.trim();
  if (value === '' || value === 'null' || value === '~') {
    return null;
  }
  if (value.startsWith('"') && value.endsWith('"')) {
    return value.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
  if (value.startsWith("'") && value.endsWith("'")) {
    return value.slice(1, -1);
  }
  if (value === '[]') {
    return [];
  }
  if (value === '{}') {
    return {};
  }
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  if (/^-?\d+$/.test(value)) {
    return Number(value);
  }
  return value;
}

export function parseYaml(text) {
  const root = {};
  const stack = [{ indent: -1, obj: root }];

  const ensureContainer = (parentFrame, key, asList) => {
    const current = parentFrame.obj[key];
    if (asList) {
      if (!Array.isArray(current)) {
        parentFrame.obj[key] = [];
      }
      return parentFrame.obj[key];
    }
    if (
      current == null ||
      Array.isArray(current) ||
      typeof current !== 'object'
    ) {
      parentFrame.obj[key] = {};
    }
    return parentFrame.obj[key];
  };

  const lines = String(text).split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const stripped = stripInlineComment(lines[index]);
    if (!stripped.trim()) {
      continue;
    }
    const indent = stripped.match(/^ */)[0].length;
    const line = stripped.trim();
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    const parent = stack[stack.length - 1];

    if (line.startsWith('- ')) {
      const rest = line.slice(2).trim();
      if (!Array.isArray(parent.obj)) {
        throw new Error(`YAML list item outside a list: ${line}`);
      }
      const keySplit = rest.indexOf(':');
      if (keySplit === -1) {
        parent.obj.push(coerceScalar(rest));
        continue;
      }
      const item = {};
      parent.obj.push(item);
      const key = rest.slice(0, keySplit).trim();
      const remainder = rest.slice(keySplit + 1).trim();
      if (remainder) {
        item[key] = coerceScalar(remainder);
      } else {
        item[key] = {};
      }
      stack.push({ indent, obj: item });
      continue;
    }

    const splitAt = line.indexOf(':');
    if (splitAt === -1) {
      throw new Error(`YAML line has no key: ${line}`);
    }
    const key = line.slice(0, splitAt).trim();
    const remainder = line.slice(splitAt + 1).trim();
    if (remainder) {
      parent.obj[key] = coerceScalar(remainder);
      continue;
    }

    const next = nextContent(lines, index + 1);
    const asList = next != null && next.trim().startsWith('- ');
    const container = ensureContainer(parent, key, asList);
    stack.push({ indent, obj: container });
  }
  return root;
}

function nextContent(lines, start) {
  for (let i = start; i < lines.length; i += 1) {
    const stripped = stripInlineComment(lines[i]);
    if (stripped.trim()) {
      return stripped;
    }
  }
  return null;
}

function yamlQuote(value) {
  if (value == null) {
    return 'null';
  }
  if (typeof value === 'boolean' || typeof value === 'number') {
    return String(value);
  }
  const text = String(value);
  if (
    text === '' ||
    /[:#{}[\],&*!|>'"%@`]|^\s|\s$/.test(text) ||
    text === 'null' ||
    text === 'true' ||
    text === 'false'
  ) {
    return `"${text.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;
  }
  return text;
}

export function stringifyYaml(value, indent = 0) {
  const pad = ' '.repeat(indent);
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return '[]';
    }
    return value
      .map((item) => {
        if (item != null && typeof item === 'object' && !Array.isArray(item)) {
          const entries = Object.entries(item);
          const [firstKey, firstValue] = entries[0];
          const head = `${pad}- ${firstKey}: ${
            firstValue != null && typeof firstValue === 'object'
              ? ''
              : yamlQuote(firstValue)
          }`.trimEnd();
          const rest = entries.slice(1).map(([key, entry]) => {
            if (entry != null && typeof entry === 'object') {
              return `${pad}  ${key}:\n${stringifyYaml(entry, indent + 4)}`;
            }
            return `${pad}  ${key}: ${yamlQuote(entry)}`;
          });
          return [head, ...rest].filter(Boolean).join('\n');
        }
        return `${pad}- ${yamlQuote(item)}`;
      })
      .join('\n');
  }
  if (value != null && typeof value === 'object') {
    return Object.entries(value)
      .map(([key, entry]) => {
        if (
          Array.isArray(entry) ||
          (entry != null && typeof entry === 'object')
        ) {
          const body = stringifyYaml(entry, indent + 2);
          if (Array.isArray(entry) && entry.length === 0) {
            return `${pad}${key}: []`;
          }
          return `${pad}${key}:\n${body}`;
        }
        return `${pad}${key}: ${yamlQuote(entry)}`;
      })
      .join('\n');
  }
  return `${pad}${yamlQuote(value)}`;
}

export function loadYaml(file) {
  return parseYaml(readText(file));
}

export function saveYaml(file, value) {
  writeText(file, stringifyYaml(value));
}

export function loadRequest(slug) {
  const file = requestPath(slug);
  if (!fs.existsSync(file)) {
    throw new Error(
      `No packet at design/${slug}/request.yaml. Run design:request first.`,
    );
  }
  return loadYaml(file);
}

export function saveRequest(slug, request) {
  saveYaml(requestPath(slug), request);
}

export function appendLog(slug, heading, body) {
  const file = path.join(packetDir(slug), 'log.md');
  const block = `## ${nowIso()} ${heading}\n\n${body.trim()}\n`;
  if (!fs.existsSync(file)) {
    writeText(file, `# Log\n\n${block}`);
    return;
  }
  writeText(file, `${readText(file).trimEnd()}\n\n${block}`);
}

export function isBlank(value) {
  if (value == null) {
    return true;
  }
  const text = String(value).trim();
  return text === '' || text === 'null' || /^GAP\b/i.test(text);
}

export function isDraft(value) {
  return typeof value === 'string' && value.includes('[AI DRAFT]');
}

export function missingCritical(request) {
  return CRITICAL_FIELDS.filter(
    (field) => isBlank(request[field]) || isDraft(request[field]),
  );
}

export function loadModels() {
  return JSON.parse(readText(path.join(here, 'models.json')));
}

export function stageModel(stage) {
  const models = loadModels();
  const found = models.stages[stage];
  if (!found) {
    throw new Error(`No model class for stage ${stage}`);
  }
  return {
    stage,
    agent: `design-pass-${stage}`,
    class: found.class,
    name: found.name,
  };
}

export function minutesSince(iso) {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) {
    return 0;
  }
  return (Date.now() - then) / 60000;
}

export function listFiles(dir, predicate) {
  if (!fs.existsSync(dir)) {
    return [];
  }
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...listFiles(full, predicate));
    } else if (!predicate || predicate(full)) {
      out.push(full);
    }
  }
  return out;
}

const PERSONA_INDEX = new Set(['readme.md', 'persona-catalog.md']);

export function personaProfiles() {
  const dir = path.join(designRoot, 'personas');
  return listFiles(
    dir,
    (file) =>
      /\.md$/i.test(file) &&
      !PERSONA_INDEX.has(path.basename(file).toLowerCase()),
  );
}

export function selectPersonas(limit = 2) {
  const profiles = personaProfiles();
  const byName = new Map(
    profiles.map((file) => [path.basename(file, path.extname(file)), file]),
  );
  const chosen = [];
  const catalog = path.join(designRoot, 'personas', 'persona-catalog.md');
  if (fs.existsSync(catalog)) {
    const text = readText(catalog);
    const panel = text.match(/\*\*missionops\*\*[^\n]*/);
    const slugs = panel
      ? [...panel[0].matchAll(/`([a-z0-9-]+)`/g)].map((match) => match[1])
      : [];
    for (const slug of slugs) {
      if (chosen.length >= limit) {
        break;
      }
      const row = text.match(new RegExp(`\\| \`${slug}\` \\| ([^|]+) \\|`));
      const name = row ? row[1].trim() : null;
      const file = name ? byName.get(name) : null;
      if (file) {
        chosen.push({ slug, name, file });
      }
    }
  }
  if (!chosen.length) {
    for (const file of profiles.slice(0, limit)) {
      const name = path.basename(file, path.extname(file));
      chosen.push({ slug: kebab(name), name, file });
    }
  }
  return chosen.slice(0, limit);
}

export function mean(numbers) {
  if (!numbers.length) {
    return 0;
  }
  return numbers.reduce((sum, value) => sum + value, 0) / numbers.length;
}

export function median(numbers) {
  const sorted = [...numbers].sort((a, b) => a - b);
  return sorted[Math.floor((sorted.length - 1) / 2)];
}

export function parseScoreTable(markdown) {
  const lines = [];
  for (const line of markdown.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) {
      continue;
    }
    const cells = line
      .split('|')
      .slice(1, -1)
      .map((cell) => cell.trim());
    if (
      cells.length < 3 ||
      !/^\d+$/.test(cells[0]) ||
      !/^[1-5]$/.test(cells[2])
    ) {
      continue;
    }
    lines.push({
      id: Number(cells[0]),
      name: cells[1],
      score: Number(cells[2]),
    });
  }
  return lines;
}

export function parseOptionsSample(markdown) {
  const sections = markdown.split(/^## /m).slice(1);
  const options = {};
  let sendBack = null;
  let recommended = null;
  for (const section of sections) {
    const [titleLine, ...rest] = section.split(/\r?\n/);
    const title = titleLine.trim();
    const body = rest.join('\n');
    if (/^set verdict/i.test(title)) {
      const back = body.match(/send_back_to:\s*(null|explore|research|frame)/i);
      const rec = body.match(/recommended:\s*([A-Za-z0-9_-]+)/);
      sendBack = back
        ? back[1].toLowerCase() === 'null'
          ? null
          : back[1].toLowerCase()
        : null;
      recommended = rec ? rec[1] : null;
      continue;
    }
    const option = title.replace(/^Option\s+/i, '').trim();
    const scores = {};
    for (const row of parseScoreTable(body)) {
      scores[row.id] = row.score;
    }
    if (Object.keys(scores).length) {
      options[option] = scores;
    }
  }
  return { options, sendBack, recommended };
}

export function majority(values) {
  const counts = new Map();
  for (const value of values) {
    if (value == null || value === '') {
      continue;
    }
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  let tied = false;
  for (const [value, count] of counts) {
    if (count > bestCount) {
      best = value;
      bestCount = count;
      tied = false;
    } else if (count === bestCount) {
      tied = true;
    }
  }
  if (!best || tied || bestCount < 2) {
    return null;
  }
  return best;
}

export function loadRubric() {
  return JSON.parse(readText(path.join(here, 'rubric.json')));
}

export function scorePasses(scores, rubricLines, riskScore) {
  const values = rubricLines
    .map((line) => scores[line.id])
    .filter((score) => score != null);
  if (values.length !== rubricLines.length) {
    return { ok: false, reason: 'missing rubric line' };
  }
  if (values.some((score) => score < 3)) {
    return { ok: false, reason: 'a line is below 3' };
  }
  if (mean(values) < 4) {
    return { ok: false, reason: 'mean is below 4' };
  }
  for (const line of rubricLines) {
    const must =
      line.must_pass === true ||
      (line.must_pass === 'risk>=2' && riskScore >= 2);
    if (must && scores[line.id] < 4) {
      return { ok: false, reason: `must-pass line ${line.id} is below 4` };
    }
  }
  return { ok: true, reason: 'pass' };
}

export function printResult(payload) {
  if (process.argv.includes('--json')) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }
  if (payload.agent) {
    console.log(
      `agent: ${payload.agent} model: ${payload.modelId || 'unset'} name: ${payload.modelName}`,
    );
  }
  for (const [key, value] of Object.entries(payload)) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      console.log(`${key}: ${value.join(', ')}`);
    } else if (typeof value === 'object') {
      console.log(`${key}: ${JSON.stringify(value)}`);
    } else {
      console.log(`${key}: ${value}`);
    }
  }
}

export function die(message, code = 1) {
  console.error(message);
  process.exit(code);
}
