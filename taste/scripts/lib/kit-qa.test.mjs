// kit-qa.test.mjs — the on-brand raster scorer: does a decoded PNG actually use the brand palette?
// Run: node --test taste/scripts/lib/kit-qa.test.mjs
//
// Two pure functions under test, no I/O:
//   hexToRgb('#RRGGBB' | 'RRGGBB') -> [r,g,b]
//   scorePalette(pixels, palette, opts) -> { coverage, accentPresence, perColor, sampled }
//
// We never decode a real PNG here — we hand-build flat RGB Uint8Arrays whose coverage is exactly
// known (all-accent → 1, all-off-palette → 0, half/half → 0.5), so the scoring math is pinned down
// independent of the decoder. The decoder has its own test file.

import { test } from 'node:test';
import assert from 'node:assert';

import { hexToRgb, scorePalette } from './kit-qa.mjs';

// --- helpers ---------------------------------------------------------------------------------------

// Build a flat RGB Uint8Array of `n` pixels all set to [r,g,b].
function solid(n, [r, g, b]) {
  const px = new Uint8Array(n * 3);
  for (let i = 0; i < n; i++) {
    px[i * 3] = r; px[i * 3 + 1] = g; px[i * 3 + 2] = b;
  }
  return px;
}

// Concatenate two pixel arrays.
function concatPx(a, b) {
  const out = new Uint8Array(a.length + b.length);
  out.set(a, 0); out.set(b, a.length);
  return out;
}

const ACCENT = '#FF6B35';
const DARK = '#1A1A2E';
const NAVY = '#16213E';
const OFF = '#00FF00'; // far from every palette color (distance to accent ≈ 300 ≫ tolerance 48)
const PALETTE = [ACCENT, DARK, NAVY];

// --- hexToRgb --------------------------------------------------------------------------------------

test('hexToRgb parses #RRGGBB', () => {
  assert.deepEqual(hexToRgb('#FF6B35'), [255, 107, 53]);
});

test('hexToRgb parses bare RRGGBB without the hash', () => {
  assert.deepEqual(hexToRgb('1A1A2E'), [26, 26, 46]);
});

test('hexToRgb returns integers in 0..255', () => {
  const [r, g, b] = hexToRgb('#00FF00');
  assert.deepEqual([r, g, b], [0, 255, 0]);
  for (const c of [r, g, b]) {
    assert.ok(Number.isInteger(c) && c >= 0 && c <= 255);
  }
});

test('hexToRgb is case-insensitive', () => {
  assert.deepEqual(hexToRgb('#ff6b35'), hexToRgb('#FF6B35'));
});

// --- scorePalette: shape ---------------------------------------------------------------------------

test('scorePalette returns { coverage, accentPresence, perColor, sampled }', () => {
  const px = solid(4, hexToRgb(ACCENT));
  const r = scorePalette(px, PALETTE, { stride: 1 });
  assert.ok('coverage' in r && 'accentPresence' in r && 'perColor' in r && 'sampled' in r);
  assert.equal(typeof r.coverage, 'number');
  assert.equal(typeof r.accentPresence, 'number');
  assert.equal(typeof r.sampled, 'number');
  assert.equal(typeof r.perColor, 'object');
});

// --- scorePalette: all-accent ----------------------------------------------------------------------

test('all-accent pixels → coverage ~1', () => {
  const px = solid(100, hexToRgb(ACCENT));
  const r = scorePalette(px, PALETTE, { stride: 1 });
  assert.ok(Math.abs(r.coverage - 1) < 1e-9, `coverage was ${r.coverage}`);
});

test('all-accent pixels → accentPresence ~1 (palette[0])', () => {
  const px = solid(100, hexToRgb(ACCENT));
  const r = scorePalette(px, PALETTE, { stride: 1 });
  assert.ok(Math.abs(r.accentPresence - 1) < 1e-9, `accentPresence was ${r.accentPresence}`);
});

// --- scorePalette: all off-palette -----------------------------------------------------------------

test('all off-palette pixels → coverage ~0', () => {
  const px = solid(100, hexToRgb(OFF));
  const r = scorePalette(px, PALETTE, { stride: 1 });
  assert.ok(Math.abs(r.coverage - 0) < 1e-9, `coverage was ${r.coverage}`);
});

test('all off-palette pixels → accentPresence ~0', () => {
  const px = solid(100, hexToRgb(OFF));
  const r = scorePalette(px, PALETTE, { stride: 1 });
  assert.ok(Math.abs(r.accentPresence - 0) < 1e-9, `accentPresence was ${r.accentPresence}`);
});

// --- scorePalette: half/half -----------------------------------------------------------------------

test('half-accent / half-off-palette → coverage ~0.5', () => {
  const half = concatPx(solid(50, hexToRgb(ACCENT)), solid(50, hexToRgb(OFF)));
  const r = scorePalette(half, PALETTE, { stride: 1 });
  assert.ok(Math.abs(r.coverage - 0.5) < 1e-9, `coverage was ${r.coverage}`);
  assert.ok(Math.abs(r.accentPresence - 0.5) < 1e-9, `accentPresence was ${r.accentPresence}`);
});

// --- scorePalette: perColor keyed by ORIGINAL hex strings ------------------------------------------

test('perColor is keyed by each original palette hex with its fraction', () => {
  // 50 accent + 50 dark → accent fraction 0.5, dark fraction 0.5, navy fraction 0.
  const px = concatPx(solid(50, hexToRgb(ACCENT)), solid(50, hexToRgb(DARK)));
  const r = scorePalette(px, PALETTE, { stride: 1 });
  assert.ok(ACCENT in r.perColor && DARK in r.perColor && NAVY in r.perColor);
  assert.ok(Math.abs(r.perColor[ACCENT] - 0.5) < 1e-9, `accent ${r.perColor[ACCENT]}`);
  assert.ok(Math.abs(r.perColor[DARK] - 0.5) < 1e-9, `dark ${r.perColor[DARK]}`);
  assert.ok(Math.abs(r.perColor[NAVY] - 0) < 1e-9, `navy ${r.perColor[NAVY]}`);
});

// --- scorePalette: sampling ------------------------------------------------------------------------

test('sampled reflects an explicit stride', () => {
  const px = solid(100, hexToRgb(ACCENT));
  const r = scorePalette(px, PALETTE, { stride: 10 });
  assert.equal(r.sampled, 10, `sampled was ${r.sampled}`); // every 10th of 100 px = 10 samples
});

test('auto-stride samples at least 1 pixel on a tiny image', () => {
  const px = solid(4, hexToRgb(ACCENT)); // 2x2 worth of pixels, no stride given
  const r = scorePalette(px, PALETTE);
  assert.ok(r.sampled >= 1, `sampled was ${r.sampled}`);
  assert.ok(Math.abs(r.coverage - 1) < 1e-9);
});

test('tolerance opt widens what counts as on-palette', () => {
  // A color 40 away from accent in one channel: off at tolerance 10, on at tolerance 48 (default).
  const nearAccent = [255 - 40, 107, 53];
  const px = solid(10, nearAccent);
  const tight = scorePalette(px, PALETTE, { stride: 1, tolerance: 10 });
  const loose = scorePalette(px, PALETTE, { stride: 1, tolerance: 48 });
  assert.ok(Math.abs(tight.coverage - 0) < 1e-9, `tight ${tight.coverage}`);
  assert.ok(Math.abs(loose.coverage - 1) < 1e-9, `loose ${loose.coverage}`);
});
