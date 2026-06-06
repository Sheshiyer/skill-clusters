// brand-tokens.test.mjs — the shared, safe brand-spec reader behind the brandmint generators.
// Run: node --test taste/scripts/lib/brand-tokens.test.mjs
//
// isStr/asArr/oneLine and readBrandTokens are PURE (spec in → plain values out), so they're unit-
// testable in isolation. These cases pin the SAFE FALLBACKS — the whole reason this module exists is
// that a (possibly under-specified) spec must never leak undefined/null into a generator's body.

import { test } from 'node:test';
import assert from 'node:assert';
import { isStr, asArr, oneLine, readBrandTokens } from './brand-tokens.mjs';

// Every field readBrandTokens returns for the empty spec — the canonical fallback shape.
const EMPTY_FALLBACKS = {
  name: 'The brand',
  tagline: '',
  mission: '',
  palette: [],
  tone: [],
  vocabulary: [],
  dos: [],
  donts: [],
  category: 'solution',
  differentiation: '',
  target: '',
  who: '',
  pains: [],
  gains: [],
};

// ---- string helpers -------------------------------------------------------

test('isStr: only a non-empty, non-whitespace string is usable', () => {
  for (const ok of ['a', '  a  ', 'multi word', '0']) assert.equal(isStr(ok), true, `"${ok}" is usable`);
  for (const no of ['', '   ', '\n\t', null, undefined, 0, 1, NaN, [], {}, ['x']]) {
    assert.equal(isStr(no), false, `${JSON.stringify(no)} is not a usable string`);
  }
});

test('asArr: keeps only usable strings, trimmed; anything non-array → []', () => {
  assert.deepEqual(asArr(['a', '', '  b  ', 2, null, undefined, {}, 'c']), ['a', 'b', 'c']);
  assert.deepEqual(asArr([]), []);
  for (const notArr of [undefined, null, 'a', 7, {}, { length: 2 }]) {
    assert.deepEqual(asArr(notArr), [], `${JSON.stringify(notArr)} → []`);
  }
});

test('oneLine: flattens newlines + collapses whitespace runs; non-string → ""', () => {
  assert.equal(oneLine('a\n  b   c'), 'a b c');
  assert.equal(oneLine('  padded \n line  '), 'padded line');
  assert.equal(oneLine('single'), 'single');
  for (const notStr of [undefined, null, 42, [], {}]) assert.equal(oneLine(notStr), '', 'non-string → ""');
});

// ---- readBrandTokens: fallbacks -------------------------------------------

test('readBrandTokens({}) yields every documented safe fallback', () => {
  assert.deepEqual(readBrandTokens({}), EMPTY_FALLBACKS);
});

test('readBrandTokens() with no argument defaults to the empty-spec fallbacks', () => {
  assert.deepEqual(readBrandTokens(), EMPTY_FALLBACKS);
});

test('readBrandTokens: name precedence identity.name → brand → "The brand", all trimmed', () => {
  assert.equal(readBrandTokens({ identity: { name: '  Acme  ' }, brand: 'ignored' }).name, 'Acme', 'identity.name wins, trimmed');
  assert.equal(readBrandTokens({ brand: '  acme  ' }).name, 'acme', 'falls back to brand, trimmed');
  assert.equal(readBrandTokens({ identity: { name: '   ' }, brand: 'fb' }).name, 'fb', 'whitespace-only name is skipped');
  assert.equal(readBrandTokens({ identity: { name: '' }, brand: '' }).name, 'The brand', 'both empty → literal fallback');
  assert.equal(readBrandTokens({}).name, 'The brand', 'nothing → literal fallback');
});

test('readBrandTokens: category falls back to "solution"; other string fields to ""', () => {
  const t = readBrandTokens({ identity: { name: 'X' } });
  assert.equal(t.category, 'solution', 'category has a word fallback, not ""');
  for (const f of ['tagline', 'mission', 'differentiation', 'target', 'who']) {
    assert.equal(t[f], '', `${f} falls back to ""`);
  }
});

test('readBrandTokens: every list field falls back to [] (missing voice_tokens/persona/visual_tokens)', () => {
  const t = readBrandTokens({ identity: { name: 'X' } });
  for (const f of ['palette', 'tone', 'vocabulary', 'dos', 'donts', 'pains', 'gains']) {
    assert.deepEqual(t[f], [], `${f} falls back to []`);
  }
});

// ---- readBrandTokens: reads a real spec -----------------------------------

