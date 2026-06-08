---
task: kit-register CLI tests + --persist via store-fs
slug: 20260607-083000_kit-register-cli-tests-and-persist
effort: extended
phase: complete
progress: 27/27
mode: interactive
started: 2026-06-07T08:30:00-07:00
updated: 2026-06-07T08:30:00-07:00
---

## Context

The cloud session that was to write `kit-register`'s CLI integration tests stalled (branch static at `c599e67`). User said "I take over" — so I write the **CLI tests** (6 exit-2 cases + success) AND wire **`--persist`** (kit-register → store-fs durability) in one PR, since kit-register is now on `main` (via #98).

**Contract (read from kit-register.mjs):** CLI `<prototype.json> <kitDir>`; `main()` calls `process.exit(2)` on errors → tests must **spawn a subprocess** (`spawnSync('node', …)`). 6 exit-2 paths: no args / missing kitDir / unreadable proto / bad JSON / no `.prototype` / no `.brand`. Success: prints `registered <brand> kit (version <v>)` + noesis[brand] + design-memory recall @ 1.0000 + census `{brand:1}`; version from `<kitDir>/version.txt` or `unknown`.

**--persist design (additive, contract-preserving):** add `--persist <dir>`. When set, build `makeNoesis({ stores: { brand: makeFileStore(<dir>/noesis-brand.json) } })` + `makeDesignMemory({ store: makeFileStore(<dir>/design-memory.json) })` so registrations survive; print a `persisted →` line. **Without `--persist` the behavior + stdout are byte-identical to today** (in-memory) — so the characterization tests hold and nothing the cloud session would have tested breaks. Fixture: the synthetic `taste/scripts/__fixtures__/sample-prototype.json` (on main) — no real brand data.

## Criteria

### CLI characterization (lock the contract)
- [x] ISC-1: CLI exits 2 with no args (stderr: usage)
- [x] ISC-2: CLI exits 2 with only the prototype (missing kitDir)
- [x] ISC-3: CLI exits 2 when the prototype file is missing
- [x] ISC-4: CLI exits 2 on invalid prototype JSON
- [x] ISC-5: CLI exits 2 when .prototype is absent
- [x] ISC-6: CLI exits 2 when .brand is absent
- [x] ISC-7: CLI exits 0 on the success path
- [x] ISC-8: success stdout shows "registered <brand> kit (version <v>)"
- [x] ISC-9: success stdout shows the noesis[brand] recall at score 1.0000
- [x] ISC-10: success stdout shows the census {taste:0,brand:1,knowledge:0}
- [x] ISC-11: version is "unknown" when version.txt is absent

### --persist (TDD)
- [x] ISC-12: the CLI accepts --persist <dir>
- [x] ISC-13: without --persist the stdout/exit are unchanged (in-memory)
- [x] ISC-14: --persist writes noesis-brand.json into the dir
- [x] ISC-15: --persist writes design-memory.json into the dir
- [x] ISC-16: the persisted noesis file contains the brand record
- [x] ISC-17: a fresh store reading the dir recalls the kit (durability)
- [x] ISC-18: --persist prints a "persisted →" confirmation line
- [x] ISC-19: the default (no --persist) writes no store files

### Tests / ship
- [x] ISC-20: new kit-register-cli.test.mjs is all-green
- [x] ISC-21: existing kit-register.test.mjs (5 registerKit tests) stays green
- [x] ISC-22: the full taste suite is green (no regressions)
- [x] ISC-23: the usage string documents --persist
- [x] ISC-24: shipped on a new branch + a PR

### Anti-criteria
- [x] ISC-A1: registerKit pure core is unchanged (only main() + a new import touched)
- [x] ISC-A2: no new spend
- [x] ISC-A3: no real brand data / vault path committed (synthetic fixture only)

## Decisions
- Characterize the existing CLI (tests pass immediately — they LOCK the contract for the abandoned handoff); TDD only the new --persist.
- --persist is strictly additive: default path untouched → the cloud session's intended tests can't be broken by it.
- CLI tests spawn a subprocess (main() calls process.exit, so it can't run in-process).

## Verification

- **CLI tests:** new `kit-register-cli.test.mjs` spawns subprocesses — 9 characterization (6 exit-2 + success + version-unknown + no-persist-no-files) passed immediately (locking the existing contract); the 4 `--persist` cases were RED (feature missing) → GREEN after wiring. **13/13.**
- **No regression:** existing `kit-register.test.mjs` 5/5; full taste suite **293/293** (280 + 13).
- **Real-data durability:** `kit-register taste/brands/hdilint.json <kit> --persist /tmp/cortex-demo` registered the real **1024-dim** Fitcheck prototype → `noesis-brand.json` + `design-memory.json` (20 KB each) on disk; a **fresh `makeNoesis`+`makeFileStore` instance** read those files and recalled `hdilint:99f09665df9d` at **score 1.0000** — cross-process persistence confirmed.
- **Additive/contract-safe:** `registerKit` pure core untouched; the default (no `--persist`) path is byte-identical (in-memory, writes no files) — the contract the cloud session would have tested is preserved. `node --check` passes.
- **Shipped:** branch `feat/kit-register-persist` → PR (below). Synthetic fixture only; `$0`.

**Capabilities:** test-driven-development (RED→GREEN on `--persist`); verification-before-completion (every claim above backed by a fresh run + a real-data demo).