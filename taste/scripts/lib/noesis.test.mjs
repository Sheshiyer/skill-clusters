// noesis.test.mjs — the LOCAL federated memory cortex over three 1024-dim namespaces (#73).
// Run: node --test taste/scripts/lib/noesis.test.mjs
//
// noesis federates three vector stores that live in the SAME 1024-dim NIM space —
//   taste (the je-ne-sais-quoi aesthetic corpus), brand (design-memory visual-DNA),
//   knowledge (snow-gloves) — behind one query API. query(ns, v) ranks WITHIN a namespace;
// queryAll(v) merges ACROSS all three and re-ranks by cosine, each hit tagged with its namespace
// (the "single nervous system" read). Stores are injectable so a Vectorize backend drops in later.
// Pure cosine, no live NIM, no network.

import { test } from 'node:test';
import assert from 'node:assert';

import { makeNoesis } from './noesis.mjs';

// --- helpers ---------------------------------------------------------------------------------------

// A tiny 4-dim vector so cosine ordering is hand-checkable (dim is documentary; cosine works at any
// equal length — the real federation is 1024-dim across all three namespaces).
const v = (...xs) => xs;

// --- add + per-namespace query ---------------------------------------------------------------------

test('add to each namespace, then query(ns, v) ranks WITHIN that namespace by cosine', () => {
  const n = makeNoesis();
  n.add('taste', 't1', v(1, 0, 0, 0), { label: 't1' });
  n.add('taste', 't2', v(0.9, 0.1, 0, 0), { label: 't2' });
  n.add('taste', 't3', v(0, 1, 0, 0), { label: 't3' }); // orthogonal to the query

  const out = n.query('taste', v(1, 0, 0, 0), 3);
  assert.equal(out.length, 3);
  // t1 identical (cos 1), t2 near, t3 orthogonal (cos 0) → t1, t2, t3
  assert.deepEqual(out.map((r) => r.id), ['t1', 't2', 't3']);
  assert.ok(out[0].score >= out[1].score && out[1].score >= out[2].score);
});

test('query result items have shape { id, score, meta, namespace }', () => {
  const n = makeNoesis();
  n.add('brand', 'b1', v(1, 0, 0, 0), { label: 'hello' });
  const [top] = n.query('brand', v(1, 0, 0, 0), 1);
  assert.equal(top.id, 'b1');
  assert.equal(typeof top.score, 'number');
  assert.deepEqual(top.meta, { label: 'hello' });
  assert.equal(top.namespace, 'brand'); // every hit reports which memory it came from
});

test('each namespace is isolated — taste/brand/knowledge do not leak into one another', () => {
  const n = makeNoesis();
  n.add('taste', 't', v(1, 0, 0, 0));
  n.add('brand', 'b', v(1, 0, 0, 0));
  n.add('knowledge', 'k', v(1, 0, 0, 0));
  assert.deepEqual(n.query('taste', v(1, 0, 0, 0), 10).map((r) => r.id), ['t']);
  assert.deepEqual(n.query('brand', v(1, 0, 0, 0), 10).map((r) => r.id), ['b']);
  assert.deepEqual(n.query('knowledge', v(1, 0, 0, 0), 10).map((r) => r.id), ['k']);
});

test('query respects k (top-k only)', () => {
  const n = makeNoesis();
  n.add('taste', 'a', v(1, 0, 0, 0));
  n.add('taste', 'b', v(0.9, 0.1, 0, 0));
  n.add('taste', 'c', v(0, 1, 0, 0));
  const out = n.query('taste', v(1, 0, 0, 0), 2);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((r) => r.id), ['a', 'b']);
});

test('query default k is 5', () => {
  const n = makeNoesis();
  for (let i = 0; i < 8; i++) n.add('knowledge', `k${i}`, v(1, 0, 0, 0));
  const out = n.query('knowledge', v(1, 0, 0, 0)); // no k arg
  assert.equal(out.length, 5);
});

// --- unknown namespace is rejected -----------------------------------------------------------------

