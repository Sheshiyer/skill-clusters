// design-memory.test.mjs — the per-brand visual-DNA store (the local precursor to noesis #24).
// Run: node --test taste/scripts/lib/design-memory.test.mjs
//
// A brand's design memory is a bag of 1024-dim vectors namespaced by brand. query() ranks by
// cosine WITHIN that brand. Brands are isolated; an empty brand returns []. The store is injectable.

import { test } from 'node:test';
import assert from 'node:assert';

import { makeDesignMemory } from './design-memory.mjs';

// --- helpers ---------------------------------------------------------------------------------------

// A tiny 4-dim unit-ish vector so the cosine ordering is hand-checkable (dim is documentary; cosine
// works at any equal length — the real corpus is 1024-dim).
const v = (...xs) => xs;

// --- add + query ranking ---------------------------------------------------------------------------

test('query returns the added vectors ranked by cosine descending', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0), { label: 'a' });
  m.add('x', 'b', v(0, 1, 0, 0), { label: 'b' });
  m.add('x', 'c', v(0.9, 0.1, 0, 0), { label: 'c' }); // closest to the query below

  const out = m.query('x', v(1, 0, 0, 0), 3);
  assert.equal(out.length, 3);
  // 'a' is identical (cos 1), 'c' is near, 'b' is orthogonal (cos 0) → a, c, b
  assert.deepEqual(out.map((r) => r.id), ['a', 'c', 'b']);
  // scores are sorted descending
  assert.ok(out[0].score >= out[1].score && out[1].score >= out[2].score);
});

test('query result items have shape { id, score, meta }', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0), { label: 'hello' });
  const [top] = m.query('x', v(1, 0, 0, 0), 1);
  assert.equal(top.id, 'a');
  assert.equal(typeof top.score, 'number');
  assert.deepEqual(top.meta, { label: 'hello' });
});

test('query respects k (top-k only)', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0));
  m.add('x', 'b', v(0.9, 0.1, 0, 0));
  m.add('x', 'c', v(0, 1, 0, 0));
  const out = m.query('x', v(1, 0, 0, 0), 2);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((r) => r.id), ['a', 'b']);
});

test('query default k is 5', () => {
  const m = makeDesignMemory();
  for (let i = 0; i < 8; i++) m.add('x', `id${i}`, v(1, 0, 0, 0));
  const out = m.query('x', v(1, 0, 0, 0)); // no k arg
  assert.equal(out.length, 5);
});

test('query with k greater than the stored count returns all rows, no holes', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0));
  m.add('x', 'b', v(0, 1, 0, 0));
  const out = m.query('x', v(1, 0, 0, 0), 99);
  assert.equal(out.length, 2);
  assert.ok(out.every((r) => r && typeof r.id === 'string'));
});

// --- brand isolation -------------------------------------------------------------------------------

test('a different brand is isolated from brand x', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0));
  m.add('y', 'b', v(1, 0, 0, 0));
  const xs = m.query('x', v(1, 0, 0, 0), 10);
  assert.deepEqual(xs.map((r) => r.id), ['a']); // y's 'b' must not leak into x
  const ys = m.query('y', v(1, 0, 0, 0), 10);
  assert.deepEqual(ys.map((r) => r.id), ['b']);
});

test('all(brand) returns that brand rows and is brand-scoped', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0));
  m.add('x', 'b', v(0, 1, 0, 0));
  m.add('y', 'c', v(0, 0, 1, 0));
  assert.equal(m.all('x').length, 2);
  assert.equal(m.all('y').length, 1);
});

// --- empty / unknown brand -------------------------------------------------------------------------

test('query of an empty/unknown brand returns []', () => {
  const m = makeDesignMemory();
  assert.deepEqual(m.query('nobody', v(1, 0, 0, 0), 5), []);
});

test('all of an unknown brand returns []', () => {
  const m = makeDesignMemory();
  assert.deepEqual(m.all('nobody'), []);
});

// --- cosine purity / edge cases --------------------------------------------------------------------

test('a zero-magnitude vector yields score 0, not NaN', () => {
  const m = makeDesignMemory();
  m.add('x', 'zero', v(0, 0, 0, 0));
  const [r] = m.query('x', v(1, 0, 0, 0), 1);
  assert.equal(r.score, 0);
  assert.ok(!Number.isNaN(r.score));
});

test('a zero query vector yields score 0 for everything', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0));
  const [r] = m.query('x', v(0, 0, 0, 0), 1);
  assert.equal(r.score, 0);
});

// --- injectable store ------------------------------------------------------------------------------

test('store is injectable: a custom { get, set } seam is honored', () => {
  // a Map-backed seam that records writes, proving the default Map is not used
  const backing = new Map();
  let sets = 0;
  const store = {
    get: (brand) => backing.get(brand) || [],
    set: (brand, rows) => { sets++; backing.set(brand, rows); },
  };
  const m = makeDesignMemory({ store });
  m.add('x', 'a', v(1, 0, 0, 0));
  assert.ok(sets >= 1, 'custom store.set was called');
  assert.equal(backing.get('x').length, 1);
  const [top] = m.query('x', v(1, 0, 0, 0), 1);
  assert.equal(top.id, 'a');
});

test('default store defaults to an in-memory Map (no injection needed)', () => {
  const m = makeDesignMemory(); // no args at all
  m.add('x', 'a', v(1, 0, 0, 0));
  assert.equal(m.all('x').length, 1);
});

// --- add does not mutate caller meta -----------------------------------------------------------------

test('meta defaults to {} when omitted', () => {
  const m = makeDesignMemory();
  m.add('x', 'a', v(1, 0, 0, 0)); // no meta
  const [top] = m.query('x', v(1, 0, 0, 0), 1);
  assert.deepEqual(top.meta, {});
});
