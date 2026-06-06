// noesis.mjs — the LOCAL, federated memory cortex: one query API over three 1024-dim memories (#73).
//
// noesis is the precursor to the prod convergence (Cloudflare Vectorize, #24, deferred). It federates
// the three organs' memories — each already a vector store in the SAME 1024-dim NIM space — so they
// share a single nervous system NOW, locally, before any cloud infrastructure exists:
//
//   taste     — the je-ne-sais-quoi aesthetic corpus (Codrops/NIM embeddings; see taste-resolve.mjs)
//   brand     — design-memory's per-brand visual-DNA store (see design-memory.mjs)
//   knowledge — the snow-gloves knowledge memory
//
// The precondition that makes federation possible: all three live in ONE cosine space (the 1024-dim
// embedding the taste corpus already uses). Because the space is shared, a vector from `brand` and a
// vector from `taste` are directly comparable — so queryAll can merge and re-rank ACROSS namespaces by
// cosine alone. Nothing is re-embedded; this module just routes reads/writes across the three lanes.
//
// CONVERGENCE INTO VECTORIZE (#24): each namespace is a vector store behind an INJECTABLE { get, set }
// seam (the exact shape design-memory.mjs and idempotency.mjs use). Today the default is an in-memory
// Map per namespace; tomorrow a Vectorize/JSONL/KV backend implementing the same two methods drops into
// `stores` with zero changes to the federation logic above it.
//
//   makeNoesis({ stores } = {}) -> {
//     add(namespace, id, vector, meta = {}),  // write into ONE namespace (taste|brand|knowledge)
//     query(namespace, vector, k = 5),        // top-k by cosine WITHIN a namespace → [{ id, score, meta, namespace }]
//     queryAll(vector, k = 5),                // top-k ACROSS all namespaces, merged + re-ranked → each carries `namespace`
//     stats(),                                // { taste: n, brand: n, knowledge: n }
//   }
//
// PURE + INJECTABLE: vectors arrive already-embedded (the embedder is nim.mjs's embedText/embedImage,
// dim 1024). Cosine is pure and reused from design-memory.mjs — no reinvention, no live NIM, no network.
// Zero dependencies.

import { cosine, makeMemoryStore } from './design-memory.mjs';

// The three federated lanes. An unknown namespace is rejected — federation is a closed set of organs,
// not an open key-value bag, so a typo'd namespace is a bug to surface, not a fourth memory to create.
export const NAMESPACES = ['taste', 'brand', 'knowledge'];

export function makeNoesis({ stores = {} } = {}) {
  // One { get, set } store per namespace. Each injected store wins; any namespace left unspecified
  // falls back to a default in-memory Map (design-memory's seam) — so partial injection works and a
  // Vectorize backend can be slotted in lane-by-lane.
  const lanes = Object.fromEntries(
    NAMESPACES.map((ns) => [ns, stores[ns] || makeMemoryStore()]),
  );

  // Guard the closed set. Reading or writing an unknown namespace is a programming error.
  function laneFor(namespace) {
    const store = lanes[namespace];
    if (!store) {
      throw new Error(`noesis: unknown namespace "${namespace}" (expected one of: ${NAMESPACES.join(', ')})`);
    }
    return store;
  }

  // Append a vector to one namespace's lane. meta is copied defensively so a later caller mutation
  // can't reach back into stored state (mirrors design-memory.add). Read-then-write whole rows.
  function add(namespace, id, vector, meta = {}) {
    const store = laneFor(namespace);
    const rows = store.get(namespace);
    rows.push({ id, vector, meta: { ...meta } });
    store.set(namespace, rows);
    return { id };
  }

  // Score one namespace's rows against `vector`, tagging each with its namespace. Shared by query()
  // (one lane) and queryAll() (every lane). Pure: cosine reads only its inputs.
  function scoreLane(namespace, vector) {
    return laneFor(namespace)
      .get(namespace)
      .map((r) => ({ id: r.id, score: cosine(vector, r.vector), meta: r.meta, namespace }));
  }

  // Top-k by cosine WITHIN one namespace. Unknown namespace → throws; known-but-empty → []. k larger
  // than the row count just returns every row (slice is safe).
  function query(namespace, vector, k = 5) {
    return scoreLane(namespace, vector)
      .sort((p, q) => q.score - p.score)
      .slice(0, k);
  }

  // The single-nervous-system read: top-k ACROSS all three namespaces. Score every lane, concatenate
  // the tagged hits into one pool, re-rank by cosine alone, slice k. Because all three share the 1024-dim
  // space, a closer `brand` hit legitimately outranks a farther `taste` hit. Empty federation → [].
  function queryAll(vector, k = 5) {
    return NAMESPACES
      .flatMap((ns) => scoreLane(ns, vector))
      .sort((p, q) => q.score - p.score)
      .slice(0, k);
  }

  // Row count per namespace — a cheap census of the whole cortex.
  function stats() {
    return Object.fromEntries(NAMESPACES.map((ns) => [ns, lanes[ns].get(ns).length]));
  }

  return { add, query, queryAll, stats };
}
