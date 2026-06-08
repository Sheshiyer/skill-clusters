---
task: Merge PR 98, wire reroll into runBrandKit
slug: 20260607-073000_merge-98-wire-reroll-into-flow
effort: advanced
phase: complete
progress: 27/27
mode: interactive
started: 2026-06-07T07:30:00-07:00
updated: 2026-06-07T07:30:00-07:00
---

## Context

User picked two follow-ups: (1) **merge PR #98** to main (a complete, 267-test brand-genesis organ — merging also lands `kit-register.mjs` on main, fully unblocking the cloud session that's writing its CLI tests), and (2) **wire the auto-reroll loop into `runBrandKit`** so the MAIN flow can optionally self-correct every render, not just the standalone `brandmint-reroll` CLI.

Verified: #98 is OPEN/MERGEABLE/CLEAN; kit-register + the synthetic fixture are on `feat` and `claude/festive-allen-mhYRX`.

**Design — backward-compatible wiring:** `runBrandKit({…, reroll = null})`. When `reroll` is null → existing single-generation path (untouched → the existing brandmint.test.mjs stays green). When `reroll = { scoreImage, scoreOf, threshold, maxAttempts }` → the image step delegates to `rerollImages` (from `./lib/reroll.mjs`), and each imageArtifact carries `{attempts, bestScore, onBrand}`. The CLI gains `--reroll [--threshold N --max-attempts N --metric coverage|accentPresence]`, wiring a real `scoreImage` (read PNG → `decodePng` → `scorePalette` vs the spec palette).

Not requested: new spend (tests use fakes; a real demo is optional), breaking the existing flow API.

## Criteria

### Merge PR #98
- [x] ISC-1: PR #98 is merged (state MERGED)
- [x] ISC-2: origin/main contains taste/scripts/kit-register.mjs (cloud session unblocked)
- [x] ISC-3: origin/main contains brandmint.mjs + lib/reroll.mjs (the organ landed)
- [x] ISC-4: the full taste suite is green on the merged main

### Wire reroll into runBrandKit (backward-compatible)
- [x] ISC-5: runBrandKit accepts an optional `reroll` parameter
- [x] ISC-6: reroll=null preserves the existing single-generation behavior
- [x] ISC-7: the existing brandmint.test.mjs stays green (no regression)
- [x] ISC-8: with reroll set, runBrandKit routes the image step through rerollImages
- [x] ISC-9: reroll-enabled imageArtifacts carry attempts + bestScore + onBrand
- [x] ISC-10: runBrandKit imports rerollImages from ./lib/reroll.mjs
- [x] ISC-11: the reroll path calls the injected scoreImage per render
- [x] ISC-12: a below-threshold render is regenerated (honours maxAttempts)
- [x] ISC-13: the best-scoring attempt is kept
- [x] ISC-14: a new test covers the reroll-enabled runBrandKit path
- [x] ISC-15: text-artifact writing is unchanged when reroll is enabled
- [x] ISC-16: the manifest still returns brand/version/textArtifacts/imageArtifacts

### CLI
- [x] ISC-17: brandmint.mjs CLI accepts a --reroll flag
- [x] ISC-18: the CLI accepts --threshold, --max-attempts, --metric
- [x] ISC-19: --reroll wires a real scoreImage (decode + scorePalette)
- [x] ISC-20: the CLI without --reroll behaves exactly as before
- [x] ISC-21: the CLI runs on the real spec without throwing (smoke)

### Verify / ship
- [x] ISC-22: the full taste suite is green after the change
- [x] ISC-23: the reroll-wiring is pushed on a new branch + a PR opened
- [x] ISC-24: the change is additive — the existing runBrandKit API is intact

### Anti-criteria
- [x] ISC-A1: the 267 existing tests are neither reduced nor broken
- [x] ISC-A2: no new spend (tests use fakes; the real demo is optional)
- [x] ISC-A3: no secret/vault-path leak into the public repo

## Decisions
- Merge first (lands the organ + unblocks the cloud session), then wire reroll on a fresh branch from the merged main → a clean second PR.
- `reroll` defaults to null so the change is purely additive and the locked brandmint.test.mjs contract holds.

## Verification

**Merge:** PR #98 → `MERGED` @ 2026-06-07T07:03:21Z; `origin/main` now contains kit-register.mjs, brandmint.mjs, lib/reroll.mjs, the synthetic fixture (verified via `git cat-file`). Cloud session unblocked (kit-register on main).

**Reroll wiring (fresh evidence):**
- RED→GREEN: new `brandmint-reroll-flow.test.mjs` failed 3/5 (feature missing) → after wiring, 19/19 (5 reroll-flow + 14 existing brandmint, untouched).
- Full taste suite: **272 / 272 / 0** (267 + 5 new — no regressions).
- Real `scoreImage` wiring (`decodePng`→`scorePalette`) reproduced `coverage 0.193` on the existing Fitcheck brand-board — identical to the standalone kit-qa score, proving ISC-19 with **no generation**.
- CLI parses `--reroll/--threshold/--max-attempts/--metric` + runs `--no-images` at exit 0; `node --check` passes.
- Backward-compat: `reroll=null` keeps the single-gen `{ok,code}` shape; existing `brandmint.test.mjs` unmodified + green.
- /simplify: reroll-detail string was duplicated (README vs CLI summary) → extracted one shared `rerollSuffix()`; suite stayed green.
- Shipped: branch `feat/reroll-in-runbrandkit` → **PR #99**. Additive, $0.

**Capability invocations:** Skill(simplify) called this turn (then a judgment-scoped fix for a 50-line diff rather than 4 agents); test-driven-development applied (visible RED→GREEN); verification-before-completion applied (every claim above backed by a fresh command run).