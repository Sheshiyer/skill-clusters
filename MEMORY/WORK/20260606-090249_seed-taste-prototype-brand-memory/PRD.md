---
task: Seed HDILINT taste prototype from canonical brand-spec
slug: 20260606-090249_seed-taste-prototype-brand-memory
effort: extended
phase: complete
progress: 22/22
mode: interactive
started: 2026-06-06T03:32:49Z
updated: 2026-06-06T03:38:00Z
---

## Context

**Task 7 of the HDILINT live-slice plan** (`docs/plans/2026-06-06-hdilint-slice-plan.md`): seed the taste engine's brand-DNA prototype for HDILINT/Fitcheck, then verify on-brand retrieval. This is the *buildable half* — the founder gate (brand approval) is the live half and is out of scope.

**The gap this closes:** `taste/scripts/bootstrap-brand.mjs` was built during the taste engine's P3, *before* the canonical brand-spec schema (Task 5) and emitter (Task 6) existed. It therefore composes brand-DNA from loose markdown (`--docs`) + site tech-stacks (`--sites`) with a regex tone-scan — it does **not** consume `brand-spec.json`. The validated contract (tagline, positioning, voice tone tokens, visual palette/type/motion/imagery, persona, taste_seed) is exactly the structured DNA the prototype should be grounded in. Task 7 wires `--spec` into `bootstrap-brand.mjs` so the prototype is grounded in the contract, runs it for HDILINT → `taste/brands/hdilint.json`, and verifies `taste-resolve` returns brand-biased exemplars.

**Inputs that exist:** `HDILINT/brand-spec.json` (validated, 2183 B), `taste/corpus/taste-corpus.jsonl` (embedded Codrops corpus, 201 assets), `taste/scripts/taste-resolve.mjs` (cosine recall + brand re-rank). NIM is live (Ollama+NIM router landed last commit). `taste/brands/` already holds one prior prototype (`tryambakam-noesis.json`).

**Approach:** extract a pure, NIM-free `composeBrandDNA({ docText, techniques, spec })` from `bootstrap-brand.mjs` so the spec-folding logic is unit-testable; TDD that function (RED→GREEN); add the `--spec` flag; keep the no-spec path backward-compatible; run live for hdilint; verify via taste-resolve; commit.

### Risks
- **Backward-compat break (ISC-2):** refactoring `composeBrandDNA` out could alter the no-spec `brandText`. Mitigation: keep the no-spec branch byte-identical; spec content is purely additive.
- **NIM unavailable:** embedding the DNA needs a live key. `bootstrap-brand` already guards `nim.hasKey()` and exits cleanly; confirm NIM embed works before the live run.
- **Malformed/missing `--spec` (ISC-3):** crash on `JSON.parse`. Mitigation: try/catch with a clear one-line error.
- **Chunk-window truncation:** `brandText` is chunked (12×800 chars) before embedding. Mitigation: place high-signal spec tokens (tagline, tone, palette, taste_seed) FIRST so they dominate the centroid.
- **Old regex tone-scan yields empty for Fitcheck:** the TONES list (`mystical/esoteric/...`) won't match `direct/confident/pragmatic` — this is *why* the spec wiring matters; `rules.tone` must come from `voice_tokens.tone`, not the docs scan.
- **Resolve falls back to request-only:** if `hdilint.json` is absent, `brand_fit`=0 (ISC-20 fails). Mitigation: write the prototype before resolving.

## Criteria

**CLI / flag handling**
- [x] ISC-1: `bootstrap-brand.mjs` accepts a `--spec <path>` flag
- [x] ISC-2: with no `--spec`, the docs+sites composition is byte-for-byte unchanged (backward-compatible)
- [x] ISC-3: a `--spec` path that is missing or invalid JSON fails with a clear message, not a stack-trace crash

**Spec → brand-DNA composition (pure, NIM-free)**
- [x] ISC-4: `composeBrandDNA` is an exported pure function taking `{docText, techniques, spec}`
- [x] ISC-5: composed DNA text includes the spec's brand tagline
- [x] ISC-6: composed DNA text includes the spec's positioning statement
- [x] ISC-7: composed DNA text includes the spec's voice tone tokens
- [x] ISC-8: composed DNA text includes the spec's visual palette hex values
- [x] ISC-9: composed DNA text includes the spec's taste_seed
- [x] ISC-10: output `rules.tone` is sourced from `voice_tokens` when a spec is provided
- [x] ISC-11: output `rules.palette` is populated from `visual_tokens.palette`

**Test (TDD)**
- [x] ISC-12: `bootstrap-brand.test.mjs` exists and exercises `composeBrandDNA`
- [x] ISC-13: a test asserts spec tokens (tagline + tone + palette) appear in the composed DNA
- [x] ISC-14: a test asserts the no-spec path omits spec-only content (backward-compat)
- [x] ISC-15: `node --test taste/scripts/bootstrap-brand.test.mjs` passes every case (4/4)

**Live run (NIM)**
- [x] ISC-16: running with `--spec` writes `taste/brands/hdilint.json`
- [x] ISC-17: `hdilint.json` prototype vector has dimension 1024
- [x] ISC-18: `hdilint.json` `rules.tone` reflects Fitcheck voice (direct/confident/pragmatic)

**Verify (taste-resolve)**
- [x] ISC-19: `taste-resolve "hero for a virtual try-on plugin" --brand hdilint --json` returns K≥3 exemplars
- [x] ISC-20: each exemplar carries a `brand_fit` score (brand bias is active, not request-only)
- [x] ISC-21: the emitted directive references hdilint's DNA (tone or techniques)

**Commit**
- [x] ISC-22: `bootstrap-brand.mjs` + test committed; `brands/hdilint.json` handled per the repo's gitignore policy (not force-committed)

**Anti-criteria**
- [x] ISC-A1: no HDILINT-repo artifacts committed into skill-clusters
- [x] ISC-A2: no secret values printed (names/lengths/prefixes only)
- [x] ISC-A3: the existing `tryambakam-noesis` prototype is left untouched

## Verification

| Evidence | Result |
|---|---|
| `node --test bootstrap-brand.test.mjs` | 4/4 pass (composeBrandDNA spec-fold + backward-compat) |
| Full taste suite (7 files) | **51/51 pass, 0 fail** — no regressions |
| Live `bootstrap-brand --brand hdilint --spec …` | `(spec-grounded)`, embedded 5 chunks, wrote `taste/brands/hdilint.json` dim **1024**, tone `direct, confident, pragmatic, fast-moving, proof-seeking` (from `voice_tokens`, not the empty regex scan) |
| `taste-resolve "hero for a virtual try-on plugin" --brand hdilint --json` | 5 exemplars, every one has `brand_fit`, directive: *"Make it feel **Dark Minimalism** … Conform to hdilint's DNA (direct, confident, pragmatic, …)"* |
| Bad `--spec` (missing / invalid JSON) | clear one-line error, exit **2** (no stack trace) |
| `git check-ignore taste/brands/hdilint.json` | ignored ✓; commit `df01db9` holds only `bootstrap-brand.mjs` + test |
| `taste/brands/` mtimes | `tryambakam-noesis.json` 06:32 (untouched), `hdilint.json` 09:09 (new) |

**Capability invocation check:** all three selected capabilities were invoked via `Skill` tool — `superpowers:executing-plans` (BUILD), `superpowers:test-driven-development` (BUILD, RED→GREEN watched), `superpowers:verification-before-completion` (VERIFY). No phantom capabilities.
