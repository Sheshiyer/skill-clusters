// reroll.test.mjs — RED-first contract for the auto-reroll closed loop (lib/reroll.mjs).
//
// rerollImages is the brandmint wing's quality gate made autonomous: for each planned image
// descriptor it GENERATES, SCORES, and — if the score is below threshold — REGENERATES (rerolls) up
// to maxAttempts, keeping the best-scoring attempt and stopping the moment a render clears threshold.
// It is PURE except via the injected generateImage / scoreImage / log, so every behaviour below is
// proven with FAKES — nothing shells out to gpt-image-2, nothing reads a PNG, nothing touches disk.
//
//   rerollImages({ descriptors, generateImage, scoreImage, scoreOf, threshold, maxAttempts, log })
//     -> [ { name, file, out, attempts, bestScore, onBrand, ok } ]   (one per descriptor)
//
// Fakes:
//   genFake()      -> a generateImage that returns {ok:true,out} and records every call's args.
//   scoreQueue(m)  -> a scoreImage driven by a per-out queue of scripted scores; returns a fresh
//                     score OBJECT each call so scoreOf's default (.coverage) is exercised honestly.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rerollImages } from './reroll.mjs';

// A generateImage fake: always succeeds, echoes out, records calls for assertion.
function genFake() {
  const calls = [];
  const generateImage = (arg) => {
    calls.push(arg);
    return { ok: true, out: arg.out };
  };
  return { generateImage, calls };
}

// A scoreImage fake driven by a map of out-path -> array of numeric coverage scores (consumed in
// order). Each call returns { coverage } so the default scoreOf reads the right field.
function scoreQueue(scoresByOut) {
  const q = {};
  for (const [k, v] of Object.entries(scoresByOut)) q[k] = [...v];
  return (out) => {
    const arr = q[out];
    assert.ok(arr && arr.length, `scoreImage called more times than scripted for ${out}`);
    return { coverage: arr.shift() };
  };
}

const D = (over = {}) => ({ name: 'brand-board', file: 'images/brand-board.png', prompt: 'p', refs: [], ...over });

// ── shape ──────────────────────────────────────────────────────────────────────────────────────

test('rerollImages: returns one result per descriptor', () => {
  const d1 = D({ name: 'a', file: 'images/a.png', out: 'images/a.png' });
  const d2 = D({ name: 'b', file: 'images/b.png', out: 'images/b.png' });
  const { generateImage } = genFake();
  const results = rerollImages({
    descriptors: [d1, d2],
    generateImage,
    scoreImage: scoreQueue({ 'images/a.png': [0.5], 'images/b.png': [0.5] }),
    threshold: 0.12,
  });
  assert.equal(results.length, 2);
});

test('rerollImages: each result carries name, file, out, attempts, bestScore, onBrand, ok', () => {
  const { generateImage } = genFake();
  const [r] = rerollImages({
    descriptors: [D({ out: 'images/brand-board.png' })],
    generateImage,
    scoreImage: scoreQueue({ 'images/brand-board.png': [0.9] }),
    threshold: 0.12,
  });
  for (const k of ['name', 'file', 'out', 'attempts', 'bestScore', 'onBrand', 'ok']) {
    assert.ok(k in r, `result missing key ${k}`);
  }
});

test('rerollImages: out defaults to descriptor.out when present', () => {
  const { generateImage, calls } = genFake();
  const [r] = rerollImages({
    descriptors: [D({ file: 'images/f.png', out: 'render/explicit.png' })],
    generateImage,
    scoreImage: scoreQueue({ 'render/explicit.png': [0.9] }),
    threshold: 0.12,
  });
  assert.equal(r.out, 'render/explicit.png');
  assert.equal(calls[0].out, 'render/explicit.png');
});

test('rerollImages: out falls back to descriptor.file when descriptor.out absent', () => {
  const { generateImage, calls } = genFake();
  const [r] = rerollImages({
    descriptors: [D({ file: 'images/fallback.png' })], // no .out
    generateImage,
    scoreImage: scoreQueue({ 'images/fallback.png': [0.9] }),
    threshold: 0.12,
  });
  assert.equal(r.out, 'images/fallback.png');
  assert.equal(calls[0].out, 'images/fallback.png');
});

// ── scoreOf default ──────────────────────────────────────────────────────────────────────────────

test('rerollImages: default scoreOf reads the score object coverage field', () => {
  // coverage is BELOW threshold, accentPresence is ABOVE — if the default read the wrong field it
  // would pass on attempt 1. Correct behaviour: coverage 0.05 < 0.12 → it rerolls.
  const { generateImage, calls } = genFake();
  const out = 'images/brand-board.png';
  const scoreImage = () => ({ coverage: 0.05, accentPresence: 0.99 });
  const [r] = rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage,
    threshold: 0.12,
    maxAttempts: 2,
  });
  assert.equal(r.attempts, 2, 'should reroll because coverage (not accentPresence) is below threshold');
  assert.equal(r.onBrand, false);
  assert.equal(calls.length, 2);
});

// ── passing-first: exactly one attempt, no reroll ─────────────────────────────────────────────────

test('rerollImages: a first score at/above threshold yields exactly 1 attempt, onBrand true', () => {
  const { generateImage, calls } = genFake();
  const out = 'images/brand-board.png';
  const [r] = rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage: scoreQueue({ [out]: [0.30] }), // would error if asked for a 2nd score
    threshold: 0.12,
    maxAttempts: 2,
  });
  assert.equal(r.attempts, 1);
  assert.equal(r.onBrand, true);
  assert.equal(r.bestScore, 0.30);
  assert.equal(calls.length, 1, 'generateImage called exactly once — no reroll');
});

