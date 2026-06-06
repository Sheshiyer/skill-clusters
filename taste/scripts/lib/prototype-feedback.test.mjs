// prototype-feedback.test.mjs — #57: the PURE feedback loop (usage → sharpen the brand prototype).
// Run: node --test prototype-feedback.test.mjs
//
// Complements taste-feedback.mjs (the side-effecting CLI). This is the math core: no I/O, no mutation.

import { test } from 'node:test';
import assert from 'node:assert';
import { updatePrototype, applyFeedbackLog } from './prototype-feedback.mjs';

const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const norm = (a) => Math.sqrt(dot(a, a)) || 1;
const cos = (a, b) => dot(a, b) / (norm(a) * norm(b));
const centroid = (vs) => vs[0].map((_, i) => vs.reduce((s, v) => s + v[i], 0) / vs.length);
const isUnit = (v) => Math.abs(norm(v) - 1) < 1e-9;

test('chosen pulls the prototype TOWARD them (cosine to chosen-mean increases)', () => {
  const proto = [1, 0, 0];
  const chosen = [[0, 1, 0], [0, 1, 0.2]]; // a direction the prototype is currently far from
  const mean = centroid(chosen);
  const before = cos(proto, mean);
  const next = updatePrototype(proto, { chosen, rate: 0.3 });
  const after = cos(next, mean);
  assert.ok(after > before, `cosine to chosen-mean rose ${before.toFixed(3)} → ${after.toFixed(3)}`);
});

test('rejected pushes the prototype AWAY from them (cosine to rejected-mean decreases)', () => {
  const proto = [1, 1, 0];
  const rejected = [[1, 0, 0]];
  const mean = centroid(rejected);
  const before = cos(proto, mean);
  const next = updatePrototype(proto, { rejected, rate: 0.3 });
  const after = cos(next, mean);
  assert.ok(after < before, `cosine to rejected-mean fell ${before.toFixed(3)} → ${after.toFixed(3)}`);
});

test('a larger rate moves the prototype further toward chosen', () => {
  const proto = [1, 0, 0];
  const chosen = [[0, 1, 0]];
  const mean = centroid(chosen);
  const small = cos(updatePrototype(proto, { chosen, rate: 0.1 }), mean);
  const big = cos(updatePrototype(proto, { chosen, rate: 0.5 }), mean);
  assert.ok(big > small, 'higher rate → closer to the chosen direction');
});

test('empty chosen and rejected returns the prototype unchanged but normalized', () => {
  const proto = [3, 4, 0]; // norm 5, not unit
  const next = updatePrototype(proto, {});
  assert.ok(isUnit(next), 'output is normalized');
  // direction preserved: parallel to the original
  assert.ok(Math.abs(cos(next, proto) - 1) < 1e-9, 'same direction as the input prototype');
});

test('the returned prototype is always L2-normalized (unit length)', () => {
  const next = updatePrototype([2, 0, 0], { chosen: [[0, 5, 0]], rejected: [[0, 0, 3]], rate: 0.2 });
  assert.ok(isUnit(next), `expected unit length, got norm ${norm(next)}`);
});

test('updatePrototype does not mutate the input prototype array', () => {
  const proto = [1, 2, 3];
  const snap = [...proto];
  updatePrototype(proto, { chosen: [[0, 1, 0]], rate: 0.4 });
  assert.deepEqual(proto, snap, 'input prototype untouched');
});

test('updatePrototype does not mutate the chosen/rejected embeddings', () => {
  const chosen = [[0, 1, 0]];
  const rejected = [[1, 0, 0]];
  const cSnap = JSON.parse(JSON.stringify(chosen));
  const rSnap = JSON.parse(JSON.stringify(rejected));
  updatePrototype([1, 1, 1], { chosen, rejected, rate: 0.3 });
  assert.deepEqual(chosen, cSnap, 'chosen embeddings untouched');
  assert.deepEqual(rejected, rSnap, 'rejected embeddings untouched');
});

test('applyFeedbackLog folds a list of events, each sharpening the prototype', () => {
  const proto = [1, 0, 0];
  const target = [0, 1, 0];
  const events = [
    { chosen: [target] },
    { chosen: [target] },
    { chosen: [target] },
  ];
  const folded = applyFeedbackLog(proto, events, { rate: 0.3 });
  // three pulls toward `target` should land closer than a single pull
  const one = updatePrototype(proto, { chosen: [target], rate: 0.3 });
  assert.ok(cos(folded, target) > cos(one, target), 'folding multiple events compounds the pull');
  assert.ok(isUnit(folded), 'folded result is unit length');
});

test('applyFeedbackLog is pure — input prototype and events untouched', () => {
  const proto = [1, 0, 0];
  const events = [{ chosen: [[0, 1, 0]] }, { rejected: [[1, 0, 0]] }];
  const pSnap = [...proto];
  const eSnap = JSON.parse(JSON.stringify(events));
  applyFeedbackLog(proto, events, { rate: 0.2 });
  assert.deepEqual(proto, pSnap, 'prototype untouched');
  assert.deepEqual(events, eSnap, 'events untouched');
});

test('applyFeedbackLog with no events returns the normalized prototype', () => {
  const next = applyFeedbackLog([3, 4, 0], [], { rate: 0.2 });
  assert.ok(isUnit(next), 'empty log still normalizes');
});
