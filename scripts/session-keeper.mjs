// session-keeper.mjs — session-health tracker for the router's session-based providers (#30).
//
// The model router's `image` and `video` lanes route to providers (gpt-image-2, arcplume) that hold a
// SERVER-SIDE SESSION which silently expires. A dead session looks fine until the next dispatch fails
// mid-venture. This module probes each provider and classifies it BEFORE the router hands it work, so a
// dying session is refreshed/alerted proactively instead of blowing up a live render.
//
//   checkSessions(providers, { probe, now }) -> [{ name, status, lastOkTs, checkedAt }]
//     providers : [{ name, lastOkTs? }]  — the fleet, with each provider's last-known-good timestamp (ms).
//     probe(name): injectable liveness check — resolves TRUTHY if the session is live; throws OR resolves
//                  falsy if it's dead. Injectable so tests need no network and prod can swap the real call.
//     now()     : injectable clock (() => ms) — the single source of "current time"; keeps every
//                 ok→degraded→expired transition deterministic under test (no wall-clock).
//
//   Classification (per provider):
//     • probe ok            → 'ok'        and lastOkTs is advanced to now()  (the recovery/heartbeat path)
//     • probe fails, but the LAST success is within GRACE_MS of now          → 'degraded'  (recently alive;
//                              a transient blip — keep using, but watch.   lastOkTs is left untouched)
//     • probe fails, and lastOkTs is stale (older than GRACE_MS) or absent   → 'expired'   (refresh now)
//
//   needsRefresh(report) -> [name...]  — just the 'expired' providers: the refresh/alert worklist.
//                           'degraded' is deliberately NOT included — it's a warning state, not an action.
//
// Pure + zero-dependency: no imports, no I/O of its own. The probe and clock are the only seams.

// Grace window: how long after the last good probe a provider may keep failing before it's "expired"
// rather than merely "degraded". 5 minutes — long enough to ride out a transient hiccup, short enough
// that a truly-dead session is escalated promptly. Exported so tests can pin transitions to the boundary.
export const GRACE_MS = 5 * 60 * 1000; // 300_000

// Probe one provider and classify it. A failure is EITHER a thrown error or a falsy resolution — both
// mean "not live". A success advances lastOkTs to now; a failure never moves it (so the grace window is
// measured from the genuine last-good time, not from this failed attempt).
async function classify(provider, { probe, now, graceMs }) {
  const checkedAt = now();
  const priorOk = typeof provider.lastOkTs === 'number' ? provider.lastOkTs : null;

  let live = false;
  try {
    live = Boolean(await probe(provider.name)); // a non-throwing falsy probe still counts as dead
  } catch {
    live = false; // a thrown probe is a dead session, not a crash — swallow and classify
  }

  if (live) {
    return { name: provider.name, status: 'ok', lastOkTs: checkedAt, checkedAt };
  }

  // Probe failed. Within grace of a real prior success → degraded; otherwise → expired.
  const withinGrace = priorOk !== null && checkedAt - priorOk <= graceMs;
  return {
    name: provider.name,
    status: withinGrace ? 'degraded' : 'expired',
    lastOkTs: priorOk, // unchanged on failure (null if it never succeeded)
    checkedAt,
  };
}

// Probe the whole fleet and return one report row per provider, in input order. One provider's failing
// probe never affects another's classification (each is isolated in classify()).
export async function checkSessions(providers = [], { probe, now = () => Date.now(), graceMs = GRACE_MS } = {}) {
  if (typeof probe !== 'function') {
    throw new TypeError('checkSessions requires an injectable probe(name) function');
  }
  // Sequential await keeps the report deterministic and order-stable; the fleet is small (a handful of
  // providers), so there's no throughput reason to parallelize here.
  const report = [];
  for (const provider of providers) {
    report.push(await classify(provider, { probe, now, graceMs }));
  }
  return report;
}

// The refresh/alert worklist: only providers whose session is fully expired. Degraded ones are still
// usable and are intentionally excluded — surfacing them here would create refresh churn on every blip.
export function needsRefresh(report = []) {
  return report.filter((r) => r.status === 'expired').map((r) => r.name);
}
