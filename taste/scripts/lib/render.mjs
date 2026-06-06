// render.mjs — Fitcheck/VTO try-on render engine (the media-gen core, venture-agnostic).
//
// Turns a {productImage, body} request into a garment-on-body render, with the three Phase-0 safety
// guarantees wired in by REUSE (not reinvented):
//   • idempotency — actionKey + once(): one identical request → exactly one generation (cost control).
//   • governance  — router.generate charges the budget/rate governor BEFORE the model call.
//   • dispatch    — router.generate('image', …) routes to the best image provider with failover.
//
// LIVE SPEND IS GATED: the router's `image` lane provider (`gpt-image-2`) is an unconfigured stub
// today, so a real call throws → graceful fallback. Firing a real render needs (1) a wired image
// adapter and (2) founder spend approval. Tests inject a mock adapter — nothing real is generated.

import { actionKey, once, makeMemoryStore } from './idempotency.mjs';
import { generate } from './router.mjs';

// process-wide default ledger (in prod: a JSONL/KV-backed store). Tests inject a fresh store.
const defaultStore = makeMemoryStore();

// body = "preset:<id>" | "uploaded:<ref>" → a short natural description for the render prompt
function describeBody(body) {
  const [kind, id] = String(body).split(':');
  return kind === 'uploaded' ? "the shopper's uploaded photo" : `the ${id || 'default'} preset model body`;
}

/**
 * renderTryOn(request, opts) → { renderId, status, image|null, fallback }
 *   request: { productImage, body, venture? }   — body is "preset:<id>" or "uploaded:<ref>"
 *   opts:    { adapters?, governor?, cap?, ratePerMin?, store?, genOpts? }  (all injectable for tests)
 *
 * status: 'rendered' (image present) | 'fallback' (provider failed → degrade gracefully).
 * Throws on bad input, and propagates BudgetPaused/RateLimited (governance is a deliberate stop).
 */
export async function renderTryOn(request, opts = {}) {
  if (!request || !request.productImage || !request.body) {
    throw new Error('renderTryOn: productImage and body are required');
  }
  const venture = request.venture || 'default';
  const store = opts.store || defaultStore;
  // the idempotency identity is the render INPUT (product + body) — not the venture or prompt wording
  const key = actionKey('tryon', { productImage: request.productImage, body: request.body });
  const renderId = key.slice(0, 16);

  // once(): fires the generation exactly once per identical request; repeats return the cached render.
  return once(key, async () => {
    const payload = {
      prompt: `Virtual try-on: render the garment from ${request.productImage} onto ${describeBody(request.body)}, photoreal, preserving garment color, pattern, and drape.`,
      productImage: request.productImage,
      body: request.body,
      ...(opts.genOpts || {}),
    };
    try {
      const image = await generate('tryon', payload, {
        venture,
        adapters: opts.adapters,
        governor: opts.governor,
        cap: opts.cap,
        ratePerMin: opts.ratePerMin,
      });
      return { renderId, status: 'rendered', image, fallback: null };
    } catch (e) {
      // Governance stops PROPAGATE (deliberate, not a render failure) so the ledger doesn't cache a
      // "failure" and the caller may retry once budget/rate frees up.
      if (e.name === 'BudgetPaused' || e.name === 'RateLimited') throw e;
      // Any provider/model failure degrades GRACEFULLY (spec FR-004) — never a broken state.
      return { renderId, status: 'fallback', image: null, fallback: 'preset-or-email', error: e.message };
    }
  }, { store });
}
