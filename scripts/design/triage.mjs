import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { die, printResult, readText } from './lib.mjs';

const rules = JSON.parse(
  readText(
    path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      'triage.rules.json',
    ),
  ),
);
const sizeRules = JSON.parse(
  readText(
    path.join(path.dirname(fileURLToPath(import.meta.url)), 'size.rules.json'),
  ),
);

function phraseHits(text, phrases) {
  const haystack = text.toLowerCase();
  return phrases.filter((phrase) => {
    const needle = phrase.toLowerCase();
    if (needle.includes(' ')) {
      return haystack.includes(needle);
    }
    return new RegExp(
      `\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`,
      'i',
    ).test(text);
  });
}

function seedAsk(text) {
  const match = text.match(/^\s*ask:\s*(explore|prototype|tweak|skip)\s*$/im);
  return match ? match[1] : null;
}

function designLabel(text) {
  const match = text.match(
    /design:(none|note|full|skip|tweak|explore|prototype|gated)/i,
  );
  return match ? match[1].toLowerCase() : null;
}

export function triageText(text, overrides = {}) {
  const fired = [];
  const ask = seedAsk(text);
  const label = designLabel(text);
  const surfaceHits = phraseHits(text, rules.uiSurface).filter((hit) => {
    if (hit !== 'ui') {
      return true;
    }
    const withoutNegation = text.replace(/\bno\s+ui\b/gi, ' ');
    return /\bui\b/i.test(withoutNegation);
  });
  let tier = null;
  let tierReason = '';

  if (overrides.tier) {
    tier = rules.aliases[overrides.tier] || overrides.tier;
    tierReason = '--tier';
    fired.push(`override:${tier}`);
  } else if (ask) {
    tier = ask;
    tierReason = `seed ask: ${ask}`;
    fired.push(`seed-ask:${ask}`);
  } else if (
    label &&
    label !== 'gated' &&
    (rules.aliases[label] || rules.tierOrder.includes(label))
  ) {
    tier = rules.aliases[label] || label;
    tierReason = `label design:${label}`;
    fired.push(`label:${label}`);
  } else {
    for (const name of rules.tierOrder) {
      const spec = rules.tiers[name];
      const hits = phraseHits(text, spec.phrases);
      if (hits.length) {
        fired.push(`${name}:${hits.join('+')}`);
      }
    }
    const uiNamed = surfaceHits.length > 0;
    if (!uiNamed) {
      tier = 'skip';
      tierReason = 'no UI surface named';
      fired.push('skip:no-ui-surface');
    } else {
      for (const name of rules.tierOrder) {
        if (name === 'skip') {
          continue;
        }
        if (fired.some((rule) => rule.startsWith(`${name}:`))) {
          tier = name;
          tierReason = `first matching tier in ${rules.tierOrder.join(' > ')}`;
          break;
        }
      }
      if (!tier) {
        tier = null;
        tierReason = 'UI surface named and no tier keyword fired';
      }
    }
  }

  if (tier && !rules.tierOrder.includes(tier)) {
    throw new Error(`Unknown tier: ${tier}`);
  }

  const largeHits = phraseHits(text, sizeRules.large);
  const smallHits = phraseHits(text, sizeRules.small);
  let size = overrides.size || null;
  let sizeReason = '';
  if (overrides.size) {
    sizeReason = '--size';
    fired.push(`size-override:${overrides.size}`);
  } else if (largeHits.length) {
    size = 'large';
    sizeReason = largeHits.join(', ');
    fired.push(`size-large:${largeHits.join('+')}`);
  } else if (smallHits.length) {
    size = 'small';
    sizeReason = smallHits.join(', ');
    fired.push(`size-small:${smallHits.join('+')}`);
  } else {
    size = 'small';
    sizeReason =
      'no size keyword; small, and novelty, interaction depth, and prior art stay unknown';
    fired.push('size-small:default');
  }
  if (size !== 'small' && size !== 'large') {
    throw new Error(`Unknown size: ${size}`);
  }

  const roundsMax =
    tier === 'tweak'
      ? sizeRules.tweakRoundsMax
      : size === 'large'
        ? sizeRules.largeRoundsMax
        : sizeRules.smallRoundsMax;

  const complianceHits = phraseHits(text, rules.compliance);
  let compliance = complianceHits.length > 0;
  let complianceReason = complianceHits.join(', ');
  if (overrides.compliance === 'on' || overrides.compliance === 'off') {
    compliance = overrides.compliance === 'on';
    complianceReason = `--compliance ${overrides.compliance}`;
    fired.push(`compliance-override:${overrides.compliance}`);
  } else if (compliance) {
    fired.push(`compliance:${complianceHits.join('+')}`);
  } else {
    fired.push('compliance:off');
  }

  return {
    tier,
    tierReason,
    size,
    sizeReason,
    roundsMax,
    compliance,
    complianceReason,
    rulesFired: fired,
    signals: {
      novelty: 'unknown',
      interaction_depth: 'unknown',
      prior_art: 'unknown',
    },
    uiSurface: surfaceHits,
  };
}

function main() {
  const args = process.argv.slice(2).filter((arg) => arg !== '--json');
  const overrides = {};
  const positionals = [];
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--tier') {
      overrides.tier = args[++i];
    } else if (arg === '--size') {
      overrides.size = args[++i];
    } else if (arg === '--compliance') {
      overrides.compliance = args[++i];
    } else if (!arg.startsWith('--')) {
      positionals.push(arg);
    }
  }
  const source = positionals[0];
  if (!source) {
    die(
      'usage: npm run design:triage -- <source> [--tier X] [--size small|large] [--compliance on|off]',
    );
  }
  const text = fs.existsSync(source) ? readText(source) : source;
  const result = triageText(text, overrides);
  printResult({
    source,
    tier: result.tier,
    tier_reason: result.tierReason,
    size: result.size,
    size_reason: result.sizeReason,
    rounds_max: result.roundsMax,
    compliance: result.compliance,
    compliance_reason: result.complianceReason || 'none',
    rules: result.rulesFired.join('; '),
  });
  if (!result.tier) {
    process.exit(2);
  }
}

if (
  process.argv[1] &&
  fileURLToPath(import.meta.url) === path.resolve(process.argv[1])
) {
  main();
}
