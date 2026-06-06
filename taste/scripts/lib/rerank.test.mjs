// rerank.test.mjs — #54: second-stage MMR rerank for taste-resolve candidates.
// Diversity matters: the top-K must not be near-duplicates. Run: node --test rerank.test.mjs
//
// Pure logic, no I/O, no network. All vectors are hand-built so the MMR dynamics are observable.

import { test } from 'node:test';
import assert from 'node:assert';
import { rerank } from './rerank.mjs';

// cosine, local — to assert relevance ordering independently of the module's internals
const dot = (a, b) => { let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * b[i]; return s; };
const cos = (a, b) => dot(a, b) / ((Math.sqrt(dot(a, a)) || 1) * (Math.sqrt(dot(b, b)) || 1));

// Fixture: query points along x. Three near-identical candidates cluster tightly around the query
// direction (high relevance, but near-duplicates of each other). One DISTINCT candidate points mostly
// along y — lower query relevance (so pure-relevance ranks it LAST), but orthogonal to the cluster.
const queryVec = [1, 0];
const dupA = { id: 'dupA', embedding: [1.0, 0.02] };
const dupB = { id: 'dupB', embedding: [1.0, 0.04] };
const dupC = { id: 'dupC', embedding: [1.0, 0.06] };
// Distinct: clearly LOWER query relevance than the cluster (cos≈0.80 vs ≈1.0 → pure-relevance ranks it
// last) yet pointing off the cluster's axis, so MMR's diversity term lifts it once a dup is picked.
const distinct = { id: 'distinct', embedding: [0.8, 0.6] };
const CANDS = [dupA, dupB, dupC, distinct];

test('pure-relevance order ranks the distinct (off-axis) candidate LAST', () => {
  // sanity on the fixture: by raw cosine the three dups outrank the distinct one
  const byRel = [...CANDS].sort((a, b) => cos(queryVec, b.embedding) - cos(queryVec, a.embedding));
  assert.equal(byRel[byRel.length - 1].id, 'distinct', 'distinct has the lowest query relevance');
});

test('MMR with low lambda surfaces the distinct candidate earlier than pure-relevance order', () => {
  // low lambda (0.3) weights diversity heavily; after the first (most-relevant) dup is picked, the
  // near-duplicate dups are penalized for similarity to it (sim≈1.0), so the off-axis distinct one
  // jumps the queue — landing right behind the single most-relevant item.
  const out = rerank(CANDS, { queryVec, lambda: 0.3, k: 4 });
  const ids = out.map((c) => c.id);
  const distinctPos = ids.indexOf('distinct');
  // in pure-relevance order distinct is LAST (index 3); MMR must lift it ahead of at least one dup
  assert.ok(distinctPos < 3, `distinct surfaced at ${distinctPos}, earlier than pure-relevance last (3)`);
  // and it should NOT be first — a single high-relevance candidate still seeds the list
  assert.notEqual(distinctPos, 0, 'the single most-relevant candidate still leads');
});

test('high lambda (~pure relevance) keeps the distinct candidate last', () => {
  const out = rerank(CANDS, { queryVec, lambda: 0.95, k: 4 });
  const ids = out.map((c) => c.id);
  assert.equal(ids[ids.length - 1], 'distinct', 'with diversity de-weighted, order tracks relevance');
});

test('first pick is always the maximum-relevance candidate', () => {
  const out = rerank(CANDS, { queryVec, lambda: 0.3, k: 4 });
  // the first pick has an empty "already-picked" set, so its diversity penalty is 0 → pure argmax rel.
  const top = [...CANDS].sort((a, b) => cos(queryVec, b.embedding) - cos(queryVec, a.embedding))[0];
  assert.equal(out[0].id, top.id, 'MMR seeds with the single most relevant item');
});

test('k limits the number of returned candidates', () => {
  const out = rerank(CANDS, { queryVec, lambda: 0.7, k: 2 });
  assert.equal(out.length, 2, 'output is capped at k');
});

test('k larger than the pool returns all candidates, no padding', () => {
  const out = rerank(CANDS, { queryVec, lambda: 0.7, k: 99 });
  assert.equal(out.length, CANDS.length);
});

test('defaults: lambda 0.7 and k 5 when omitted', () => {
  const many = [
    { id: 'a', embedding: [1, 0] }, { id: 'b', embedding: [0.9, 0.1] },
    { id: 'c', embedding: [0.8, 0.2] }, { id: 'd', embedding: [0.7, 0.3] },
    { id: 'e', embedding: [0.6, 0.4] }, { id: 'f', embedding: [0.5, 0.5] },
  ];
  const out = rerank(many, { queryVec });
  assert.equal(out.length, 5, 'default k is 5');
});

test('a brandVec biases relevance toward brand-aligned candidates', () => {
  // two equally query-relevant candidates; the brand points at one of them → it should rank first.
  const cands = [
    { id: 'plain', embedding: [1, 0, 0] },
    { id: 'onbrand', embedding: [1, 0, 0.0001] },
  ];
  const q = [1, 0, 0];
  const brandVec = [0, 0, 1]; // strongly favors whichever candidate has a z-component
  const out = rerank(cands, { queryVec: q, brandVec, lambda: 0.7, k: 2 });
  assert.equal(out[0].id, 'onbrand', 'brand bias breaks the tie toward the on-brand candidate');
});

test('cosine guards zero-norm vectors (no NaN in the output ordering)', () => {
  const cands = [
    { id: 'zero', embedding: [0, 0] },
    { id: 'real', embedding: [1, 0] },
  ];
  const out = rerank(cands, { queryVec: [1, 0], lambda: 0.7, k: 2 });
  assert.equal(out.length, 2);
  assert.ok(out.every((c) => typeof c.id === 'string'), 'no crash / NaN sort with a zero vector');
});

test('rerank is pure — does not mutate the input array or its items', () => {
  const snapshot = JSON.parse(JSON.stringify(CANDS));
  const before = [...CANDS];
  rerank(CANDS, { queryVec, lambda: 0.5, k: 2 });
  assert.deepEqual(CANDS, snapshot, 'input items unchanged');
  assert.deepEqual(CANDS, before, 'input array order unchanged');
});
