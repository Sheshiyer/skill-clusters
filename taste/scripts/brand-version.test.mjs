// brand-version.test.mjs — brand-spec versioning + diffing.
// Run: node --test taste/scripts/brand-version.test.mjs
//
// A brand-spec is the brand-truth contract. versionOf() stamps a deterministic content hash so a
// spec can be pinned/compared by value (not by mtime); diffSpecs() shows exactly which brand-truth
// fields moved between two versions. Both are PURE — they never touch their inputs.

import { test } from 'node:test';
import assert from 'node:assert';

import { versionOf, diffSpecs } from './brand-version.mjs';

// --- a representative spec (shape mirrors taste/schemas/brand-spec.schema.json) ---------------------

function baseSpec() {
  return {
    brand: 'fitcheck',
    identity: {
      name: 'Fitcheck',
      tagline: 'Let every shopper become your product model',
      mission: 'AI virtual try-on for Shopify fashion brands.',
    },
    positioning: {
      category: 'technology',
      differentiation: 'Done-for-you AI virtual try-on.',
      target_market: 'Shopify fashion founders',
    },
    voice_tokens: {
      tone: ['direct', 'confident'],
      vocabulary: [],
      dos: ['lead with ROI'],
      donts: ['overhype the AI'],
    },
    visual_tokens: {
      palette: ['#FF6B35', '#1A1A2E', '#16213E'],
      type: { heading: 'bold sans-serif', body: 'clean sans-serif' },
      motion: 'purposeful, fast',
    },
    persona: {
      who: 'Founder / CEO of Shopify Fashion Brand',
      pains: ['Returns kill margin'],
      gains: ['Reduce returns 15-25%'],
    },
    taste_seed: { aesthetic: 'bold, sage/hero', references: [] },
  };
}

// --- versionOf -------------------------------------------------------------------------------------

test('versionOf returns a 12-char lowercase hex hash', () => {
  const ver = versionOf(baseSpec());
  assert.match(ver, /^[0-9a-f]{12}$/);
});

test('versionOf is stable: same spec → same hash', () => {
  assert.equal(versionOf(baseSpec()), versionOf(baseSpec()));
});

test('versionOf is order-invariant: key insertion order does not change the hash', () => {
  const a = baseSpec();
  // build an identical spec with keys inserted in a different order
  const b = {
    taste_seed: a.taste_seed,
    persona: a.persona,
    visual_tokens: a.visual_tokens,
    voice_tokens: a.voice_tokens,
    positioning: a.positioning,
    identity: a.identity,
    brand: a.brand,
  };
  assert.equal(versionOf(a), versionOf(b));
});

test('versionOf changes when a field changes', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.identity.tagline = 'A completely different tagline';
  assert.notEqual(versionOf(a), versionOf(b));
});

test('versionOf changes when a nested palette entry changes', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.visual_tokens.palette[0] = '#000000';
  assert.notEqual(versionOf(a), versionOf(b));
});

// --- diffSpecs -------------------------------------------------------------------------------------

test('diffSpecs on identical specs reports no changes', () => {
  const d = diffSpecs(baseSpec(), baseSpec());
  assert.deepEqual(d, { changed: [], added: [], removed: [] });
});

test('diffSpecs detects a changed tagline as { path, from, to }', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.identity.tagline = 'New tagline';
  const d = diffSpecs(a, b);
  const hit = d.changed.find((c) => c.path === 'identity.tagline');
  assert.ok(hit, 'identity.tagline reported as changed');
  assert.equal(hit.from, 'Let every shopper become your product model');
  assert.equal(hit.to, 'New tagline');
});

test('diffSpecs detects a changed palette entry by index path', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.visual_tokens.palette[0] = '#000000';
  const d = diffSpecs(a, b);
  const hit = d.changed.find((c) => c.path === 'visual_tokens.palette[0]');
  assert.ok(hit, 'visual_tokens.palette[0] reported as changed');
  assert.equal(hit.from, '#FF6B35');
  assert.equal(hit.to, '#000000');
});

test('diffSpecs reports an added field path', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.voice_tokens.vocabulary = ['try-on', 'fit']; // a was []
  b.identity.legal_name = 'Fitcheck Inc.';        // brand-new key
  const d = diffSpecs(a, b);
  assert.ok(d.added.includes('identity.legal_name'), 'new key reported as added');
});

test('diffSpecs reports a removed field path', () => {
  const a = baseSpec();
  const b = baseSpec();
  delete b.positioning.target_market;
  const d = diffSpecs(a, b);
  assert.ok(d.removed.includes('positioning.target_market'), 'deleted key reported as removed');
});

test('diffSpecs detects an added array element', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.voice_tokens.tone.push('pragmatic'); // index [2] is new
  const d = diffSpecs(a, b);
  assert.ok(d.added.includes('voice_tokens.tone[2]'), 'new array element reported as added');
});

test('diffSpecs detects a removed array element', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.voice_tokens.tone.pop(); // index [1] gone
  const d = diffSpecs(a, b);
  assert.ok(d.removed.includes('voice_tokens.tone[1]'), 'dropped array element reported as removed');
});

test('diffSpecs is PURE: both input specs are left untouched', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.identity.tagline = 'Mutated B';
  b.visual_tokens.palette[0] = '#000000';
  delete b.positioning.target_market;
  const aSnapshot = JSON.stringify(a);
  const bSnapshot = JSON.stringify(b);
  diffSpecs(a, b);
  assert.equal(JSON.stringify(a), aSnapshot, 'a unchanged after diff');
  assert.equal(JSON.stringify(b), bSnapshot, 'b unchanged after diff');
});

test('diffSpecs only walks the brand-truth sections (ignores brand slug + assets)', () => {
  const a = baseSpec();
  const b = baseSpec();
  b.brand = 'renamed-slug';           // out of scope
  b.assets = [{ id: 'x', path: './x' }]; // out of scope
  const d = diffSpecs(a, b);
  assert.deepEqual(d, { changed: [], added: [], removed: [] });
});
