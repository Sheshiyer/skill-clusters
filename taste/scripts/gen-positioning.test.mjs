// gen-positioning.test.mjs — genPositioning: a canonical brand-spec → a deterministic Markdown brief.
// Run: node --test taste/scripts/gen-positioning.test.mjs
//
// genPositioning is the PURE, AI-free, network-free core (brand-spec in → one Markdown string out),
// so it's unit-testable here like the wing's other pure cores (genLogo, genVoiceGuide, emitBrandSpec).
// The file-writing CLI lives behind the isMain() guard and is not exercised here.

import { test } from 'node:test';
import assert from 'node:assert';
import { genPositioning } from './gen-positioning.mjs';

// A minimal but representative canonical brand-spec (HDILINT/Fitcheck shape).
const SPEC = {
  brand: 'fitcheck',
  identity: {
    name: 'Fitcheck',
    tagline: 'Let every shopper become your product model',
    mission: 'Fitcheck is a done-for-you AI virtual try-on launch service for Shopify fashion brands.',
  },
  positioning: {
    category: 'technology',
    differentiation: 'Done-for-you AI virtual try-on launch service: Personalized demo renders used as outbound hook; 48-hour launch promise from approval to live; Shopify-first workflow, not API/manual export',
    target_market: 'Founder / CEO of Shopify Fashion Brand — Fashion, Activewear, Swimwear',
  },
  persona: {
    who: 'Founder / CEO of Shopify Fashion Brand (10-50 employees)',
    pains: [
      'Returns are killing margin due to fit uncertainty',
      'Customers hesitate because photos don\'t show their body type',
    ],
    gains: [
      'Reduce fit-related returns by 15-25%',
      'Increase add-to-cart rate by 20-40%',
      'Launch a wow buying moment without a months-long technical project',
    ],
  },
};

test('genPositioning returns a non-empty Markdown string (ISC-13)', () => {
  const out = genPositioning(SPEC);
  assert.equal(typeof out, 'string', 'returns a string');
  assert.ok(out.length > 0, 'string is non-empty');
  assert.match(out, /^# Fitcheck — Positioning Brief/, 'starts with the brand H1');
});

test('output contains the positioning category (ISC-14)', () => {
  const out = genPositioning(SPEC);
  assert.ok(out.includes(SPEC.positioning.category), 'category appears in the brief');
});

test('output contains the target_market text (ISC-15)', () => {
  const out = genPositioning(SPEC);
  assert.ok(out.includes(SPEC.positioning.target_market), 'target_market appears in the brief');
});

test('output has a one-line positioning statement in the classic template (ISC-16)', () => {
  const out = genPositioning(SPEC);
  assert.match(out, /## Positioning statement/, 'has a positioning-statement section');
  // the classic "For … who …, {Name} is the {category} that … — unlike … it …" shape
  assert.match(out, /For .+ who .+, Fitcheck is the technology that .+ — unlike .+ it .+\./, 'matches the classic template');
});

test('renders 3–5 value props mapped from gains (ISC-17)', () => {
  const out = genPositioning(SPEC);
  assert.match(out, /## Value propositions/, 'has a value-props section');
  // a gain shows up as a value prop
  assert.ok(out.includes(SPEC.persona.gains[0]), 'first gain becomes a value prop');
  // numbered 1..N with 3..5 entries
  const numberedLines = out.split('\n').filter((l) => /^\d+\.\s+/.test(l));
  assert.ok(numberedLines.length >= 3 && numberedLines.length <= 5, `3–5 value props (found ${numberedLines.length})`);
});

test('renders the pains it addresses (ISC-18)', () => {
  const out = genPositioning(SPEC);
  assert.match(out, /## Pains it addresses/, 'has a pains section');
  for (const pain of SPEC.persona.pains) {
    assert.ok(out.includes(pain), `pain "${pain.slice(0, 24)}…" is listed`);
  }
});

test('genPositioning is pure and does not mutate its input spec (ISC-19)', () => {
  const before = JSON.stringify(SPEC);
  const a = genPositioning(SPEC);
  const b = genPositioning(SPEC);
  assert.equal(a, b, 'deterministic — same input yields same output');
  assert.equal(JSON.stringify(SPEC), before, 'input spec is untouched');
});

test('a spec missing an optional field does not crash (ISC-20)', () => {
  // no persona at all, no target_market, no mission — only the required fields
  const bare = {
    brand: 'acme',
    identity: { name: 'Acme' },
    positioning: { category: 'tools', differentiation: 'the only one that ships in a day' },
    voice_tokens: { tone: ['direct'] },
    visual_tokens: { palette: ['#000'] },
  };
  let out;
  assert.doesNotThrow(() => { out = genPositioning(bare); }, 'missing optional fields do not throw');
  assert.ok(out.length > 0, 'still produces a non-empty brief');
  assert.ok(out.includes('tools'), 'still surfaces the category');
  assert.doesNotMatch(out, /undefined|null/, 'no undefined/null leaks for a bare spec');
  // the classic template still resolves end-to-end even with no persona
  assert.match(out, /For .+ who .+, Acme is the tools that .+ — unlike .+ it .+\./, 'template survives a personaless spec');
});
