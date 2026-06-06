// emit-brand-spec.test.mjs — brandmint brand-config → canonical brand-spec mapper.
// Run: node --test taste/scripts/emit-brand-spec.test.mjs
//
// emitBrandSpec is the buildable half of the brandmint → taste seam: it turns a parsed
// brand-config object into the canonical brand-spec. The load-bearing assertion is the last
// one — whatever the mapping does, the emitted spec MUST satisfy validateBrandSpec, because a
// malformed spec is how "on-brand" silently becomes "off-brand" downstream.

import { test } from 'node:test';
import assert from 'node:assert';
import { emitBrandSpec } from './emit-brand-spec.mjs';
import { validateBrandSpec } from './validate-brand-spec.mjs';

// A small but representative fixture mirroring brand-config.yaml's shape (multi-line `|`
// description + solution, list audience fields, null logo, one existing asset).
function fixtureConfig() {
  return {
    brand: {
      name: 'Fitcheck',
      slug: 'fitcheck',
      tagline: 'Let every shopper become your product model',
      category: 'technology',
    },
    company: {
      description:
        'Fitcheck is a done-for-you AI virtual try-on launch service for Shopify\nfashion brands. We help brands show shoppers how products could look.',
      solution:
        'Done-for-you AI virtual try-on launch service:\n- Personalized demo renders\n- 48-hour launch promise',
    },
    audience: {
      primary: {
        title: 'Founder / CEO of Shopify Fashion Brand',
        company_size: '10-50 employees',
        industry: 'Fashion, Activewear, Swimwear',
        pain_points: ['Returns kill margin', 'Photos do not show body type'],
        goals: ['Reduce returns 15-25%', 'Increase add-to-cart 20-40%'],
      },
    },
    personality: {
      traits: ['direct', 'confident', 'pragmatic'],
      archetypes: { primary: 'sage', secondary: 'hero' },
    },
    visual_preferences: {
      color_mood: 'bold',
      photography_style: 'authentic',
      illustration_style: 'flat',
      preferred_colors: ['#FF6B35', '#1A1A2E', '#16213E'],
    },
    user_provided_assets: {
      logo: { primary: { path: null, required: false } },
      screenshots: [],
      existing: [
        { path: './reference/product-marketing-context.md', type: 'reference', note: 'ctx' },
      ],
    },
  };
}

test('maps the core scalar/identity fields', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.strictEqual(spec.brand, 'fitcheck');
  assert.strictEqual(spec.identity.name, 'Fitcheck');
  assert.strictEqual(spec.identity.tagline, 'Let every shopper become your product model');
  // mission = first sentence of the description, with the `|` block's newlines flattened.
  assert.strictEqual(
    spec.identity.mission,
    'Fitcheck is a done-for-you AI virtual try-on launch service for Shopify fashion brands.'
  );
});

test('positioning collapses the multi-line solution to one line and builds target_market', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.strictEqual(spec.positioning.category, 'technology');
  assert.ok(!spec.positioning.differentiation.includes('\n'), 'differentiation must be one line');
  assert.match(spec.positioning.differentiation, /Personalized demo renders/);
  assert.strictEqual(
    spec.positioning.target_market,
    'Founder / CEO of Shopify Fashion Brand — Fashion, Activewear, Swimwear'
  );
});

test('persona carries who + the pains/gains arrays straight through', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.strictEqual(spec.persona.who, 'Founder / CEO of Shopify Fashion Brand (10-50 employees)');
  assert.deepEqual(spec.persona.pains, ['Returns kill margin', 'Photos do not show body type']);
  assert.deepEqual(spec.persona.gains, ['Reduce returns 15-25%', 'Increase add-to-cart 20-40%']);
});

test('voice_tokens.tone IS the personality.traits array (the required voice field)', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.deepEqual(spec.voice_tokens.tone, ['direct', 'confident', 'pragmatic']);
  assert.ok(Array.isArray(spec.voice_tokens.dos) && spec.voice_tokens.dos.length > 0);
  assert.ok(Array.isArray(spec.voice_tokens.donts) && spec.voice_tokens.donts.length > 0);
});

test('visual_tokens.palette IS the preferred_colors array', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.deepEqual(spec.visual_tokens.palette, ['#FF6B35', '#1A1A2E', '#16213E']);
  assert.strictEqual(spec.visual_tokens.type.heading, 'bold sans-serif');
  assert.match(spec.visual_tokens.imagery, /authentic/);
  assert.match(spec.visual_tokens.imagery, /flat/);
});

test('taste_seed combines color_mood + the two archetypes', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.strictEqual(spec.taste_seed.aesthetic, 'bold, sage/hero');
  assert.deepEqual(spec.taste_seed.references, []);
});

test('assets map existing[] and SKIP the null logo, tagging origin user_provided', () => {
  const spec = emitBrandSpec(fixtureConfig());
  assert.strictEqual(spec.assets.length, 1, 'null logo is skipped; only the existing asset remains');
  assert.deepEqual(spec.assets[0], {
    id: 'product-marketing-context.md',
    kind: 'reference',
    path: './reference/product-marketing-context.md',
    origin: 'user_provided',
  });
});

// THE load-bearing test: whatever the mapping does, the result is a VALID brand-spec.
test('emitBrandSpec produces a spec that passes validateBrandSpec', () => {
  const res = validateBrandSpec(emitBrandSpec(fixtureConfig()));
  assert.deepEqual(res, { valid: true, errors: [] });
});

// Defensiveness: a near-empty config must still yield a structurally VALID spec (required
// keys present, required nested fields present, arrays where arrays are required).
test('a sparse config still emits a structurally valid spec (defensive defaults)', () => {
  const spec = emitBrandSpec({ brand: { slug: 'x', name: 'X' } });
  const res = validateBrandSpec(spec);
  assert.deepEqual(res, { valid: true, errors: [] }, JSON.stringify(res.errors));
});
