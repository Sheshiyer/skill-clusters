// router.mjs — best-of-breed model router for the taste engine.
//
// Picks the strongest provider/model per TASK TYPE, with a per-task FALLBACK CHAIN (primary first),
// a per-venture BUDGET+RATE GOVERNOR (governor.mjs), and PROVIDER FAILOVER on any error.
//
// Only the `nim` adapter is wired today (it rides the NIM key-pool + Cloudflare Worker via nim.mjs).
// The rest (claude, gpt-image-2, arcplume, fal, fal-video) are intentional STUBS that throw
// "provider <name> not configured" — they get wired in later phases. Because generate() treats a
// throwing adapter as a failover signal, a route whose primary is a stub transparently falls through
// to the next live attempt (e.g. creative-text: claude-stub → nim).

import * as nim from './nim.mjs';
import { makeGovernor, BudgetPaused, RateLimited } from './governor.mjs';

// ── ROUTES ───────────────────────────────────────────────────────────────────────────────────────
// task → ordered attempts. attempt[0] is the preferred provider/model; the rest are fallbacks.
// Frozen so route() can hand callers the live array without risking corruption of the table.
export const ROUTES = Object.freeze({
  'creative-text':  [{ provider: 'claude', model: 'claude-sonnet' },            { provider: 'nim', model: 'meta/llama-3.3-70b-instruct' }],
  'structured-json':[{ provider: 'nim',    model: 'meta/llama-3.3-70b-instruct' }, { provider: 'claude', model: 'claude-sonnet' }],
  'code':           [{ provider: 'claude', model: 'claude-sonnet' },            { provider: 'nim', model: 'meta/llama-3.3-70b-instruct' }],
  'outreach':       [{ provider: 'claude', model: 'claude-sonnet' },            { provider: 'nim', model: 'meta/llama-3.3-70b-instruct' }],
  'image':          [{ provider: 'gpt-image-2', model: 'gpt-image-2' },         { provider: 'fal', model: 'fal-image' }],
  'video':          [{ provider: 'arcplume', model: 'arcplume' },               { provider: 'fal-video', model: 'fal-video' }],
  'embed':          [{ provider: 'nim',    model: 'nvidia/nv-embedqa-e5-v5' }],
  'vision':         [{ provider: 'nim',    model: 'meta/llama-3.2-90b-vision-instruct' }],
});

// ── COST MODEL ───────────────────────────────────────────────────────────────────────────────────
// Coarse per-call cost estimate (relative credits, NOT dollars) used by the budget governor.
// Heavy media generation costs far more than a text/embed call; tune as real pricing lands.
const COST = {
  'creative-text': 1,
  'structured-json': 1,
  'code': 1,
  'outreach': 1,
  'embed': 0.2,
  'vision': 2,
  'image': 5,
  'video': 20,
};
export function estimateCost(task) {
  return COST[task] ?? 1;
}

// ── PROVIDER ADAPTER REGISTRY ──────────────────────────────────────────────────────────────────
// Each adapter exposes `run(model, payload)`. `nim` is live; the rest throw until wired.
// Injectable: generate() accepts a custom `adapters` map so tests can mock providers.
const notConfigured = (name) => ({
  run: async () => { throw new Error(`provider ${name} not configured`); },
});

export const ADAPTERS = {
  // Live NIM adapter — dispatches by task family inferred from the model id.
  nim: {
    async run(model, payload = {}) {
      // embeddings
      if (/embedqa|nv-embed|nvclip/i.test(model)) {
        return nim.embedText(payload.input ?? payload.text ?? payload, { model, ...(payload.opts || {}) });
      }
      // vision / VLM (image payload present, or a vision model)
      if (/vision/i.test(model) || payload.imageBuf) {
        return nim.vlmAnnotate(payload.imageBuf, payload.mime, { model, ...(payload.opts || {}) });
      }
      // default: chat completion. Accept either a ready messages[] or a prompt/system shorthand.
      const messages = payload.messages || [
        ...(payload.system ? [{ role: 'system', content: payload.system }] : []),
        { role: 'user', content: payload.prompt ?? String(payload) },
      ];
      return nim.chat(messages, { model, ...(payload.opts || {}) });
    },
  },
  claude: notConfigured('claude'),
  'gpt-image-2': notConfigured('gpt-image-2'),
  arcplume: notConfigured('arcplume'),
  fal: notConfigured('fal'),
  'fal-video': notConfigured('fal-video'),
};

// ── ROUTE ────────────────────────────────────────────────────────────────────────────────────────
// Returns a COPY of the ordered attempts for `task`. Throws on an unknown task.
export function route(task) {
  const attempts = ROUTES[task];
  if (!attempts) throw new Error(`unknown task "${task}" — known: ${Object.keys(ROUTES).join(', ')}`);
  return attempts.map((a) => ({ ...a })); // defensive copy: callers can't mutate the frozen table's contents
}

// ── DEFAULT GOVERNOR ─────────────────────────────────────────────────────────────────────────────
// One process-wide governor for normal use (uncapped by default — set env caps / pass overrides to gate).
const defaultGovernor = makeGovernor({
  cap: Number(process.env.TASTE_BUDGET_CAP) || Infinity,
  ratePerMin: Number(process.env.TASTE_RATE_PER_MIN) || Infinity,
});

// ── GENERATE ─────────────────────────────────────────────────────────────────────────────────────
// route(task) → charge the governor (may throw BudgetPaused/RateLimited) → try attempts in order,
// failing over on ANY adapter error. Throws the LAST error if every attempt fails.
//
// `cap`/`ratePerMin` (when provided) build a one-off governor for this call — handy for tests and
// for per-request quotas. Otherwise the process-wide defaultGovernor is used.
export async function generate(task, payload, {
  venture = 'default',
  adapters = ADAPTERS,
  governor,
  cap,
  ratePerMin,
} = {}) {
  const attempts = route(task); // throws on unknown task BEFORE any spend or adapter call

  const gov = governor
    ?? ((cap !== undefined || ratePerMin !== undefined)
      ? makeGovernor({ cap: cap ?? Infinity, ratePerMin: ratePerMin ?? Infinity })
      : defaultGovernor);

  // Charge up-front so an over-budget / throttled venture is stopped before we hit a provider.
  gov.charge(venture, estimateCost(task)); // may throw BudgetPaused / RateLimited (propagated to caller)

  let lastErr;
  for (const { provider, model } of attempts) {
    const adapter = adapters[provider];
    if (!adapter || typeof adapter.run !== 'function') {
      // No adapter registered for this provider → treat as a failover, not a hard crash.
      lastErr = new Error(`provider ${provider} not configured`);
      console.warn(`[router] ${task}: ${provider} unavailable → failing over`);
      continue;
    }
    try {
      return await adapter.run(model, payload);
    } catch (e) {
      lastErr = e;
      console.warn(`[router] ${task}: ${provider}/${model} failed (${e.message}) → failing over`);
    }
  }
  throw lastErr || new Error(`router: all attempts failed for task "${task}"`);
}

export { BudgetPaused, RateLimited };
