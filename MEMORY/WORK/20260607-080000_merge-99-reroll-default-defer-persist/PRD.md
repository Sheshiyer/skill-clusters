---
task: Merge 99, reroll default opt-out, defer kit-register persist
slug: 20260607-080000_merge-99-reroll-default-defer-persist
effort: extended
phase: complete
progress: 20/20
mode: interactive
started: 2026-06-07T08:00:00-07:00
updated: 2026-06-07T08:00:00-07:00
---

## Context

Three user follow-ups:
1. **Merge PR #99** — land the self-correcting flow on main (OPEN/MERGEABLE/CLEAN, verified).
2. **Make reroll the default (opt-out)** — flip the `brandmint` CLI to self-correct by default, with `--no-reroll` to disable. Extract a testable `parseArgs()` so the default is unit-verified (today the flag parsing is inline + untested).
3. **Point kit-register at store-fs** (persist registrations) — **DEFERRED**: the cloud session is writing CLI integration tests against `kit-register.mjs`'s current contract on `claude/festive-allen-mhYRX`, and that branch is still at `c599e67` (tests not landed). Changing the kit-register CLI now would risk breaking their pending tests. Trigger: do #3 once `origin/claude/festive-allen-mhYRX` moves past `c599e67`.

**Key safety:** #2 only touches `main()` / a new exported `parseArgs()` — the `runBrandKit` library default stays `reroll=null` (it can't self-score without an injected scorer; that separation is correct). So the locked `brandmint.test.mjs` + `brandmint-reroll-flow.test.mjs` are untouched.

## Criteria

### Merge #99
- [x] ISC-1: PR #99 is merged (state MERGED)
- [x] ISC-2: origin/main's brandmint.mjs has the reroll-in-flow runBrandKit
- [x] ISC-3: full taste suite green on the post-merge main

### Reroll default (opt-out) — #2
- [x] ISC-4: parseArgs is an exported pure function (argv -> options)
- [x] ISC-5: parseArgs defaults reroll to true (opt-out)
- [x] ISC-6: --no-reroll sets reroll false
- [x] ISC-7: parseArgs parses --threshold + --max-attempts + --metric
- [x] ISC-8: parseArgs parses --no-images and --skill-dir
- [x] ISC-9: parseArgs captures positional specPath + outDir
- [x] ISC-10: main() is refactored to use parseArgs
- [x] ISC-11: the CLI builds the scorer only when reroll && images
- [x] ISC-12: the usage string documents --no-reroll
- [x] ISC-13: new parseArgs tests are green
- [x] ISC-14: existing brandmint + reroll-flow tests stay green (runBrandKit untouched)
- [x] ISC-15: the full taste suite is green after #2
- [x] ISC-16: #2 is pushed on a new branch + a PR opened

### Defer #3
- [x] ISC-17: #3 (kit-register → store-fs) is explicitly deferred with its trigger recorded

### Anti-criteria
- [x] ISC-A1: runBrandKit's library default stays reroll=null (no change to the locked tests)
- [x] ISC-A2: no new spend (parseArgs tests are pure; no generation)
- [x] ISC-A3: kit-register.mjs is NOT edited while the cloud session is in flight

## Decisions
- #2 defaults reroll at the CLI layer only (where the real scorer exists); the library stays injected/pure.
- Extract parseArgs to make the default unit-testable without a subprocess.
- #3 gated on the cloud session: trigger = origin/claude/festive-allen-mhYRX advances past c599e67.

## Verification

- **#1 Merge:** PR #99 → `MERGED` @ 07:29:31Z; `origin/main` brandmint.mjs carries the reroll-in-flow runBrandKit (`reroll = null` param present).
- **#2 Reroll default (RED→GREEN):** new `brandmint-cli-args.test.mjs` failed at import (parseArgs missing) → after extracting parseArgs, **8/8 green**. Full taste suite **280/280** (272 + 8, no regressions). Smoke: default(reroll-on)+`--no-images` → exit 0, no generation, reroll banner suppressed (scorer guarded by `reroll && images`); `--no-reroll` → exit 0. `node --check` passes. runBrandKit + brandmint.test.mjs + brandmint-reroll-flow.test.mjs untouched (library default stays `reroll=null`). Shipped: branch `feat/reroll-default-optout` → **PR #100** (`8bbb0b9`).
- **#3 Deferred:** `origin/claude/festive-allen-mhYRX` still at `c599e67` (cloud-session CLI tests not landed). Trigger to proceed: that ref advances past `c599e67`. kit-register.mjs deliberately NOT edited (ISC-A3).

**Capabilities:** test-driven-development applied (visible RED→GREEN on parseArgs); verification-before-completion applied (every claim backed by a fresh run).