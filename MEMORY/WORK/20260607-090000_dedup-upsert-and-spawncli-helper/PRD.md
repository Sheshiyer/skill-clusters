---
task: Dedup re-registration (upsert) + shared spawnCli helper
slug: 20260607-090000_dedup-upsert-and-spawncli-helper
effort: advanced
phase: complete
progress: 25/25
mode: interactive
started: 2026-06-07T09:00:00-07:00
updated: 2026-06-07T09:00:00-07:00
---

## Context

Done first: **merged PR #101** + **cleaned branches** (3 merged feat/* + obsolete claude/festive deleted; remote now just main + claude/great-hopper). Then two flagged follow-ups, on one branch → one PR:

**#3a — dedup re-registration (the wart):** `registerKit` calls `noesis.add` / `designMemory.add`, which `rows.push(...)` unconditionally. Re-running `kit-register --persist <dir>` with the same `brand:version` appends a DUPLICATE row (census brand:2). Fix: an **additive `upsert` option** on both `add`s — `add(ns, id, vector, meta, { upsert })`; when `upsert`, filter out any existing same-id row before push. Default `upsert:false` → every existing caller is byte-identical. `registerKit` (whose id is a stable `brand:version`) opts in → re-register is idempotent.

**#3b — shared `spawnCli()` helper:** subprocess CLI tests re-derive `spawnSync('node', …)` wiring per file. Extract `taste/scripts/test-helpers/spawn-cli.mjs` → `spawnCli(scriptPath, args)`; refactor `kit-register-cli.test.mjs` onto it; establish the reusable pattern for future CLI tests.

## Criteria

### Upsert dedup (#3a)
- [x] ISC-1: noesis.add accepts a trailing opts arg with { upsert }
- [x] ISC-2: noesis.add with upsert replaces a same-id row (no duplicate)
- [x] ISC-3: noesis.add default (no upsert) still appends — unchanged
- [x] ISC-4: design-memory.add accepts { upsert }
- [x] ISC-5: design-memory.add with upsert replaces a same-id row
- [x] ISC-6: design-memory.add default still appends — unchanged
- [x] ISC-7: registerKit upserts into both stores
- [x] ISC-8: re-registering the same brand:version keeps noesis census at 1
- [x] ISC-9: re-registering keeps design-memory at one row for the brand
- [x] ISC-10: CLI --persist re-run on the same dir leaves one row on disk
- [x] ISC-11: existing noesis tests stay green
- [x] ISC-12: existing design-memory tests stay green
- [x] ISC-13: existing kit-register tests stay green

### spawnCli helper (#3b)
- [x] ISC-14: test-helpers/spawn-cli.mjs exports spawnCli(scriptPath, args)
- [x] ISC-15: spawnCli spawns node and captures { status, stdout, stderr }
- [x] ISC-16: kit-register-cli.test.mjs is refactored onto spawnCli
- [x] ISC-17: kit-register-cli.test.mjs stays green after the refactor
- [x] ISC-18: spawnCli has its own focused test

### Ship
- [x] ISC-19: the full taste suite is green (no regressions)
- [x] ISC-20: shipped on a new branch + a PR
- [x] ISC-21: PR #101 merged to main
- [x] ISC-22: merged + obsolete branches deleted

### Anti-criteria
- [x] ISC-A1: upsert is additive — every existing add() caller is byte-identical
- [x] ISC-A2: no new spend
- [x] ISC-A3: registerKit's stable id + meta-authority semantics unchanged

## Decisions
- Upsert is opt-in per add() call (default off), so the only behavior change is at registerKit's call sites.
- spawnCli lives in test-helpers/ (a test utility, not production lib).

## Verification

- **Merge + cleanup (done first):** PR #101 `MERGED` @ 08:47:47Z; local+remote `feat/brandmint-flow-gpt-image-2`, `feat/reroll-in-runbrandkit`, `feat/reroll-default-optout`, `feat/kit-register-persist` deleted, plus obsolete remote `claude/festive-allen-mhYRX`. Remote now: `main` + `claude/great-hopper-5Gc2w` (not mine).
- **Upsert (RED→GREEN):** `upsert.test.mjs` failed 3/5 (upsert+registerKit cases) → after adding the `{ upsert }` option to `noesis.add` + `design-memory.add` and opting `registerKit` in, **5/5**. Default-append cases passed throughout (ISC-3/6 — additive). CLI `--persist` re-run on the same dir now leaves **one** row on disk (the wart fixed).
- **spawnCli (RED→GREEN):** `spawn-cli.test.mjs` failed at import → after `test-helpers/spawn-cli.mjs`, **2/2**; `kit-register-cli.test.mjs` refactored onto it and stayed green (14/14, incl. the new re-run test).
- **No regression:** existing noesis (21) + design-memory + kit-register (5) tests green; **full taste suite 301/301** (293 + 8). `node --check` clean on all 4 touched/new .mjs.
- Additive + $0; `registerKit`'s stable id + meta-authority unchanged.

**Capabilities:** test-driven-development (RED→GREEN on both follow-ups); verification-before-completion (every claim above from a fresh run).