test('add to an unknown namespace throws', () => {
  const n = makeNoesis();
  assert.throws(() => n.add('nope', 'x', v(1, 0, 0, 0)), /namespace/i);
});

test('query of an unknown namespace throws', () => {
  const n = makeNoesis();
  assert.throws(() => n.query('nope', v(1, 0, 0, 0), 5), /namespace/i);
});

// --- queryAll: the single-nervous-system read ------------------------------------------------------

test('queryAll merges ACROSS namespaces and re-ranks by cosine, each hit tagged with its namespace', () => {
  const n = makeNoesis();
  // a closer vector lives in `brand`; a farther one in `taste`. Federation must let the closer
  // brand hit outrank the farther taste hit — proving the merge is by cosine, not by namespace.
  n.add('taste', 'far', v(0, 1, 0, 0));            // orthogonal to query → cos 0
  n.add('brand', 'near', v(0.95, 0.05, 0, 0));     // close to query → high cos
  n.add('knowledge', 'mid', v(0.5, 0.5, 0, 0));    // between the two

  const out = n.queryAll(v(1, 0, 0, 0), 3);
  assert.equal(out.length, 3);
  // ranked purely by cosine across all three: near (brand) > mid (knowledge) > far (taste)
  assert.deepEqual(out.map((r) => r.id), ['near', 'mid', 'far']);
  assert.deepEqual(out.map((r) => r.namespace), ['brand', 'knowledge', 'taste']);
  assert.ok(out[0].score >= out[1].score && out[1].score >= out[2].score);
});

test('queryAll: a closer brand vector outranks a farther taste vector', () => {
  const n = makeNoesis();
  n.add('taste', 't', v(0.2, 0.98, 0, 0));   // far from the query
  n.add('brand', 'b', v(1, 0, 0, 0));        // identical to the query
  const [top] = n.queryAll(v(1, 0, 0, 0), 5);
  assert.equal(top.id, 'b');
  assert.equal(top.namespace, 'brand');
});

test('queryAll respects k across the merged set', () => {
  const n = makeNoesis();
  n.add('taste', 't1', v(1, 0, 0, 0));
  n.add('taste', 't2', v(0.9, 0.1, 0, 0));
  n.add('brand', 'b1', v(0.8, 0.2, 0, 0));
  n.add('knowledge', 'k1', v(0.7, 0.3, 0, 0));
  const out = n.queryAll(v(1, 0, 0, 0), 2);
  assert.equal(out.length, 2);
  assert.deepEqual(out.map((r) => r.id), ['t1', 't2']);
});

test('queryAll default k is 5 across the federation', () => {
  const n = makeNoesis();
  for (let i = 0; i < 3; i++) n.add('taste', `t${i}`, v(1, 0, 0, 0));
  for (let i = 0; i < 3; i++) n.add('brand', `b${i}`, v(1, 0, 0, 0));
  for (let i = 0; i < 3; i++) n.add('knowledge', `k${i}`, v(1, 0, 0, 0)); // 9 total
  const out = n.queryAll(v(1, 0, 0, 0)); // no k
  assert.equal(out.length, 5);
});

test('queryAll over an empty federation returns []', () => {
  const n = makeNoesis();
  assert.deepEqual(n.queryAll(v(1, 0, 0, 0), 5), []);
});

// --- stats -----------------------------------------------------------------------------------------

test('stats() counts rows per namespace', () => {
  const n = makeNoesis();
  n.add('taste', 't1', v(1, 0, 0, 0));
  n.add('taste', 't2', v(0, 1, 0, 0));
  n.add('brand', 'b1', v(0, 0, 1, 0));
  // knowledge left empty
  assert.deepEqual(n.stats(), { taste: 2, brand: 1, knowledge: 0 });
});

test('stats() of a fresh cortex is all zeros', () => {
  const n = makeNoesis();
  assert.deepEqual(n.stats(), { taste: 0, brand: 0, knowledge: 0 });
});

// --- empty namespace queries -----------------------------------------------------------------------

