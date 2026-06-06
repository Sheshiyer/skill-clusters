// prototype-feedback.mjs — #57: the PURE feedback loop. Usage sharpens the brand prototype vector.
//
// taste-feedback.mjs is the side-effecting CLI (reads the corpus, rewrites the brand JSON, harvests
// triplets, logs cycles). THIS module is its pure math core — no I/O, no network, no mutation — so the
// nudge is unit-testable and reusable wherever a prototype needs sharpening from in-memory exemplars.
//
// updatePrototype pulls the prototype TOWARD the mean of chosen exemplars and AWAY from the mean of
// rejected ones, scaled by `rate`, then L2-normalizes. Same idiom as taste-feedback's
// `unit((1-a)*proto + a*centroid(used))`, generalized to handle both signals in one step.

// ── vector helpers (same shape as taste-feedback.mjs) ──
const dot = (a, b) => { let s = 0; const n = Math.min(a.length, b.length); for (let i = 0; i < n; i++) s += a[i] * b[i]; return s; };
const norm = (a) => Math.sqrt(dot(a, a)) || 1;          // ||1 guards the zero vector
const unit = (a) => { const n = norm(a); return a.map((x) => x / n); };   // norm once, not per element
const centroid = (vs) => vs[0].map((_, i) => vs.reduce((s, v) => s + v[i], 0) / vs.length);

// updatePrototype(prototype, { chosen, rejected, rate }) → a NEW, normalized prototype (pure).
//   chosen   — embeddings the user kept   → pull toward their mean
//   rejected — embeddings the user dropped → push away from their mean
// Empty chosen AND rejected → the prototype unchanged in direction, just normalized.
export function updatePrototype(prototype, { chosen = [], rejected = [], rate = 0.1 } = {}) {
  let next = [...prototype];                            // copy — the input is never mutated

  if (chosen.length) {
    const c = centroid(chosen);
    next = next.map((x, i) => x + rate * ((c[i] ?? 0) - x));        // move toward chosen mean
  }
  if (rejected.length) {
    const r = centroid(rejected);
    next = next.map((x, i) => x - rate * ((r[i] ?? 0) - x));        // move away from rejected mean
  }
  return unit(next);
}

// applyFeedbackLog(prototype, events, opts) → fold a list of { chosen, rejected } events (pure).
// Each event sharpens the running prototype; opts (e.g. { rate }) applies to every event.
export function applyFeedbackLog(prototype, events = [], opts = {}) {
  // Seed with the normalized prototype so an empty log still returns a unit vector (and a non-empty
  // log's first fold re-normalizes anyway). Either way the caller's array is never mutated.
  return events.reduce((proto, ev) => updatePrototype(proto, { ...opts, ...ev }), unit([...prototype]));
}
