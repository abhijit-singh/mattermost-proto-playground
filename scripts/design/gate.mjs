import { readText } from './lib.mjs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { runStarter } from './prove.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const rules = JSON.parse(readText(path.join(here, 'triage.rules.json')));
const sizeRules = JSON.parse(readText(path.join(here, 'size.rules.json')));

const fields = [
  'tier',
  'size',
  'compliance',
  'outcome_headline',
  'users',
  'customer_words',
];

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

function confidenceLow(value) {
  if (typeof value === 'number') {
    return value < 0.6;
  }
  return String(value || '').toLowerCase() === 'low';
}

function asField(entry) {
  if (entry == null || typeof entry !== 'object' || Array.isArray(entry)) {
    return null;
  }
  return {
    value: entry.value == null ? null : entry.value,
    confidence: entry.confidence,
    evidence: Array.isArray(entry.evidence) ? entry.evidence : null,
  };
}

export function collectSignals(text) {
  const signals = [];
  for (const [name, phrases] of Object.entries(rules.strongSignals || {})) {
    const hits = phraseHits(text, phrases);
    if (hits.length) {
      signals.push({ kind: 'strong', tier: name, hits });
    }
  }
  for (const name of rules.tierOrder) {
    const hits = phraseHits(text, rules.tiers[name].phrases || []);
    if (hits.length) {
      signals.push({ kind: 'phrase', tier: name, hits });
    }
  }
  const surfaces = phraseHits(text, rules.uiSurface).filter((hit) => {
    if (hit !== 'ui') {
      return true;
    }
    return /\bui\b/i.test(text.replace(/\bno\s+ui\b/gi, ' '));
  });
  if (surfaces.length) {
    signals.push({ kind: 'surface', tier: 'tweak', hits: surfaces });
  }
  const compliance = phraseHits(text, rules.compliance);
  const large = phraseHits(text, sizeRules.large);
  const small = phraseHits(text, sizeRules.small);
  return { signals, surfaces, compliance, large, small };
}

function explicitOverride(text, overrides) {
  if (overrides.tier) {
    const tier = rules.aliases[overrides.tier] || overrides.tier;
    return { tier, reason: '--tier' };
  }
  const ask = String(text).match(
    /^\s*ask:\s*(explore|prototype|tweak|skip)\s*$/im,
  );
  if (ask) {
    return { tier: ask[1], reason: `seed ask: ${ask[1]}` };
  }
  const label = String(text).match(
    /design:(none|note|full|skip|tweak|explore|prototype)\b/i,
  );
  if (label) {
    const raw = label[1].toLowerCase();
    return { tier: rules.aliases[raw] || raw, reason: `label design:${raw}` };
  }
  return null;
}

function quotesInSource(evidence, text) {
  return evidence.every((quote) => text.includes(String(quote)));
}

export function gateTriage({ text, triage, overrides = {}, starter }) {
  const found = collectSignals(text);
  const reasons = [];
  if (!triage || typeof triage !== 'object') {
    return {
      ok: false,
      stop: 'escalate',
      stopReason: 'triage.json is missing. The triage agent has not proposed.',
      signals: found.signals,
    };
  }
  const parsed = {};
  for (const name of fields) {
    const field = asField(triage[name]);
    if (!field || field.evidence == null || field.confidence == null) {
      reasons.push(`${name} is missing confidence or evidence`);
      continue;
    }
    parsed[name] = field;
    if (!quotesInSource(field.evidence, text)) {
      reasons.push(
        `${name} evidence is not a word-for-word quote from the source`,
      );
    }
  }
  const recommendation = triage.designer_recommendation;
  if (
    !recommendation ||
    typeof recommendation.involve !== 'boolean' ||
    !recommendation.reason
  ) {
    reasons.push('designer_recommendation needs involve and reason');
  }
  if (reasons.length) {
    return {
      ok: false,
      stop: 'escalate',
      stopReason: reasons.join('; '),
      signals: found.signals,
    };
  }

  let tier = String(parsed.tier.value || '');
  const override = explicitOverride(text, overrides);
  if (override) {
    tier = override.tier;
  }
  if (!rules.tierOrder.includes(tier)) {
    return {
      ok: false,
      stop: 'escalate',
      stopReason: `Proposed tier ${tier || '(empty)'} is not skip, tweak, explore, or prototype.`,
      signals: found.signals,
    };
  }

  const strong = found.signals.filter((item) => item.kind === 'strong');
  const strongTiers = [...new Set(strong.map((item) => item.tier))];
  if (strongTiers.length > 1) {
    reasons.push(
      `tier phrases conflict: ${strongTiers.join(', ')} (${strong.map((item) => item.hits.join('+')).join('; ')})`,
    );
  }
  const against = strong.filter((item) => item.tier !== tier);
  if (against.length && !override) {
    reasons.push(
      `proposed tier ${tier} contradicts ${against.map((item) => `${item.tier}:${item.hits.join('+')}`).join(', ')}`,
    );
  }
  if (confidenceLow(parsed.tier.confidence) && !override) {
    reasons.push(`tier confidence is ${parsed.tier.confidence}`);
  }
  if (tier !== 'skip' && confidenceLow(parsed.outcome_headline.confidence)) {
    reasons.push(`outcome confidence is ${parsed.outcome_headline.confidence}`);
  }
  if (tier !== 'skip') {
    const outcome = parsed.outcome_headline.value;
    if (!outcome || !parsed.outcome_headline.evidence.length) {
      reasons.push('outcome cannot be grounded in the source');
    }
  }
  if (reasons.length) {
    return {
      ok: false,
      tier,
      stop: 'escalate',
      stopReason: reasons.join('; '),
      signals: found.signals,
    };
  }

  let compliance = Boolean(parsed.compliance.value);
  let complianceCorrected = false;
  if (found.compliance.length && !compliance) {
    compliance = true;
    complianceCorrected = true;
  }
  const size = parsed.size.value === 'large' ? 'large' : 'small';
  const roundsMax =
    tier === 'tweak'
      ? sizeRules.tweakRoundsMax
      : size === 'large'
        ? sizeRules.largeRoundsMax
        : sizeRules.smallRoundsMax;
  const outcome = parsed.outcome_headline.value;
  return {
    ok: true,
    stop: null,
    stopReason: null,
    tier,
    override,
    size,
    roundsMax,
    compliance,
    complianceCorrected,
    outcome,
    outcomeInferred: Boolean(outcome),
    users: parsed.users.value || null,
    usersInferred: Boolean(parsed.users.value),
    customerWords: parsed.customer_words.value || null,
    customerWordsInferred: Boolean(parsed.customer_words.value),
    decider: starter || runStarter(),
    designerRecommendation: {
      involve: recommendation.involve,
      reason: recommendation.reason,
    },
    signals: found.signals,
    complianceHits: found.compliance,
  };
}
