// taste-eval.test.mjs — #60: on-brand precision metric for taste-resolve.
// Run: node --test taste-eval.test.mjs
//
// resolveFn is INJECTED (a fake brief generator) — no live NIM/LLM/corpus. Pure measurement.

import { test } from 'node:test';
import assert from 'node:assert';
import { evalTaste } from './taste-eval.mjs';

// A fake resolver keyed by request → a taste brief shaped like taste-resolve.mjs emits.
const BRIEFS = {
  'neon cyberpunk hero': { classification: { aesthetic_category: 'cyberpunk' }, suggested_cluster: 'creative-frontend', exemplars: [] },
  'calm editorial blog': { classification: { aesthetic_category: 'editorial' }, suggested_cluster: 'astro', exemplars: [] },
  'a 3d product spin':   { classification: { aesthetic_category: 'maximal' }, suggested_cluster: 'creative-frontend', exemplars: [] }, // axis miss, cluster will be the expect
  'brutalist portfolio': { classification: { aesthetic_category: 'minimal' }, suggested_cluster: 'frontend-web', exemplars: [] }, // total miss
};
const resolveFn = async (request) => BRIEFS[request] ?? { classification: {}, suggested_cluster: null, exemplars: [] };

test('precision is computed correctly over a mix of hits and misses', async () => {
  const cases = [
    { request: 'neon cyberpunk hero', expect: 'cyberpunk' },        // axis hit
    { request: 'calm editorial blog', expect: 'editorial' },        // axis hit
    { request: 'a 3d product spin',   expect: 'creative-frontend' },// cluster hit (axis is 'maximal')
    { request: 'brutalist portfolio', expect: 'brutalist' },        // miss (axis 'minimal', cluster 'frontend-web')
  ];
  const res = await evalTaste(cases, resolveFn);
  assert.equal(res.n, 4, 'n equals the number of cases');
  assert.equal(res.precision, 0.75, '3 of 4 hit → 0.75');
});

test('a hit fires when classification[axis] matches expect', async () => {
  const res = await evalTaste([{ request: 'neon cyberpunk hero', expect: 'cyberpunk' }], resolveFn);
  assert.equal(res.perCase[0].hit, true);
  assert.equal(res.perCase[0].got, 'cyberpunk', 'got records the axis value');
});

test('a hit also fires when suggested_cluster matches expect (axis missed)', async () => {
  const res = await evalTaste([{ request: 'a 3d product spin', expect: 'creative-frontend' }], resolveFn);
  assert.equal(res.perCase[0].hit, true, 'cluster match counts as a hit');
});

test('a miss is recorded when neither axis nor cluster matches', async () => {
  const res = await evalTaste([{ request: 'brutalist portfolio', expect: 'brutalist' }], resolveFn);
  assert.equal(res.perCase[0].hit, false);
  assert.equal(res.precision, 0);
});

test('perCase records request, expect, got and hit for every case', async () => {
  const cases = [
    { request: 'neon cyberpunk hero', expect: 'cyberpunk' },
    { request: 'brutalist portfolio', expect: 'brutalist' },
  ];
  const res = await evalTaste(cases, resolveFn);
  assert.equal(res.perCase.length, 2);
  assert.deepEqual(res.perCase[0], { request: 'neon cyberpunk hero', expect: 'cyberpunk', got: 'cyberpunk', hit: true });
  assert.equal(res.perCase[1].request, 'brutalist portfolio');
  assert.equal(res.perCase[1].expect, 'brutalist');
  assert.equal(res.perCase[1].got, 'minimal', 'got is the resolved axis value even on a miss');
  assert.equal(res.perCase[1].hit, false);
});

test('the axis option selects which classification key is compared', async () => {
  const moodResolver = async () => ({ classification: { aesthetic_category: 'x', mood: 'serene' }, suggested_cluster: null });
  const res = await evalTaste([{ request: 'any', expect: 'serene' }], moodResolver, { axis: 'mood' });
  assert.equal(res.perCase[0].hit, true, 'compares the mood axis, not the default');
  assert.equal(res.perCase[0].got, 'serene');
});

test('axis defaults to aesthetic_category', async () => {
  const res = await evalTaste([{ request: 'calm editorial blog', expect: 'editorial' }], resolveFn);
  assert.equal(res.perCase[0].got, 'editorial', 'default axis read the aesthetic_category');
});

test('resolveFn is invoked once per case (injected, no live calls)', async () => {
  let calls = 0;
  const counting = async (request) => { calls++; return BRIEFS[request] ?? { classification: {}, suggested_cluster: null }; };
  await evalTaste([{ request: 'neon cyberpunk hero', expect: 'cyberpunk' }, { request: 'calm editorial blog', expect: 'editorial' }], counting);
  assert.equal(calls, 2, 'one resolveFn call per case');
});

test('empty cases → precision 0 (no division by zero) and n 0', async () => {
  const res = await evalTaste([], resolveFn);
  assert.equal(res.n, 0);
  assert.equal(res.precision, 0);
  assert.deepEqual(res.perCase, []);
});