test('readBrandTokens: reads a fully-specified spec into the flat token shape', () => {
  const spec = {
    brand: 'fallback-brand',
    identity: { name: 'Acme', tagline: 'Ship it', mission: 'We make things' },
    visual_tokens: { palette: ['#FF6B35', '#1A1A2E', '#16213E'] },
    voice_tokens: { tone: ['direct', 'bold'], vocabulary: ['ship', 'launch'], dos: ['lead with the outcome'], donts: ['no hype'] },
    positioning: { category: 'platform', differentiation: 'the only X that Y', target_market: 'SMB founders' },
    persona: { who: 'Founder', pains: ['too slow'], gains: ['ship faster'] },
  };
  assert.deepEqual(readBrandTokens(spec), {
    name: 'Acme', // identity.name beats spec.brand
    tagline: 'Ship it',
    mission: 'We make things',
    palette: ['#FF6B35', '#1A1A2E', '#16213E'],
    tone: ['direct', 'bold'],
    vocabulary: ['ship', 'launch'],
    dos: ['lead with the outcome'],
    donts: ['no hype'],
    category: 'platform',
    differentiation: 'the only X that Y',
    target: 'SMB founders',
    who: 'Founder',
    pains: ['too slow'],
    gains: ['ship faster'],
  });
});

test('readBrandTokens: oneLine-flattens the prose fields (tagline/mission/category/differentiation/target/who)', () => {
  const t = readBrandTokens({
    identity: { name: 'X', tagline: 'a\n  b', mission: 'm1\n\n m2' },
    positioning: { category: 'c\n c2', differentiation: 'd1\nd2', target_market: 't\n t2' },
    persona: { who: 'w\n w2' },
  });
  assert.equal(t.tagline, 'a b');
  assert.equal(t.mission, 'm1 m2');
  assert.equal(t.category, 'c c2');
  assert.equal(t.differentiation, 'd1 d2');
  assert.equal(t.target, 't t2');
  assert.equal(t.who, 'w w2');
});

test('readBrandTokens: asArr-cleans the list fields (drops blanks/non-strings, trims)', () => {
  const t = readBrandTokens({
    voice_tokens: { tone: ['direct', '', '  bold  ', 2, null], vocabulary: [' ship '], dos: ['a', ''], donts: [null, 'b'] },
    persona: { pains: ['  p1  ', 7], gains: ['g1', undefined, 'g2'] },
  });
  assert.deepEqual(t.tone, ['direct', 'bold']);
  assert.deepEqual(t.vocabulary, ['ship']);
  assert.deepEqual(t.dos, ['a']);
  assert.deepEqual(t.donts, ['b']);
  assert.deepEqual(t.pains, ['p1']);
  assert.deepEqual(t.gains, ['g1', 'g2']);
});

test('readBrandTokens: palette is the RAW positional array (not asArr-filtered), [] when not an array', () => {
  // positional: [0]=accent, [1]=dark — so blanks/gaps are preserved, unlike the asArr list fields.
  assert.deepEqual(readBrandTokens({ visual_tokens: { palette: ['#a', '', '#c'] } }).palette, ['#a', '', '#c']);
  assert.deepEqual(readBrandTokens({ visual_tokens: { palette: ['#0A84FF'] } }).palette, ['#0A84FF']);
  for (const bad of [undefined, null, 'nope', 42, {}]) {
    assert.deepEqual(readBrandTokens({ visual_tokens: { palette: bad } }).palette, [], 'non-array palette → []');
  }
  assert.deepEqual(readBrandTokens({ visual_tokens: {} }).palette, []);
});

// ---- readBrandTokens: purity ---------------------------------------------

test('readBrandTokens: never leaks undefined/null into a string field for a bare spec', () => {
  const t = readBrandTokens({ identity: { name: 'X' } });
  for (const [k, v] of Object.entries(t)) {
    if (typeof v === 'string') assert.doesNotMatch(v, /undefined|null/, `${k} carries no undefined/null`);
  }
});

test('readBrandTokens is pure: deterministic and does not mutate its input', () => {
  const spec = {
    identity: { name: 'Acme', tagline: 'Ship it' },
    voice_tokens: { tone: ['direct'] },
    persona: { pains: ['slow'], gains: ['fast'] },
    visual_tokens: { palette: ['#a', '#b'] },
  };
  const before = JSON.stringify(spec);
  const a = readBrandTokens(spec);
  const b = readBrandTokens(spec);
  assert.deepEqual(a, b, 'same input → deep-equal output');
  assert.equal(JSON.stringify(spec), before, 'input spec is untouched');
});
