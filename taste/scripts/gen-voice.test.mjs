// gen-voice.test.mjs — genVoiceGuide: a canonical brand-spec → a deterministic Markdown voice guide.
// Run: node --test taste/scripts/gen-voice.test.mjs
//
// genVoiceGuide is the PURE, AI-free, network-free core (brand-spec in → one Markdown string out),
// so it's unit-testable here like the wing's other pure cores (genLogo, emitBrandSpec). The
// file-writing CLI lives behind the isMain() guard and is not exercised here.

import { test } from 'node:test';
import assert from 'node:assert';
import { genVoiceGuide } from './gen-voice.mjs';

// A minimal but representative canonical brand-spec (HDILINT/Fitcheck shape). Note vocabulary is
// intentionally empty — that is the real spec's shape, and the edge case we must survive.
const SPEC = {
  brand: 'fitcheck',
  identity: { name: 'Fitcheck', tagline: 'Let every shopper become your product model' },
  positioning: { category: 'technology', differentiation: 'done-for-you VTO' },
  voice_tokens: {
    tone: ['direct', 'confident', 'pragmatic', 'fast-moving', 'proof-seeking'],
    vocabulary: [],
    dos: ['lead with outcomes/ROI'],
    donts: ['overhype the AI'],
  },
  persona: {
    who: 'Founder / CEO of Shopify Fashion Brand (10-50 employees)',
    pains: ['Returns are killing margin due to fit uncertainty'],
    gains: ['Reduce fit-related returns by 15-25%', 'Increase add-to-cart rate by 20-40%'],
  },
};

test('genVoiceGuide returns a non-empty Markdown string (ISC-2)', () => {
  const out = genVoiceGuide(SPEC);
  assert.equal(typeof out, 'string', 'returns a string');
  assert.ok(out.length > 0, 'string is non-empty');
  assert.match(out, /^# Fitcheck — Voice & Tone Guide/, 'starts with the brand H1');
});

test('output contains every tone token (ISC-3)', () => {
  const out = genVoiceGuide(SPEC);
  for (const tok of SPEC.voice_tokens.tone) {
    assert.ok(out.includes(tok), `tone token "${tok}" appears in the guide`);
  }
});

test('Do / Don\'t sections carry the dos and donts (ISC-4, ISC-5)', () => {
  const out = genVoiceGuide(SPEC);
  assert.match(out, /### Do\b/, 'has a Do section');
  assert.match(out, /### Don't/, 'has a Don\'t section');
  assert.ok(out.includes('lead with outcomes/ROI'), 'renders the dos entry');
  assert.ok(out.includes('overhype the AI'), 'renders the donts entry');
});

test('includes a "Writing for {persona.who}" section (ISC-6)', () => {
  const out = genVoiceGuide(SPEC);
  assert.ok(out.includes(`## Writing for ${SPEC.persona.who}`), 'section heading names the persona');
  // and it speaks to a pain + promises a gain
  assert.ok(out.includes(SPEC.persona.pains[0]), 'addresses a persona pain');
  assert.ok(out.includes(SPEC.persona.gains[0]), 'promises a persona gain');
});

test('includes 2–3 example rewrites in a table (ISC-7)', () => {
  const out = genVoiceGuide(SPEC);
  assert.match(out, /## Example rewrites/, 'has an example-rewrites section');
  assert.match(out, /\| Generic \| On-brand \|/, 'rewrites are a Generic→On-brand table');
  // count only the rewrite DATA rows: pipe rows that are neither the header nor the
  // `| --- | --- |` separator.
  const dataRows = out
    .split('\n')
    .filter((l) => /^\| .+ \| .+ \|$/.test(l)) // any pipe row
    .filter((l) => !/^\|\s*Generic\s*\|/.test(l)) // drop the header
    .filter((l) => !/^\|[\s-]*\|[\s-]*\|$/.test(l)).length; // drop the --- separator
  assert.ok(dataRows >= 2 && dataRows <= 3, `has 2–3 rewrite rows (found ${dataRows})`);
});

test('empty vocabulary renders a graceful fallback, no crash (ISC-8)', () => {
  // SPEC.voice_tokens.vocabulary is [] — must not crash and must not leak undefined/null
  const out = genVoiceGuide(SPEC);
  assert.match(out, /## Vocabulary/, 'still renders a Vocabulary section');
  assert.doesNotMatch(out, /undefined|null/, 'no undefined/null leaks into output');
  // a spec with NO vocabulary key at all is also fine
  const noVocab = { ...SPEC, voice_tokens: { ...SPEC.voice_tokens, vocabulary: undefined } };
  assert.doesNotThrow(() => genVoiceGuide(noVocab), 'missing vocabulary key does not throw');
});

test('genVoiceGuide is pure: same input → identical output (ISC-9)', () => {
  assert.equal(genVoiceGuide(SPEC), genVoiceGuide(SPEC), 'deterministic — same input yields same output');
});

test('genVoiceGuide does not mutate its input spec (ISC-10)', () => {
  const before = JSON.stringify(SPEC);
  genVoiceGuide(SPEC);
  assert.equal(JSON.stringify(SPEC), before, 'input spec is untouched');
});

test('survives a spec with no persona and no voice tokens at all (edge)', () => {
  const bare = { brand: 'acme', identity: { name: 'Acme' }, positioning: { category: 'tools', differentiation: 'x' }, voice_tokens: { tone: [] }, visual_tokens: { palette: ['#000'] } };
  let out;
  assert.doesNotThrow(() => { out = genVoiceGuide(bare); }, 'no persona / empty tone does not throw');
  assert.ok(out.length > 0, 'still produces a non-empty guide');
  assert.doesNotMatch(out, /undefined|null/, 'no undefined/null leaks for a bare spec');
});
