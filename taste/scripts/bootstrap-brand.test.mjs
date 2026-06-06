// bootstrap-brand.test.mjs — composeBrandDNA: fold the canonical brand-spec into brand-DNA text + rules.
// Run: node --test taste/scripts/bootstrap-brand.test.mjs
//
// The embedding/file-write half of bootstrap-brand is NIM-gated and lives behind the CLI main() guard;
// composeBrandDNA is the pure, NIM-free core, so it's unit-testable here without a network call.

import { test } from 'node:test';
import assert from 'node:assert';
import { composeBrandDNA } from './bootstrap-brand.mjs';

// A minimal but representative canonical brand-spec (HDILINT/Fitcheck shape).
const SPEC = {
  brand: 'fitcheck',
  identity: { name: 'Fitcheck', tagline: 'Let every shopper become your product model', mission: 'done-for-you AI virtual try-on launch service' },
  positioning: { category: 'technology', differentiation: 'Done-for-you AI virtual try-on launch service', target_market: 'Founder / CEO of Shopify Fashion Brand' },
  voice_tokens: { tone: ['direct', 'confident', 'pragmatic'], vocabulary: [], dos: [], donts: [] },
  visual_tokens: { palette: ['#FF6B35', '#1A1A2E'], type: { heading: 'bold sans-serif', body: 'clean sans-serif' }, motion: 'purposeful, fast', imagery: 'authentic photography' },
  persona: { who: 'Founder / CEO of Shopify Fashion Brand', pains: [], gains: [] },
  taste_seed: { aesthetic: 'bold, sage/hero', references: [] },
};

test('composeBrandDNA(spec): brandText folds in tagline, positioning, voice tone, palette, taste_seed', () => {
  const { brandText } = composeBrandDNA({ brand: 'fitcheck', docText: 'some brand docs', techniques: ['gsap'], spec: SPEC });
  assert.match(brandText, /Let every shopper become your product model/, 'tagline (ISC-5)');
  assert.match(brandText, /Done-for-you AI virtual try-on launch service/, 'positioning (ISC-6)');
  assert.match(brandText, /direct, confident, pragmatic/, 'voice tone (ISC-7)');
  assert.match(brandText, /#FF6B35/, 'palette hex (ISC-8)');
  assert.match(brandText, /bold, sage\/hero/, 'taste_seed (ISC-9)');
});

test('composeBrandDNA(spec): rules.tone from voice_tokens, rules.palette from visual_tokens', () => {
  const { rules } = composeBrandDNA({ brand: 'fitcheck', docText: '', techniques: [], spec: SPEC });
  assert.equal(rules.tone, 'direct, confident, pragmatic', 'rules.tone ← voice_tokens (ISC-10)');
  assert.deepEqual(rules.palette, ['#FF6B35', '#1A1A2E'], 'rules.palette ← visual_tokens (ISC-11)');
});

test('composeBrandDNA(no spec): legacy brandText byte-for-byte + docs-regex tone (backward-compat)', () => {
  const { brandText, rules } = composeBrandDNA({ brand: 'acme', docText: 'a minimal editorial brutalist site', techniques: ['gsap'], spec: null });
  assert.equal(
    brandText,
    'Brand: acme. Aesthetic DNA: a minimal editorial brutalist site. Signature techniques: gsap.',
    'no-spec brandText must match the original format exactly (ISC-2)',
  );
  assert.equal(rules.tone, 'minimal, brutalist, editorial', 'docs-regex tone preserved when no spec (ISC-14)');
  assert.deepEqual(rules.techniques, ['gsap']);
});

test('composeBrandDNA(no spec): no spec-only fields leak into rules (backward-compat)', () => {
  const { rules } = composeBrandDNA({ brand: 'acme', docText: 'minimal', techniques: [], spec: null });
  assert.equal(rules.palette, undefined, 'no palette without a spec (ISC-14)');
});