test('rerollImages: a score exactly equal to threshold is on-brand (>=, not >)', () => {
  const { generateImage } = genFake();
  const out = 'images/brand-board.png';
  const [r] = rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage: scoreQueue({ [out]: [0.12] }),
    threshold: 0.12,
    maxAttempts: 3,
  });
  assert.equal(r.attempts, 1);
  assert.equal(r.onBrand, true);
});

// ── all-below: exactly maxAttempts, keep the best ─────────────────────────────────────────────────

test('rerollImages: scores below threshold every time run exactly maxAttempts attempts', () => {
  const { generateImage, calls } = genFake();
  const out = 'images/brand-board.png';
  const [r] = rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage: scoreQueue({ [out]: [0.05, 0.09, 0.04] }),
    threshold: 0.12,
    maxAttempts: 3,
  });
  assert.equal(r.attempts, 3);
  assert.equal(calls.length, 3);
});

test('rerollImages: all-below keeps the highest (best) score, not the last', () => {
  const { generateImage } = genFake();
  const out = 'images/brand-board.png';
  const [r] = rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage: scoreQueue({ [out]: [0.05, 0.09, 0.04] }), // non-monotonic; best is the middle one
    threshold: 0.12,
    maxAttempts: 3,
  });
  assert.equal(r.bestScore, 0.09);
  assert.equal(r.onBrand, false);
});

// ── below-then-above: stop at the passing attempt ─────────────────────────────────────────────────

test('rerollImages: below then above stops at the first passing attempt', () => {
  const { generateImage, calls } = genFake();
  const out = 'images/brand-board.png';
  const [r] = rerollImages({
    descriptors: [D({ out })],
    // attempt1 = 0.05 (below), attempt2 = 0.40 (above) → stop. A 3rd score would error if requested.
    scoreImage: scoreQueue({ [out]: [0.05, 0.40] }),
    generateImage,
    threshold: 0.12,
    maxAttempts: 5,
  });
  assert.equal(r.attempts, 2, 'stopped on the passing attempt, did not use all 5');
  assert.equal(r.onBrand, true);
  assert.equal(calls.length, 2);
});

test('rerollImages: below-then-above bestScore equals the passing attempt score', () => {
  const { generateImage } = genFake();
  const out = 'images/brand-board.png';
  const [r] = rerollImages({
    descriptors: [D({ out })],
    scoreImage: scoreQueue({ [out]: [0.05, 0.40] }),
    generateImage,
    threshold: 0.12,
    maxAttempts: 5,
  });
  assert.equal(r.bestScore, 0.40);
});

// ── multiple descriptors processed independently ─────────────────────────────────────────────────

test('rerollImages: processes multiple descriptors independently and in order', () => {
  const { generateImage } = genFake();
  const dPass = D({ name: 'board', file: 'images/board.png', out: 'images/board.png' });
  const dReroll = D({ name: 'logo', file: 'images/logo.png', out: 'images/logo.png' });
  const results = rerollImages({
    descriptors: [dPass, dReroll],
    generateImage,
    scoreImage: scoreQueue({
      'images/board.png': [0.50],         // passes immediately → 1 attempt
      'images/logo.png': [0.05, 0.08],    // never passes → 2 attempts, best 0.08
    }),
    threshold: 0.12,
    maxAttempts: 2,
  });
  assert.equal(results[0].name, 'board');
  assert.equal(results[0].attempts, 1);
  assert.equal(results[0].onBrand, true);
  assert.equal(results[1].name, 'logo');
  assert.equal(results[1].attempts, 2);
  assert.equal(results[1].onBrand, false);
  assert.equal(results[1].bestScore, 0.08);
});

// ── generateImage receives prompt, out, refs ──────────────────────────────────────────────────────

test('rerollImages: calls generateImage with the descriptor prompt, resolved out, and refs', () => {
  const { generateImage, calls } = genFake();
  const out = 'images/brand-board.png';
  const refs = ['ref/a.png', 'ref/b.png'];
  rerollImages({
    descriptors: [D({ out, prompt: 'on-brand board', refs })],
    generateImage,
    scoreImage: scoreQueue({ [out]: [0.9] }),
    threshold: 0.12,
  });
  assert.equal(calls[0].prompt, 'on-brand board');
  assert.equal(calls[0].out, out);
  assert.deepEqual(calls[0].refs, refs);
});

// ── custom scoreOf metric ────────────────────────────────────────────────────────────────────────

test('rerollImages: honours a custom scoreOf (e.g. accentPresence metric)', () => {
  const { generateImage } = genFake();
  const out = 'images/brand-board.png';
  // coverage is high but accentPresence is low — with scoreOf=accentPresence it must reroll.
  const scoreImage = () => ({ coverage: 0.99, accentPresence: 0.03 });
  const [r] = rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage,
    scoreOf: (s) => s.accentPresence,
    threshold: 0.12,
    maxAttempts: 2,
  });
  assert.equal(r.attempts, 2);
  assert.equal(r.onBrand, false);
  assert.equal(r.bestScore, 0.03);
});

// ── log is optional and invoked ──────────────────────────────────────────────────────────────────

test('rerollImages: invokes the injected log without requiring it', () => {
  const { generateImage } = genFake();
  const out = 'images/brand-board.png';
  // No log passed → must not throw (default is a no-op).
  assert.doesNotThrow(() =>
    rerollImages({
      descriptors: [D({ out })],
      generateImage,
      scoreImage: scoreQueue({ [out]: [0.9] }),
      threshold: 0.12,
    }),
  );
  // With a log passed → it gets called at least once.
  const lines = [];
  rerollImages({
    descriptors: [D({ out })],
    generateImage,
    scoreImage: scoreQueue({ [out]: [0.9] }),
    threshold: 0.12,
    log: (m) => lines.push(m),
  });
  assert.ok(lines.length >= 1, 'log should be invoked');
});
