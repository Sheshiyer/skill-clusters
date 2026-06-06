// idempotency.mjs — the irreversible-action interlock for the autonomous venture loop.
//
// The loop RETRIES failed steps (bounded self-heal). That's safe for embeddings, but a retry of an
// *irreversible* action — sending a cold outreach email, deploying a site — must NOT fire twice.
// This ledger is the interlock: every irreversible action gets a deterministic key, and the executor
// checks "did I already fire this?" before doing it. It sits at the gate/execute boundary; later
// phases wrap every external action in once(...).
//
//   actionKey(type, payload) -> sha256 hex of a CANONICAL {type, payload} (keys sorted at every depth,
//                               so key order never changes the key).
//   once(key, fn, { store })  -> if `key` is already recorded, return the cached result WITHOUT calling
//                               fn; otherwise call fn(), record { key, result, ts }, return the result.
//                               If fn THROWS, the key is NOT recorded (a genuine failure stays retryable).
//
// The store is an injectable { has(key), get(key), put(key, result) } seam:
//   - makeMemoryStore()  — in-memory Map, for tests.
//   - makeJsonlStore(f)  — append-only JSONL, durable across process restarts (the default).
//   - a Cloudflare KV store can be swapped in for production later (same three-method shape).
//
// Zero dependencies: node:crypto / node:fs / node:path only. Single-process concurrency uses a plain
// in-memory Map on top of the file — no file locking for slice-1 (see taste/PRODUCTION.md).

import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { stableStringify } from './canonical.mjs';

// --- canonical JSON --------------------------------------------------------------------------------
// canonicalize + stableStringify now live in ./canonical.mjs (shared with brand-spec versioning).
// Re-exported here so existing `import { stableStringify } from './idempotency.mjs'` keeps working.
export { stableStringify };

// Deterministic key for an irreversible action. Same (type, payload) → same key, regardless of key order.
export function actionKey(type, payload) {
  return createHash('sha256').update(stableStringify({ type, payload })).digest('hex');
}

// --- stores (the injectable { has, get, put } seam) ------------------------------------------------

// In-memory store — the test seam, and the per-process cache the JSONL store builds on.
export function makeMemoryStore() {
  const map = new Map();
  return {
    has: (key) => map.has(key),
    get: (key) => map.get(key),
    put: (key, result) => { map.set(key, result); },
  };
}

// Append-only JSONL store. On construction it loads any existing file into an in-memory Map — that
// load is BOTH the single-process cache and the cross-process durability mechanism: a fresh store in
// a new process reconstructs its state from the file. put() appends one { key, result, ts } line and
// updates the map. Last-write-wins on replay if a key somehow appears twice.
export function makeJsonlStore(file) {
  const map = new Map();

  if (fs.existsSync(file)) {
    const text = fs.readFileSync(file, 'utf8');
    for (const line of text.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const rec = JSON.parse(trimmed);
        if (rec && typeof rec.key === 'string') map.set(rec.key, rec.result);
      } catch {
        // tolerate a torn final line from a crashed append; skip it rather than fail the whole load
      }
    }
  }

  return {
    has: (key) => map.has(key),
    get: (key) => map.get(key),
    put: (key, result) => {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.appendFileSync(file, JSON.stringify({ key, result, ts: new Date().toISOString() }) + '\n');
      map.set(key, result);
    },
  };
}

// --- default durable store -------------------------------------------------------------------------

// taste/feedback/idempotency.jsonl, resolved relative to this module (this dir is git-ignored:
// .gitignore -> taste/feedback/*.jsonl). Lazy so merely importing this module never touches the FS —
// tests that inject their own store stay fully isolated from the on-disk ledger.
const here = path.dirname(fileURLToPath(import.meta.url));            // taste/scripts/lib
const DEFAULT_LEDGER = path.resolve(here, '../../feedback/idempotency.jsonl');

let _defaultStore = null;
function getDefaultStore() {
  if (!_defaultStore) _defaultStore = makeJsonlStore(DEFAULT_LEDGER);
  return _defaultStore;
}

// --- the interlock ---------------------------------------------------------------------------------

// Fire `fn` at most once per `key`. Already recorded → return the cached result, fn untouched.
// Otherwise run fn(), record the result, return it. A throw from fn propagates BEFORE put(), so the
// key is never recorded for a failed action — the loop can retry it safely.
//
// The gate is store.has(key), NOT a truthy store.get(key): an action whose result is undefined/null
// must still short-circuit on retry.
export async function once(key, fn, { store = getDefaultStore() } = {}) {
  if (store.has(key)) return store.get(key);
  const result = await fn();      // throws here → we never reach put(), so the key stays unrecorded
  store.put(key, result);
  return result;
}
