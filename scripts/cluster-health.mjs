// cluster-health.mjs — per-cluster health + decline detection over the dispatch/usage log (#36).
//
// Every time the conductor dispatches work to a skill-cluster it appends an event { cluster, ok, ts } to a
// JSONL log. Over time a cluster's orchestrator can quietly rot — a model swap, a prompt drift, a flaky
// downstream — and its success rate slides. A lifetime average hides this: a cluster with 1000 historical
// wins and a wall of recent failures still shows ~99%. So we compute BOTH a lifetime rate and a trailing
// recent rate, and flag a cluster as DECLINING when the recent rate has dropped meaningfully below its own
// lifetime baseline. That's the early-warning signal the router/operator acts on.
//
//   clusterHealth(events, { window = 20, declineDrop = 0.2 })
//       events : [{ cluster, ok, ts }]   — the dispatch/usage log (any order; we segment by cluster).
//       window : trailing N events PER CLUSTER that define "recent".
//       declineDrop : how far recentRate must fall below successRate to count as declining (absolute,
//                     e.g. 0.2 = 20 percentage points).
//     -> { clusters: { <cluster>: { runs, successRate, recentRate, declining } }, declining: [<cluster>...] }
//         runs        : total events for the cluster.
//         successRate : ok / runs over ALL of the cluster's events (the lifetime baseline).
//         recentRate  : ok / n over the LAST `window` events for the cluster (recency-weighted health).
//         declining   : recentRate <= successRate - declineDrop  (recent health fell below baseline).
//       declining (top level): the list of cluster names with declining === true.
//
//   loadEvents(file, { readImpl })  — parse a JSONL event log with an INJECTABLE reader. Blank lines and
//       malformed/garbage/torn lines are skipped (a corrupt line must never sink the whole report).
//
// Pure + zero-dependency: clusterHealth touches no I/O; loadEvents does all reading through readImpl, so
// tests pass a string and never hit a real file. The default reader uses node:fs only when called for real.

// Success rate of a slice of events; an empty slice is 0 (no signal → treat as worst, never NaN).
function rate(slice) {
  if (slice.length === 0) return 0;
  const ok = slice.reduce((n, e) => n + (e.ok ? 1 : 0), 0);
  return ok / slice.length;
}

// Compute per-cluster health and the declining list in a single pass over the log.
export function clusterHealth(events = [], { window = 20, declineDrop = 0.2 } = {}) {
  // Bucket events by cluster, preserving arrival order so "the last `window`" is meaningful. We assume the
  // log is appended in time order (the conductor writes it that way); ts is carried for callers/sorting but
  // ordering here follows insertion, mirroring how the JSONL was produced.
  const byCluster = new Map();
  for (const e of events) {
    if (!e || typeof e.cluster !== 'string') continue; // ignore shapeless rows defensively
    if (!byCluster.has(e.cluster)) byCluster.set(e.cluster, []);
    byCluster.get(e.cluster).push(e);
  }

  const clusters = {};
  const declining = [];

  for (const [cluster, list] of byCluster) {
    const successRate = rate(list);
    const recent = list.slice(-window);     // last `window` events; if fewer exist, that's all of them
    const recentRate = rate(recent);

    // Declining = recent health has fallen at least `declineDrop` BELOW the lifetime baseline. Using <=
    // makes the threshold inclusive: a dip of exactly declineDrop counts as declining.
    const isDeclining = recentRate <= successRate - declineDrop;

    clusters[cluster] = { runs: list.length, successRate, recentRate, declining: isDeclining };
    if (isDeclining) declining.push(cluster);
  }

  return { clusters, declining };
}

// Default reader, used only when loadEvents is called without a readImpl in production. Lazily importing
// node:fs keeps this module import-pure: merely importing cluster-health.mjs touches no filesystem, and
// tests that inject readImpl never load fs at all.
async function defaultRead(file) {
  const { readFileSync } = await import('node:fs');
  return readFileSync(file, 'utf8');
}

// Parse a JSONL event log into [{ cluster, ok, ts }, ...]. Every line is parsed independently and any line
// that is blank, whitespace-only, or not valid JSON is skipped rather than thrown — one torn append (a
// crash mid-write) or a stray log line must not break health reporting. `readImpl(file) -> string` is the
// injectable seam; with it this function is fully testable with no real file.
//
// Note: when readImpl is provided this returns synchronously (the common test path). Without it, the
// default node:fs reader is async, so the result is a Promise — `await loadEvents(file)` works in prod.
export function loadEvents(file, { readImpl } = {}) {
  const parse = (text) => {
    const out = [];
    for (const line of String(text).split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue; // blank / whitespace-only
      try {
        const rec = JSON.parse(trimmed);
        if (rec && typeof rec.cluster === 'string') out.push(rec);
        // a parseable line that isn't an event row (no cluster) is silently ignored
      } catch {
        // garbage / partial line — skip it, keep going
      }
    }
    return out;
  };

  if (typeof readImpl === 'function') return parse(readImpl(file));
  return defaultRead(file).then(parse);
}
