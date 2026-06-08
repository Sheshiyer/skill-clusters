---
task: Zero-dep on-disk store for noesis/design-memory persistence
slug: 20260607-120400_store-fs-ondisk-persistence
effort: advanced
phase: verify
progress: 27/27
mode: interactive
started: 2026-06-07T12:04:00+0530
updated: 2026-06-07T12:04:15+0530
---

## Context

The `noesis` and `design-memory` modules store records in-memory only (a `Map` per
namespace/brand), so records vanish when the process exits. This task adds a zero-dependency
on-disk store, `makeFileStore(filePath)`, that is a DROP-IN replacement for `makeMemoryStore`
— same `{ get(key) -> rows[], set(key, rows) }` seam — backed by a JSON file so records
persist across processes.

**Discovered interface (read from source, not guessed):** `makeMemoryStore()` in
`taste/scripts/lib/design-memory.mjs` returns exactly two methods:
- `get(key) -> rows[]` — the stored array for `key`, or `[]` when the key is unknown.
- `set(key, rows) -> void` — stores `rows` under `key`.
`rows` are `{ id, vector, meta }`. The same factory is re-exported and reused by
`noesis.mjs` (one store per namespace via the `stores` map). The mutation contract used by
`makeDesignMemory.add` / `makeNoesis.add` is read-then-write: `rows = get(k); rows.push(x); set(k, rows)`.
`noesis.stats()` additionally calls `get(ns).length` as a pure read.

**Requested:** the two files below, tests-first (RED→GREEN), zero deps, atomic writes.
**NOT requested:** editing any other file, committing, async APIs, file locking, future-proofing.

### Design

Mirror the `makeJsonlStore` pattern already in `idempotency.mjs` (in-memory Map cache + file
durability) but honor the design-memory seam shape (`get`/`set`, not `has`/`get`/`put`). On
construction, `JSON.parse` the file (a `{ [key]: rows[] }` object) into a `Map`; if the file is
absent, start empty. `get` returns the live array from the Map (so the read-then-write push
contract works). `set` updates the Map then persists the WHOLE map to disk atomically:
`mkdirSync(dirname, {recursive})`, write JSON to a temp file in the same dir, `renameSync` over
the target (same-filesystem atomic replace).

### Plan

1. RED: write `store-fs.test.mjs` exercising parity, persistence round-trip, both integrations,
   atomicity (no temp leftover), and edge cases. Run — watch every test fail (module missing).
2. GREEN: write minimal `store-fs.mjs` implementing `makeFileStore`. Re-run — all green.
3. VERIFY: full `node --test` on the file; confirm no other file changed; confirm not committed.

### Risks

- `get` must return the LIVE array the Map holds so the caller's `get→push→set` contract
  persists the pushed element. Map-mirror design returns the same array `set` stored. Mitigated.
- Atomic write: temp file must live in the SAME dir as the target so `renameSync` is a
  same-filesystem (atomic) replace, not a cross-device copy. Mitigated by `path.dirname(target)`.
- Temp-name collision: use a unique suffix (`pid.counter.random.tmp`) so concurrent sets and
  crashed-run leftovers don't clobber; tests assert zero `*.tmp` siblings remain after set.
- `JSON.parse('')` on an empty/torn file throws. Guard: empty/whitespace file → start empty
  (tolerant, mirrors makeJsonlStore's torn-line tolerance). Within "load if file exists".
- Rows are `{id, vector(number[]), meta(object)}` — fully JSON-safe; no Date/undefined/function
  in the documented shape, so round-trip is lossless.

## Criteria

Interface parity (drop-in for makeMemoryStore):
- [x] ISC-1: makeFileStore is exported as a named function from store-fs.mjs
- [x] ISC-2: makeFileStore(path) returns an object exposing a get method
- [x] ISC-3: makeFileStore(path) returns an object exposing a set method
- [x] ISC-4: get(key) returns [] for an unknown key
- [x] ISC-5: set(key, rows) then get(key) returns those rows
- [x] ISC-6: get returns the live array so push-then-set mutation contract works
- [x] ISC-7: distinct keys are isolated from each other
- [x] ISC-8: get(key).length works as a pure read (noesis.stats path)

Construction / file loading:
- [x] ISC-9: constructing on a non-existent file starts empty, throws nothing
- [x] ISC-10: constructing on an existing JSON file loads its records
- [x] ISC-11: constructing creates parent dirs lazily, not on mere construction

Atomic persistence:
- [x] ISC-12: set creates the target file on disk
- [x] ISC-13: set writes via a temp file then renameSync over the target
- [x] ISC-14: set calls mkdirSync recursive before writing
- [x] ISC-15: no temp file is left behind in the dir after set
- [x] ISC-16: on-disk JSON parses back to the same records that were set

Persistence round-trip (cross-process durability):
- [x] ISC-17: a second makeFileStore on the same path sees the first instance records
- [x] ISC-18: the second instance get returns rows equal to what the first set

Parity vs in-memory makeMemoryStore:
- [x] ISC-19: same op sequence yields identical get results for file vs memory store
- [x] ISC-20: unknown-key [] behavior matches makeMemoryStore exactly

design-memory integration:
- [x] ISC-21: makeDesignMemory({store: fileStore}) add then query finds the record
- [x] ISC-22: a fresh fileStore+memory on same path recalls the added record via query
- [x] ISC-23: design-memory all(brand) returns persisted rows after reload

noesis integration:
- [x] ISC-24: makeNoesis({stores}) add then query finds the record in a namespace
- [x] ISC-25: a fresh store+noesis on same path recalls the record via queryAll
- [x] ISC-26: noesis stats() reflects persisted counts after reload

Suite / hygiene:
- [x] ISC-27: node --test on store-fs.test.mjs is fully green, tmp files cleaned up

### Anti-criteria
- [x] ISC-A1: no file outside store-fs.mjs / store-fs.test.mjs is modified
- [x] ISC-A2: no non-builtin import appears in either file
- [x] ISC-A3: nothing is committed

## Decisions

- **Seam shape**: implement `{ get, set }` (design-memory seam), NOT `{ has, get, put }`
  (idempotency seam). Verified against source: `makeDesignMemory`/`makeNoesis` only ever call
  `get` and `set`.
- **In-memory Map mirror + file durability** (mirrors `makeJsonlStore` in `idempotency.mjs`):
  `get` returns the live array from the Map so the caller's `get→push→set` contract persists the
  pushed element; `set` updates the Map then atomically rewrites the WHOLE file.
- **On-disk format**: a single JSON object `{ [key]: rows[] }` — minimal, human-diffable,
  parses straight back into the Map.
- **Atomic write**: `mkdirSync(dir,{recursive})` → write to a uniquely-named `*.tmp` IN THE SAME
  DIR → `renameSync` over the target (same-filesystem atomic replace). Unique temp name =
  `<base>.<pid>.<counter>.<rand>.tmp` to avoid clobber from concurrent sets / crashed runs.
- **Tolerant load**: empty/whitespace/torn file → start empty rather than throw on `JSON.parse('')`
  (mirrors makeJsonlStore's torn-line tolerance; stays within "load if file exists").
- **Lazy FS**: construction never touches disk beyond an existence check + read; dirs/files are
  created only on first `set`. RED test ISC-11 enforces this.

### RED evidence
`node --test store-fs.test.mjs` before implementation → `ERR_MODULE_NOT_FOUND` for store-fs.mjs,
pass 0 / fail 1 (suite fails to import the missing module). Correct expected failure.

## Verification

(populated during VERIFY)
