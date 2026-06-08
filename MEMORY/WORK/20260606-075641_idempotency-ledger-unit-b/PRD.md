---
task: idempotency ledger interlock for irreversible venture actions
slug: 20260606-075641_idempotency-ledger-unit-b
effort: standard
phase: complete
progress: 18/18
mode: interactive
started: 2026-06-06T02:26:41Z
updated: 2026-06-06T02:29:00Z
---

## Context

Unit B of Phase 0 (je-ne-sais-quoi taste engine). The autonomous venture loop retries
failed steps via bounded self-heal. Retrying an *irreversible* action (cold outreach email,
deploy) must NOT fire twice. This ledger is the interlock: every irreversible action gets a
deterministic key; the executor checks "did I already fire this?" before doing it. Sits at the
gate/execute boundary; later phases wrap every external action in `once(...)`.

Requested: `taste/scripts/lib/idempotency.mjs` (TDD) exporting `actionKey(type,payload)`,
`async once(key,fn,{store})`, and a default durable JSONL store at `taste/feedback/idempotency.jsonl`,
with an injectable store interface `{ has, get, put }` (in-memory for tests, KV-swappable later).
Zero-dep Node ESM, Node v26, built-ins only. Commit with Co-Authored-By trailer; do NOT commit the
data file (already covered by `.gitignore` line 16: `taste/feedback/*.jsonl`).

NOT requested: TTL/eviction/compaction, file locking, a real KV impl now, changes to `.gitignore`
or sibling modules.

## Criteria

actionKey:
- [x] ISC-1: actionKey returns a 64-char lowercase sha256 hex string
- [x] ISC-2: actionKey is deterministic for identical (type, payload)
- [x] ISC-3: actionKey differs for different payloads (same type)
- [x] ISC-4: actionKey differs for different types (same payload)
- [x] ISC-5: actionKey is key-order independent ({a:1,b:2}==={b:2,a:1})
- [x] ISC-6: actionKey uses node:crypto (no third-party hash dep)

once:
- [x] ISC-7: once calls fn exactly once on first invocation
- [x] ISC-8: once returns fn's result on first invocation
- [x] ISC-9: second once(sameKey) returns the FIRST cached result
- [x] ISC-10: second once(sameKey) does NOT call fn2 (spy counter unchanged)
- [x] ISC-11: distinct keys each invoke their own fn (both run)
- [x] ISC-12: when fn throws, the error propagates to the caller
- [x] ISC-13: when fn throws, the key is NOT recorded
- [x] ISC-14: after a throw, once(sameKey, okFn) DOES run okFn

store + durability:
- [x] ISC-15: default store is the JSONL-backed store at taste/feedback/idempotency.jsonl
- [x] ISC-16: store exposes the {has, get, put} interface (injectable)
- [x] ISC-17: an in-memory store can be injected into once for tests
- [x] ISC-18: fresh JSONL store on same file sees prior record (has(key)===true)

process + hygiene:
- [x] ISC-A1: taste/feedback/idempotency.jsonl is NOT staged/committed
- [x] ISC-A2: .gitignore is not modified by this change
- [x] ISC-A3: sibling lib modules and their tests still pass unchanged

## Decisions

- **Record only after fn resolves.** `once` calls `fn()` then `store.put(...)`; if `fn` throws, control
  never reaches `put`, so the key is not recorded — a genuine failure stays retryable (ISC-13/14).
- **`has()` is the gate, not `get()`.** A recorded action whose result is `undefined`/`null` must still
  short-circuit; gating on `get()` truthiness would wrongly re-run it. So `once` branches on `store.has(key)`.
- **Recursive key sorting in stableStringify.** Sorting only top-level keys leaks nested key order into the
  hash. Canonicalize recursively (objects sorted, arrays/primitives passed through) so `actionKey` is truly
  order-independent at any depth (ISC-5).
- **JSONL store loads on construction.** `makeJsonlStore(file)` reads the existing file into an in-memory Map
  when created. This is both the single-process cache AND the cross-process durability mechanism: a fresh
  store instance in a new process reconstructs state from the file (ISC-18). `put` appends one line and updates
  the map (append-only; no rewrite, no locking — slice-1).
- **Default store is lazy.** `defaultStore` is created on first access via a getter, so merely importing the
  module never touches the filesystem (keeps tests that inject their own store fully isolated).
- **Store factories, not classes.** Matches the `makeGovernor(...)` factory convention in this lib; the
  `{ has, get, put }` shape is the swap seam for a future Cloudflare KV store.

## Verification

- **Test suite (GREEN):** `node --test taste/scripts/lib/idempotency.test.mjs` → 14 tests, 14 pass, 0 fail
  (exit 0). RED was confirmed first: before `idempotency.mjs` existed the run failed with
  `ERR_MODULE_NOT_FOUND` for that module (right reason — feature missing). Covers ISC-1..18.
- **ISC-1 hex format:** `assert.match(k, /^[0-9a-f]{64}$/)` passes.
- **ISC-5 order-independence:** both top-level `{a:1,b:2}==={b:2,a:1}` and the NESTED
  `{headers:{x,y}}` case pass (recursive `canonicalize`).
- **ISC-6 node:crypto:** module imports `createHash` from `node:crypto`; no third-party hash. Verified by grep.
- **ISC-10 no-fn2:** spy counter `calls2 === 0` after the second `once(sameKey)`.
- **ISC-13/14 throw → unrecorded → retryable:** after a sync throw AND an async reject, `store.has('k')===false`;
  a subsequent `once('k', okFn)` runs (`okCalls===1`).
- **ISC-17 injectable in-mem:** every `once` test injects `makeMemoryStore()`.
- **ISC-18 cross-process durability:** a FRESH `makeJsonlStore(file)` on the same tmp file sees the prior
  record (`has===true`, `get` deep-equals); on-disk JSONL has one `{key,result,ts}` line. End-to-end:
  a fresh-store `once(sameKey)` returned the cached first result and suppressed the second send (`sends===1`).
- **ISC-A1 data file uncommitted:** `taste/feedback/` is empty after the run (tests used `os.tmpdir()`, never
  the default ledger — proves the lazy default-store). `git status --porcelain taste/` shows only the two new
  `idempotency.{mjs,test.mjs}` files.
- **ISC-A2 .gitignore untouched + coverage:** `git check-ignore -v taste/feedback/idempotency.jsonl` →
  matched by `.gitignore:16: taste/feedback/*.jsonl`. `.gitignore` not in the diff.
- **ISC-A3 siblings pass:** `node --test governor.test.mjs router.test.mjs` → 16 tests, 16 pass, 0 fail (exit 0).
- **/simplify review (4 angles, direct):** reuse — no existing helper duplicated; simplification — store factories
  intentionally not DRY'd (KV divergence seam); altitude — gate is the injectable store, not email/deploy special
  cases. One efficiency nit (`mkdirSync` per `put`) consciously skipped: a single idempotent syscall on a cold
  path. No fixes needed; tests re-run GREEN after review.
- **Capability invocation check:** `superpowers:test-driven-development` invoked via `Skill` (drove RED→GREEN);
  `simplify` invoked via `Skill` (review executed directly — Task-agent fan-out unavailable at subagent depth,
  so the four angles were applied inline). Both selected capabilities were actually invoked.

