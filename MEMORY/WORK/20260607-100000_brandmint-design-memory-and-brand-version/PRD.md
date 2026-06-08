---
task: Build brandmint design-memory and brand-version modules TDD
slug: 20260607-100000_brandmint-design-memory-and-brand-version
effort: extended
phase: complete
progress: 22/22
mode: interactive
started: 2026-06-07T10:00:00-07:00
updated: 2026-06-07T10:00:00-07:00
---

## Context

Build two zero-dependency Node ESM (.mjs) brandmint modules under `taste/scripts/`,
TDD, pure logic with injectable I/O. **No git commit/push.**

**#31 — `taste/scripts/lib/design-memory.mjs`**: a per-brand 1024-dim visual-DNA store —
the local, federated precursor to noesis (#24), sharing the same cosine space as the taste
corpus. PURE + injectable store (no live NIM; vectors are passed in).
`makeDesignMemory({ store })` → `{ add(brand,id,vector,meta), query(brand,vector,k=5), all(brand) }`.
`add` namespaces by brand; `query` returns top-k by cosine within that brand as
`[{ id, score, meta }]`. Default store = in-memory Map; injectable (JSONL/KV later). Cosine is pure.
Header must note convergence into noesis (#24): three brand/taste/knowledge memories → one Vectorize cortex.

**#33 — `taste/scripts/brand-version.mjs`**: brand-spec versioning + diffing.
`versionOf(spec)` → short stable content hash (sha256 of canonicalized spec, first 12 chars), deterministic.
`diffSpecs(a, b)` → `{ changed:[{path,from,to}], added:[path], removed:[path] }` walking
identity/positioning/voice_tokens/visual_tokens/persona/taste_seed. Pure.
CLI (isMain-guarded): `node taste/scripts/brand-version.mjs <specA.json> [specB.json]` →
prints version of A, or (with B) a human-readable diff. exit 2 on usage error.

Conventions sourced from: `lib/idempotency.mjs` (canonicalize/stableStringify, sha256, store seam),
`lib/nim.mjs` (1024-dim embeddings, cosine usage), `emit-brand-spec.mjs` (CLI guard
`import.meta.url === file://${process.argv[1]}`, exit 2 usage), `lib/idempotency.test.mjs`
(`node:test` + `assert` idioms). Real spec: `../HDILINT/brand-spec.json` (fitcheck).

Requested: the two modules + two test suites passing under `node --test`; a sample `diffSpecs`
output from a mutated copy of HDILINT's spec. NOT requested: git operations, live NIM in design-memory,
any third-party dependency.

### Risks
- Cosine on zero-magnitude vectors → division by zero (must guard, return 0).
- `versionOf` must be invariant to key insertion order → reuse canonicalize before hashing.
- `diffSpecs` must NOT mutate inputs → deep-read only, no in-place sort/assign on args.
- Path naming in diff must be stable + readable (dotted: `identity.tagline`, `visual_tokens.palette[0]`).
- Added/removed detection must distinguish a key being absent vs present-with-undefined.

### Plan
TDD per module: write the test suite first (RED), run `node --test` to confirm failure,
implement the module (GREEN), re-run to confirm pass. design-memory reuses a pure cosine;
brand-version reuses the canonicalize→sha256 pattern from idempotency. CLI guard mirrors
emit-brand-spec. Then mutate a copy of the HDILINT spec and run the CLI to show a real diff.

## Criteria

design-memory (#31):
- [x] ISC-1: design-memory.mjs exports makeDesignMemory factory function
- [x] ISC-2: makeDesignMemory defaults store to an in-memory Map
- [x] ISC-3: add(brand,id,vector,meta) namespaces vectors by brand
- [x] ISC-4: query returns top-k ranked by cosine descending
- [x] ISC-5: query result items have shape { id, score, meta }
- [x] ISC-6: query of a different brand is isolated from brand x
- [x] ISC-7: query of an empty/unknown brand returns []
- [x] ISC-8: cosine is pure and guards zero-magnitude vectors
- [x] ISC-9: header comment notes convergence into noesis (#24)
- [x] ISC-10: store is injectable (custom store object honored)

brand-version (#33):
- [x] ISC-11: versionOf returns a 12-char hex content hash
- [x] ISC-12: versionOf is stable for the same spec (order-invariant)
- [x] ISC-13: versionOf changes when any field changes
- [x] ISC-14: diffSpecs detects a changed tagline as { path, from, to }
- [x] ISC-15: diffSpecs detects a changed palette entry
- [x] ISC-16: diffSpecs reports an added field path
- [x] ISC-17: diffSpecs reports a removed field path
- [x] ISC-18: diffSpecs leaves both input specs untouched (pure)
- [x] ISC-19: CLI prints version for one arg, diff for two; exit 2 on no args
- [x] ISC-20: both test suites pass under `node --test`
- [x] ISC-21: query with k greater than stored count returns all, no holes
- [x] ISC-22: diffSpecs recurses nested objects and arrays with dotted paths

## Decisions

- **/simplify outcome**: applied one efficiency fix — `diffSpecs`' leaf comparison now fast-paths
  primitives via `Object.is` and only canonical-stringifies when a side is a container, avoiding two
  JSON allocations per scalar leaf. Kept the deliberate `canonicalize`/`stableStringify` duplication
  from idempotency.mjs (documented self-containment choice). Altitude confirmed: diff recurses
  generically, not per-section.
- **Store seam shape** = `{ get(brand) -> rows[], set(brand, rows) }`, in-memory Map default,
  mirroring idempotency.mjs's injectable seam spirit (there `{has,get,put}`). A JSONL/KV store
  can implement the same two methods later. `rows` are `{ id, vector, meta }`.
- **Cosine** re-implemented locally in design-memory (pure, ~10 lines), not imported from nim.mjs
  (nim.mjs has no exported cosine and importing it triggers load-env side effects). Guards
  zero-magnitude and unequal length → returns 0.
- **versionOf** re-implements stableStringify (canonicalize keys at every depth) + sha256 locally
  rather than importing from idempotency.mjs — keeps brand-version a self-contained, single-purpose
  module with no cross-lib coupling. First 12 hex chars of the digest.
- **diffSpecs scope**: only the 6 sections identity/positioning/voice_tokens/visual_tokens/persona/
  taste_seed are walked (the brand-truth surface); top-level `brand` slug and `assets` are out of
  scope per the task's named field list. Recurses generically with dotted (`a.b`) + bracketed
  (`arr[0]`) paths so nested palette/type changes are caught.
- **CLI guard** = `import.meta.url === \`file://${process.argv[1]}\`` (emit-brand-spec style); exit 2
  on usage error, mirroring the repo convention.

## Verification

- **28/28 tests pass** under `node --test` (14 design-memory + 14 brand-version), run individually
  and together. ISC-20 ✓.
- **Zero-dep confirmed**: `design-memory.mjs` has no imports; `brand-version.mjs` imports only
  `node:crypto` + `node:fs`. Importing design-memory is side-effect-free (no env/FS).
- **design-memory** ISC-1..10,21: query ranks `[a, c, b]` by cosine; shape `{id,score,meta}`; brand y
  isolated from x; unknown brand → []; zero-vector → score 0 (not NaN); custom `{get,set}` store
  honored; k=99 over 2 rows → 2 rows. All ✓.
- **brand-version** ISC-11..19,22: version `/^[0-9a-f]{12}$/`, stable + order-invariant, changes on
  tagline/palette edits; diff finds `identity.tagline` + `visual_tokens.palette[0]` (changed),
  added/removed paths incl. array indices; inputs byte-identical after diff (pure); brand+assets
  ignored. CLI: 1 arg → version, 2 args → diff, exit 2 on no-args/missing-file/bad-json. All ✓.
- **Real-spec demo** (CLI vs canonical `../HDILINT/brand-spec.json` → mutated copy):
  `99f09665df9d → e59f1bc33f95`, changed `identity.tagline` + `visual_tokens.palette[0]`,
  added `voice_tokens.vocabulary[0]` + `taste_seed.references[0]`, removed `positioning.target_market`.
- **Capabilities invoked**: `Skill(test-driven-development)` (BUILD), `Skill(simplify)` (VERIFY-prep) —
  both real tool calls, no phantoms.
