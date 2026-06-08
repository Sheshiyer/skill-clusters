---
task: TDD zero-dep kit-register module into noesis + design-memory
slug: 20260607-102137_kit-register-noesis-design-memory
effort: standard
phase: complete
progress: 12/12
mode: interactive
started: 2026-06-07T10:21:37+0530
updated: 2026-06-07T10:32:00+0530
---

## Context

Build one zero-dependency Node module, `taste/scripts/kit-register.mjs`, that registers a brand
kit (a 1024-dim prototype embedding + metadata) into the two EXISTING local vector memories:

- `taste/scripts/lib/noesis.mjs` — `makeNoesis({stores})`, federated cortex with a `brand` namespace.
  add signature: `add(namespace, id, vector, meta={}) -> { id }`.
  query signature: `query(namespace, vector, k=5) -> [{ id, score, meta, namespace }]`.
  also `queryAll(vector, k=5)` and `stats()`. NAMESPACES = ['taste','brand','knowledge'].
- `taste/scripts/lib/design-memory.mjs` — `makeDesignMemory({store})`, per-brand visual-DNA store.
  add signature: `add(brand, id, vector, meta={}) -> { id }`.
  query signature: `query(brand, vector, k=5) -> [{ id, score, meta }]`. also `all(brand)`.
  exports `cosine`, `makeMemoryStore`.

Both stores require the caller to PASS IN an id (they do not generate one) and return only `{ id }`.
So kit-register synthesizes a stable id `${brand}:${version}` when none exists.

Strict TDD: tests written first and observed FAILING before any implementation, then minimal code to green.

Requested:
- `export function registerKit({ brand, version, embedding, meta = {}, noesis, designMemory }) -> { noesisId, designMemoryId }`.
- Adds the embedding + `{ brand, version, kind: 'brand-kit', ...meta }` into noesis `brand` namespace and design-memory under `brand`.
- CLI main(): `node taste/scripts/kit-register.mjs <prototype.json> <kitDir>` — reads prototype (.prototype, .brand), version from `<kitDir>/version.txt` (else 'unknown'), registers, demonstrates recall from both stores, prints confirmation, exit 2 on usage/parse errors.
- Tests use REAL noesis + design-memory instances (not mocks).

NOT requested / out of scope:
- No third-party dependencies (node: builtins only).
- No edits to any file outside kit-register.mjs / kit-register.test.mjs (import from existing modules; do not modify them).
- No commit.
- No mocks in the test.

### Risks
- Wrong add/query arg order — mitigated by reading both modules' exact signatures first (done).
- Stores return only `{ id }`, no auto-id — mitigated by synthesizing `${brand}:${version}`.
- CLI test could pollute repo or require network — mitigated: CLI is fully local/offline; tests of CLI (if any) use a temp dir under node:os.tmpdir().

## Criteria

- [x] ISC-1: kit-register.test.mjs exists and is written before kit-register.mjs
- [x] ISC-2: Test run observed FAILING before implementation exists (red phase)
- [x] ISC-3: registerKit exported with signature { brand, version, embedding, meta, noesis, designMemory }
- [x] ISC-4: registerKit returns object with noesisId and designMemoryId keys
- [x] ISC-5: registerKit adds record into noesis 'brand' namespace with the embedding
- [x] ISC-6: registerKit adds record into design-memory under the brand with the embedding
- [x] ISC-7: stored meta contains brand, version, and kind 'brand-kit'
- [x] ISC-8: noesis query of 'brand' namespace with embedding recalls the record as top hit
- [x] ISC-9: design-memory query for the brand returns the record
- [x] ISC-10: kit-register.mjs has zero non-node imports (only the two local lib modules)
- [x] ISC-11: CLI main() reads prototype.json, version.txt, registers, prints recall confirmation
- [x] ISC-12: node --test kit-register.test.mjs reports all pass, zero fail

## Decisions

- Stable id = `${brand}:${version}` since both stores require a caller-supplied id and return only `{ id }`. Re-registering the same brand+version targets the same logical record.
- Authoritative meta `{ brand, version, kind: 'brand-kit' }` applied AFTER `...meta` so callers can enrich but never spoof those three fields.
- noesis.add signature is `(namespace, id, vector, meta)`; design-memory.add is `(brand, id, vector, meta)` — both confirmed by reading source before writing.
- CLI uses a FRESH makeNoesis()/makeDesignMemory() per invocation (stateless demo of register+recall); persistence is the store seam's job, out of scope here.
- /simplify: the 4 parallel review agents require the Task tool, unavailable to a subagent. Applied the four lenses (reuse/simplify/efficiency/altitude) directly instead — code confirmed clean, no fixes needed.

## Verification

- RED (pre-impl): `node --test taste/scripts/kit-register.test.mjs` → ERR_MODULE_NOT_FOUND for kit-register.mjs, tests 1 / pass 0 / fail 1. Failure is the missing feature, not a typo.
- GREEN (final): `node --test taste/scripts/kit-register.test.mjs` → tests 5, pass 5, fail 0, node exit 0. Pristine (only shell zoxide stderr noise, not from node).
- CLI against real taste/brands/hdilint.json (1024-dim prototype): registered hdilint:v2.1.0 into both stores, recall score 1.0000 from noesis[brand] and design-memory, census {"taste":0,"brand":1,"knowledge":0}.
- CLI version.txt read → v2.1.0; missing version.txt → 'unknown'.
- CLI exit codes: no-args=2, one-arg=2, missing-file=2, bad-json=2, no-.prototype=2, no-.brand=2, success=0.
- Zero-dep: imports are node:fs, node:path, node:url + ./lib/noesis.mjs + ./lib/design-memory.mjs. No bare-specifier (npm) imports.
- Isolation: `git diff --stat` on noesis.mjs/design-memory.mjs is empty (unchanged). HEAD unchanged (no commit). Only new untracked files from this task: taste/scripts/kit-register.mjs, taste/scripts/kit-register.test.mjs (+ PRD work dir).
