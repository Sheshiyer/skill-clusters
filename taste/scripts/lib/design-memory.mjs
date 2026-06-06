// design-memory.mjs — a per-brand 1024-dim visual-DNA store: the LOCAL, federated precursor to noesis.
//
// CONVERGENCE INTO NOESIS (#24): three memories grow up side by side — this brand visual-DNA store,
// the taste corpus (the je-ne-sais-quoi aesthetic space), and a knowledge memory. They share ONE
// cosine space (the 1024-dim embedding the taste corpus already lives in), so the moment they merge
// they become a single Vectorize-backed cortex — noesis — without re-embedding anything. This module
// is the brand lane of that future cortex, kept deliberately small and local so it can run before
// any of the cloud infrastructure exists, then be lifted into Vectorize by swapping the store seam.
//
// PURE + INJECTABLE: no live NIM here. Vectors are passed IN already-embedded (the embedder is nim.mjs's
// embedImage/embedText, dim 1024). Cosine is pure. The store is an injectable seam so the same logic
// runs on an in-memory Map (default, tests) today and a JSONL/KV/Vectorize store tomorrow — exactly the
// shape idempotency.mjs uses for its ledger.
//
//   makeDesignMemory({ store } = {}) -> {
//     add(brand, id, vector, meta = {}),       // namespace a vector under `brand`
//     query(brand, vector, k = 5),             // top-k by cosine WITHIN that brand → [{ id, score, meta }]
//     all(brand),                              // every row for a brand → [{ id, vector, meta }] (or [])
//   }
//
// The store seam is { get(brand) -> rows[], set(brand, rows) }; rows are { id, vector, meta }.
//
// Zero dependencies.

// --- pure cosine -----------------------------------------------------------------------------------

// Cosine similarity of two equal-length numeric vectors, in [-1, 1]. Pure: reads only its inputs.
// Guards the two ways cosine blows up:
//   - a zero-magnitude vector (norm 0 → division by zero → NaN) → return 0 (no direction to compare).
//   - unequal lengths (a malformed/short vector) → return 0 rather than silently using the shorter run.
export function cosine(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) return 0;
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    const x = a[i], y = b[i];
    dot += x * y;
    na += x * x;
    nb += y * y;
  }
  if (na === 0 || nb === 0) return 0; // one vector has no magnitude → undefined direction → 0
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

// --- default store (in-memory Map) -----------------------------------------------------------------

// The test seam and the today-default. A brand maps to its array of { id, vector, meta } rows.
// A later JSONL/KV/Vectorize store implements the same two-method shape.
export function makeMemoryStore() {
  const byBrand = new Map();
  return {
    get: (brand) => byBrand.get(brand) || [],
    set: (brand, rows) => { byBrand.set(brand, rows); },
  };
}

// --- the design memory -----------------------------------------------------------------------------

export function makeDesignMemory({ store = makeMemoryStore() } = {}) {
  // Append a vector to a brand's lane. meta is copied defensively so a later caller mutation can't
  // reach back into stored state. The store owns persistence; we only ever read-then-write whole rows.
  function add(brand, id, vector, meta = {}) {
    const rows = store.get(brand);
    rows.push({ id, vector, meta: { ...meta } });
    store.set(brand, rows);
    return { id };
  }

  // Top-k by cosine WITHIN this brand. Score every row, sort descending, slice k. An unknown brand
  // has no rows → []. k larger than the row count just returns every row (slice is safe).
  function query(brand, vector, k = 5) {
    const rows = store.get(brand);
    return rows
      .map((r) => ({ id: r.id, score: cosine(vector, r.vector), meta: r.meta }))
      .sort((p, q) => q.score - p.score)
      .slice(0, k);
  }

  // Every row for a brand (or [] for an unknown brand). Returns the stored rows as-is.
  function all(brand) {
    return store.get(brand);
  }

  return { add, query, all };
}
