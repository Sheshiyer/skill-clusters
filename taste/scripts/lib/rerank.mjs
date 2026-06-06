// rerank.mjs — #54: a pure second-stage MMR rerank for taste-resolve's candidates.
//
// taste-resolve.mjs retrieves by cosine + a brand-bias blend, but its top-K can be near-duplicates.
// This injects DIVERSITY via Maximal Marginal Relevance (Carbonell & Goldstein, 1998): iteratively
// pick the candidate maximizing
//
//     lambda * relevance(c)  -  (1 - lambda) * max_{p in picked} sim(c, p)
//
// where relevance = cosine to the query (+ a small brand bias toward brandVec when supplied). Low
// lambda favors diversity (spreads the top-K across the candidate space); high lambda ≈ pure relevance.
//
// Pure: reads the candidates, returns a NEW reordered array of the SAME candidate objects. No I/O,
// no mutation of the input array or its items. Mirrors the cosine idioms in taste-resolve / nim.

// ── cosine (same shape as taste-resolve.mjs, with the divide-by-zero guard) ──
const dot = (a, b) => { let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) s += a[i] * b[i]; return s; };
const norm = (a) => Math.sqrt(dot(a, a)) || 1;
const cos = (a, b) => dot(a, b) / (norm(a) * norm(b));

const BRAND_BIAS = 0.15; // small — relevance stays dominated by query similarity

// rerank(candidates, { queryVec, brandVec, lambda, k }) → reordered top-k (pure).
// Each candidate is { id, embedding, score? }. `embedding` drives both relevance and the diversity
// penalty; a precomputed `score` is ignored here (MMR recomputes relevance from the vectors).
export function rerank(candidates, { queryVec, brandVec = null, lambda = 0.7, k = 5 } = {}) {
  if (!Array.isArray(candidates) || candidates.length === 0) return [];

  // relevance for each candidate: query cosine, nudged toward the brand prototype when given.
  const rel = new Map();
  for (const c of candidates) {
    const e = c.embedding || [];
    const r = cos(queryVec || [], e) + (brandVec ? BRAND_BIAS * cos(brandVec, e) : 0);
    rel.set(c, r);
  }

  const pool = [...candidates];          // copy — never mutate the caller's array
  const picked = [];
  const limit = Math.min(k, pool.length);

  while (picked.length < limit) {
    let best = null, bestScore = -Infinity;
    for (const c of pool) {
      // diversity penalty: similarity to the closest already-picked item (0 on the first pick).
      let maxSim = 0;
      for (const p of picked) { const s = cos(c.embedding || [], p.embedding || []); if (s > maxSim) maxSim = s; }
      const mmr = lambda * rel.get(c) - (1 - lambda) * maxSim;
      if (mmr > bestScore) { bestScore = mmr; best = c; }
    }
    picked.push(best);
    pool.splice(pool.indexOf(best), 1);
  }
  return picked;
}
