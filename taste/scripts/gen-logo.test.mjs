// gen-logo.test.mjs — genLogo: a canonical brand-spec → a deterministic SVG logo system.
// Run: node --test taste/scripts/gen-logo.test.mjs
//
// genLogo is the PURE, AI-free, network-free core (brand-spec in → {markSvg, logoSvg, logoDarkSvg}
// strings out), so it's unit-testable here like the wing's other pure cores (composeBrandDNA,
// emitBrandSpec). The file-writing CLI lives behind the isMain() guard and is not exercised here.

import { test } from 'node:test';
import assert from 'node:assert';
import { genLogo } from './gen-logo.mjs';

// A minimal but representative canonical brand-spec (HDILINT/Fitcheck shape):
// palette[0] = accent, palette[1] = dark.
const SPEC = {
  brand: 'fitcheck',
  identity: { name: 'Fitcheck', tagline: 'Let every shopper become your product model' },
  positioning: { category: 'technology', differentiation: 'done-for-you VTO' },
  voice_tokens: { tone: ['direct', 'confident'] },
  visual_tokens: {
    palette: ['#FF6B35', '#1A1A2E', '#16213E'],
    type: { heading: 'bold sans-serif', body: 'clean sans-serif' },
  },
  taste_seed: { aesthetic: 'bold, sage/hero' },
};

test('genLogo returns three non-empty SVG strings', () => {
  const out = genLogo(SPEC);
  for (const key of ['markSvg', 'logoSvg', 'logoDarkSvg']) {
    assert.equal(typeof out[key], 'string', `${key} is a string (ISC-2)`);
    assert.ok(out[key].length > 0, `${key} is non-empty (ISC-3)`);
    assert.match(out[key], /^<svg\b/, `${key} starts with <svg (ISC-3)`);
    assert.match(out[key], /<\/svg>\s*$/, `${key} is a closed SVG (ISC-3)`);
  }
});

test('markSvg: 64x64 monogram with both palette colors', () => {
  const { markSvg } = genLogo(SPEC);
  assert.match(markSvg, /viewBox="0 0 64 64"/, 'mark is a 64x64 favicon square (ISC-4)');
  assert.match(markSvg, />F</, 'mark carries the brand initial F (ISC-5)');
  assert.match(markSvg, /#FF6B35/, 'mark uses palette[0] accent (ISC-6)');
  assert.match(markSvg, /#1A1A2E/, 'mark uses palette[1] dark (ISC-6)');
});

test('logoSvg (light lockup): brand name + accent hex, wordmark filled palette[1]', () => {
  const { logoSvg } = genLogo(SPEC);
  assert.match(logoSvg, /Fitcheck/, 'wordmark carries the brand name (ISC-7)');
  assert.match(logoSvg, /#FF6B35/, 'light lockup carries palette[0] accent (ISC-8)');
  // the wordmark text is dark (palette[1]) on a light bg
  assert.match(logoSvg, /fill="#1A1A2E"[^>]*>Fitcheck/, 'wordmark fill is palette[1] dark (ISC-9)');
});

test('logoDarkSvg (dark lockup): brand name + accent hex, wordmark near-white', () => {
  const { logoDarkSvg } = genLogo(SPEC);
  assert.match(logoDarkSvg, /Fitcheck/, 'dark wordmark carries the brand name (ISC-10)');
  assert.match(logoDarkSvg, /#FF6B35/, 'dark lockup carries palette[0] accent (ISC-11)');
  // wordmark is near-white on a dark bg, NOT the dark palette color
  assert.doesNotMatch(logoDarkSvg, /fill="#1A1A2E"[^>]*>Fitcheck/, 'dark wordmark is not dark-on-dark (ISC-11)');
});

test('genLogo is pure: same input → byte-identical output', () => {
  const a = genLogo(SPEC);
  const b = genLogo(SPEC);
  assert.deepEqual(a, b, 'deterministic — same input yields same output (ISC-12)');
});

test('genLogo does not mutate the input brandSpec', () => {
  const before = JSON.stringify(SPEC);
  genLogo(SPEC);
  assert.equal(JSON.stringify(SPEC), before, 'input spec is untouched (ISC-13)');
});

test('XML-special chars in the brand name are escaped', () => {
  const spec = { identity: { name: 'M&Co <X>' }, visual_tokens: { palette: ['#FF6B35', '#1A1A2E'] } };
  const { logoSvg, markSvg } = genLogo(spec);
  // the literal name appears entity-encoded, never as raw markup-breaking chars
  assert.match(logoSvg, /M&amp;Co &lt;X&gt;/, 'name is XML-escaped in the wordmark (ISC-14)');
  // no raw ampersand that isn't the start of an entity, anywhere in the output
  for (const svg of [logoSvg, markSvg]) {
    assert.doesNotMatch(svg, /&(?!(amp|lt|gt|quot|apos|#\d+);)/, 'no unescaped & in output (ISC-14)');
  }
});

test('short palette: missing palette[1] falls back, no "undefined" leaks into SVG', () => {
  const spec = { identity: { name: 'Acme' }, visual_tokens: { palette: ['#0A84FF'] } };
  const out = genLogo(spec);
  for (const key of ['markSvg', 'logoSvg', 'logoDarkSvg']) {
    assert.doesNotMatch(out[key], /undefined/, `${key} has no undefined leak (ISC-3)`);
    assert.match(out[key], /#0A84FF/, `${key} still uses the provided accent (ISC-8)`);
  }
});

test('monogram uppercases a lowercase initial', () => {
  const spec = { identity: { name: 'acme' }, visual_tokens: { palette: ['#FF6B35', '#1A1A2E'] } };
  const { markSvg } = genLogo(spec);
  assert.match(markSvg, />A</, 'initial is uppercased for the monogram (ISC-5)');
});