test('query of a known-but-empty namespace returns []', () => {
  const n = makeNoesis();
  n.add('taste', 't', v(1, 0, 0, 0));
  assert.deepEqual(n.query('knowledge', v(1, 0, 0, 0), 5), []); // knowledge has nothing
  assert.deepEqual(n.query('brand', v(1, 0, 0, 0), 5), []);
});

// --- pure cosine / edge cases ----------------------------------------------------------------------

test('a zero-magnitude stored vector yields score 0, not NaN', () => {
  const n = makeNoesis();
  n.add('taste', 'zero', v(0, 0, 0, 0));
  const [r] = n.query('taste', v(1, 0, 0, 0), 1);
  assert.equal(r.score, 0);
  assert.ok(!Number.isNaN(r.score));
});

test('a zero query vector yields score 0 for everything (queryAll included)', () => {
  const n = makeNoesis();
  n.add('taste', 't', v(1, 0, 0, 0));
  n.add('brand', 'b', v(0, 1, 0, 0));
  for (const r of n.queryAll(v(0, 0, 0, 0), 5)) {
    assert.equal(r.score, 0);
    assert.ok(!Number.isNaN(r.score));
  }
});

// --- injectable per-namespace stores (the Vectorize seam) ------------------------------------------

test('per-namespace stores are injectable: custom { get, set } seams are honored', () => {
  // hand each namespace its own recording store, proving the defaults are not used and that the
  // three lanes are wired independently — exactly where a Vectorize/JSONL backend slots in.
  const make = () => {
    const backing = new Map();
    let sets = 0;
    return {
      seam: {
        get: (ns) => backing.get(ns) || [],
        set: (ns, rows) => { sets++; backing.set(ns, rows); },
      },
      backing,
      sets: () => sets,
    };
  };
  const taste = make(), brand = make(), knowledge = make();
  const n = makeNoesis({ stores: { taste: taste.seam, brand: brand.seam, knowledge: knowledge.seam } });

  n.add('taste', 't', v(1, 0, 0, 0));
  n.add('brand', 'b', v(1, 0, 0, 0));
  assert.ok(taste.sets() >= 1, 'custom taste store.set was called');
  assert.ok(brand.sets() >= 1, 'custom brand store.set was called');
  assert.equal(knowledge.sets(), 0, 'untouched knowledge store was never written');

  const [top] = n.query('taste', v(1, 0, 0, 0), 1);
  assert.equal(top.id, 't');
  assert.deepEqual(n.stats(), { taste: 1, brand: 1, knowledge: 0 });
});

test('partial store injection: unspecified namespaces fall back to default in-memory Maps', () => {
  const backing = new Map();
  const seam = { get: (ns) => backing.get(ns) || [], set: (ns, rows) => { backing.set(ns, rows); } };
  const n = makeNoesis({ stores: { taste: seam } }); // only taste injected
  n.add('taste', 't', v(1, 0, 0, 0));
  n.add('brand', 'b', v(1, 0, 0, 0)); // must still work via default Map
  assert.equal(backing.get('taste').length, 1);
  assert.deepEqual(n.stats(), { taste: 1, brand: 1, knowledge: 0 });
});

test('default cortex needs no injection at all', () => {
  const n = makeNoesis(); // no args
  n.add('knowledge', 'k', v(1, 0, 0, 0));
  assert.equal(n.stats().knowledge, 1);
});

// --- add does not mutate caller meta ---------------------------------------------------------------

test('meta defaults to {} when omitted, and is copied defensively', () => {
  const n = makeNoesis();
  const meta = { tag: 'x' };
  n.add('taste', 'a', v(1, 0, 0, 0), meta);
  meta.tag = 'MUTATED'; // a later caller mutation must not reach stored state
  n.add('brand', 'b', v(1, 0, 0, 0)); // omitted meta → {}
  const [ta] = n.query('taste', v(1, 0, 0, 0), 1);
  const [tb] = n.query('brand', v(1, 0, 0, 0), 1);
  assert.deepEqual(ta.meta, { tag: 'x' });
  assert.deepEqual(tb.meta, {});
});
