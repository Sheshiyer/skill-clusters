// governor.mjs — per-venture budget + rate governor for the model router.
//
// Two independent guardrails per venture, checked on every charge():
//   1. BUDGET — accumulate spend in-memory; warn once at >=80% of the cap, throw BudgetPaused at >=100%.
//   2. RATE   — a token-bucket of `ratePerMin` calls/minute; throw RateLimited when the bucket is empty.
// State is in-memory (a Map) for now; a Worker/Durable-Object backs it in prod (see taste/PRODUCTION.md).
// Pure + testable: inject `clock` (a () => ms function) so rate-limit logic is deterministic under test.

// Distinct error TYPES so callers (the router) and tests can branch precisely with `instanceof`.
export class BudgetPaused extends Error {
  constructor(message) { super(message); this.name = 'BudgetPaused'; }
}
export class RateLimited extends Error {
  constructor(message) { super(message); this.name = 'RateLimited'; }
}

export function makeGovernor({
  cap = Infinity,           // max total spend per venture (same unit as cost passed to charge)
  ratePerMin = Infinity,    // max charge() calls per venture per 60s window
  onWarn = null,            // optional hook: onWarn({ venture, spent, cap, ratio }) when crossing 80%
  clock = () => Date.now(), // injectable monotonic-ish clock (ms) for deterministic rate tests
} = {}) {
  // venture -> { spent, warned, tokens, refilledAt }
  const ledgers = new Map();
  const WINDOW_MS = 60_000;

  const ledgerFor = (venture) => {
    let l = ledgers.get(venture);
    if (!l) {
      // bucket starts full so the first `ratePerMin` calls in a fresh window pass
      l = { spent: 0, warned: false, tokens: ratePerMin, refilledAt: clock() };
      ledgers.set(venture, l);
    }
    return l;
  };

  // Continuous token-bucket refill: tokens accrue at ratePerMin per WINDOW_MS, capped at ratePerMin.
  const refill = (l) => {
    if (ratePerMin === Infinity) return; // unlimited → never gate
    const now = clock();
    const elapsed = now - l.refilledAt;
    if (elapsed <= 0) return;
    const gained = (elapsed / WINDOW_MS) * ratePerMin;
    if (gained > 0) {
      l.tokens = Math.min(ratePerMin, l.tokens + gained);
      l.refilledAt = now;
    }
  };

  return {
    charge(venture, cost = 0) {
      const l = ledgerFor(venture);

      // --- RATE GATE (check first: a throttled call must not consume budget) -----------------------
      refill(l);
      if (l.tokens < 1) {
        throw new RateLimited(`venture "${venture}" exceeded ${ratePerMin} calls/min`);
      }

      // --- BUDGET GATE -----------------------------------------------------------------------------
      const next = l.spent + cost;
      if (next >= cap && cap !== Infinity) {
        // at/over the cap → reject WITHOUT applying spend or spending a rate token
        throw new BudgetPaused(`venture "${venture}" budget paused: ${next} >= cap ${cap}`);
      }

      // Charge is accepted → commit spend + consume one rate token.
      l.tokens -= 1;
      l.spent = next;

      // Warn exactly once when we first land in the [80%, 100%) band.
      if (!l.warned && cap !== Infinity && next >= 0.8 * cap) {
        l.warned = true;
        const payload = { venture, spent: next, cap, ratio: next / cap };
        console.warn(`[governor] venture "${venture}" at ${Math.round(payload.ratio * 100)}% of budget (${next}/${cap})`);
        if (onWarn) onWarn(payload);
      }

      return l.spent;
    },

    spent(venture) {
      return ledgers.get(venture)?.spent ?? 0;
    },
  };
}
