---
task: TDD two zero-dep brandmint modules — multi and pack
slug: 20260607-140000_brandmint-multi-and-pack-modules
effort: advanced
phase: complete
progress: 26/26
mode: interactive
started: 2026-06-07T14:00:00Z
updated: 2026-06-07T14:12:00Z
---

## Context

Strict TDD build of two zero-dependency (node: builtins only) ES-module scripts in the
brandmint wing, matching the house style of `taste/scripts/brandmint.mjs` (dense header
comments, pure cores + injected I/O, `isMain` CLI guard). Tests are written FIRST and watched
to fail (RED), then minimal code makes them pass (GREEN). Nothing committed; no files outside
the four targets are edited (brandmint.mjs is imported, never modified).

Targets:
- taste/scripts/brandmint-multi.mjs  — run the brand-kit flow across N brands → manifests[]
- taste/scripts/brandmint-multi.test.mjs
- taste/scripts/brandmint-pack.mjs    — build an asset-pack manifest (count/totalBytes/files[])
- taste/scripts/brandmint-pack.test.mjs

Learned signatures (from brandmint.mjs): `runBrandKit({ spec, outDir, generateImage, writeFile,
mkdir, log, images })` returns a manifest `{ brand, version, outDir, textArtifacts,
imageArtifacts, readme }`. `makeGptImage({ skillDir, runner })` returns `{ generateImage }`.
DEFAULT_SKILL_DIR = `os.homedir()/.agents/skills-archive/gpt-image-2`.

### Plan
- multi: pure `runMultiBrand({ brands, runKit })` loops brands in order, calls injected
  `runKit({ spec, outDir })` once each, collects returned manifests into an ordered array.
  CLI wraps a real runKit around runBrandKit with real fs/console/gpt-image deps, derives outDir,
  writes `<outRoot>/index.json` (array of {brand,version,outDir}), exit 2 on usage/parse errors.
- pack: pure `packKit({ files, readBytes, sha256 })` maps each relative path → {path,bytes,sha256}
  and aggregates count + totalBytes. CLI walks kitDir recursively (excluding pack.json),
  hashes via node:crypto sha256, enriches with brand/version from version.txt + brand-spec.json
  when present, writes `<kitDir>/pack.json`, exit 2 on usage errors.
- Tests inject all I/O (fake runKit, fake readBytes/sha256) so nothing touches disk/codex/network.

### Risks
- isMain guard must keep module import side-effect-free so test import does not run main().
- pack walk must exclude an existing pack.json to stay idempotent across re-runs.
- order preservation in runMultiBrand is a load-bearing contract (must be a plain in-order loop).

## Criteria

### brandmint-multi.mjs
- [x] ISC-1: brandmint-multi.test.mjs written and fails before impl (RED)
- [x] ISC-2: runMultiBrand exported from brandmint-multi.mjs
- [x] ISC-3: runMultiBrand calls runKit exactly once per brand
- [x] ISC-4: runMultiBrand returns array of length == brands.length
- [x] ISC-5: runMultiBrand preserves brand order in returned manifests
- [x] ISC-6: runMultiBrand passes spec and outDir to each runKit call
- [x] ISC-7: module import is side-effect-free (isMain guard present)
- [x] ISC-8: CLI main parses brands.json, outRoot, --no-images, --skill-dir
- [x] ISC-9: CLI derives outDir from entry.outDir or name or spec name
- [x] ISC-10: CLI builds real runKit wrapping runBrandKit with fs deps
- [x] ISC-11: CLI writes <outRoot>/index.json array of {brand,version,outDir}
- [x] ISC-12: CLI exits 2 on usage/parse errors
- [x] ISC-13: header comment matches brandmint.mjs house style

### brandmint-pack.mjs
- [x] ISC-14: brandmint-pack.test.mjs written and fails before impl (RED)
- [x] ISC-15: packKit exported from brandmint-pack.mjs
- [x] ISC-16: packKit returns count equal to files length
- [x] ISC-17: packKit returns one files[] entry per input path
- [x] ISC-18: each entry has numeric bytes from readBytes length
- [x] ISC-19: each entry has sha256 string from injected sha256
- [x] ISC-20: packKit totalBytes equals sum of entry bytes
- [x] ISC-21: each entry path equals the input relative path
- [x] ISC-22: CLI walks kitDir recursively excluding pack.json
- [x] ISC-23: CLI adds brand/version when version.txt + brand-spec.json exist
- [x] ISC-24: CLI writes <kitDir>/pack.json pretty JSON
- [x] ISC-25: CLI exits 2 on usage errors

### Suite
- [x] ISC-26: node --test over both test files is all green, pristine

## Decisions

- runMultiBrand is a plain in-order `for…of` push loop (order is a load-bearing contract; no
  Promise.all reorder risk, no parallelism since runBrandKit is synchronous).
- CLI runKit closes over one shared set of fs/console/gpt-image deps (bound once), mirroring
  brandmint.mjs's single-kit wiring — so 1 brand and N brands render identically.
- packKit reads each file once and hashes the SAME bytes (no double read), keeping it a pure
  fold over injected readBytes/sha256.
- walkFiles sorts entries and excludes a root pack.json so the manifest is stable + idempotent
  across re-packs (verified: re-run does not list pack.json in its own files[]).
- Malformed brand-spec.json in pack CLI degrades to "no brand stamp" rather than crashing — the
  file still appears in files[]; only the optional brand label is dropped.

## Verification

Command: `node --test taste/scripts/brandmint-multi.test.mjs taste/scripts/brandmint-pack.test.mjs`
Result: tests 13 · pass 13 · fail 0 · cancelled 0 · skipped 0 · todo 0 — pristine.

- ISC-1/14 (RED): pre-impl run failed with ERR_MODULE_NOT_FOUND for both .mjs modules (imports
  unresolved before code existed) → RED confirmed, then GREEN after impl.
- ISC-3/5/6: recording runKit asserts call-count == 3, manifests order [alpha,bravo,charlie],
  and forwarded spec.brand + outDir arrays match in order.
- ISC-7: `import('./brandmint-multi.mjs')` and `import('./brandmint-pack.mjs')` print only the
  export type, no main() output → side-effect-free.
- ISC-12/25 (exit 2): `brandmint-multi.mjs` no-args → exit 2; `brandmint-pack.mjs` no-args → exit 2.
- ISC-16..21: packKit over a 3-file fake fs → count 3, bytes [13,11,7], sha256 ['sha-13','sha-11',
  'sha-7'], totalBytes 31, paths preserved.
- ISC-22/23/24 (CLI smoke): real temp kit (logo.svg, version.txt, brand-spec.json, images/board.png)
  → pack.json written with count 4, totalBytes 79, real node:crypto sha256 per file, brand "SmokeCo",
  version "abc123def456". Re-run idempotent (pack.json absent from its own files[]).
- Scope: only the 4 target files are new (`git status --porcelain taste/scripts/`); brandmint.mjs
  clean (unmodified); HEAD unchanged (nothing committed).
- Capability note: `Skill("simplify")` was selected in OBSERVE but removed in VERIFY — as a
  subagent, invoking it would spawn nested review agents (outside this agent's mandate; the parent
  runs review/demos). Replaced with an inline quality review against the diff: reuse (both CLIs
  compose runBrandKit/makeGptImage, no reimpl), efficiency (single read+hash per file in packKit),
  simplification (runMultiBrand is a minimal in-order loop) — no defects found.
