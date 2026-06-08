---
task: Auto-reroll closed-loop module that regenerates off-brand renders
slug: 20260607-160000_brandmint-auto-reroll-closed-loop
effort: advanced
phase: complete
progress: 26/26
mode: interactive
started: 2026-06-07T16:00:00Z
updated: 2026-06-07T16:20:00Z
---

## Context

Build a zero-dependency "auto-reroll" closed-loop module for the brandmint wing. brandmint
renders on-brand images via gpt-image-2, and kit-qa scores how on-palette a render is. This module
closes the loop: for each planned image descriptor, generate → score → and if the score is below a
threshold, regenerate (reroll) up to maxAttempts, keeping the best-scoring attempt. It composes the
existing upstream modules by IMPORTING them (planImageArtifacts, makeGptImage, scorePalette,
decodePng) — it must NOT modify any of them.

Strict TDD: tests written FIRST and watched fail, then minimal code to green. Zero deps (node:
builtins only). Do NOT commit. Only the three named files may be created.

### Why it matters
Generative renders are non-deterministic — a single gpt-image-2 pass can come back off-palette.
Without a reroll loop a human has to eyeball every render and re-run by hand. This module makes the
quality gate autonomous: it keeps the best of N attempts and stops early the moment a render clears
the on-brand threshold, so it spends the minimum number of (paid-sub) generations.

### Requested
- taste/scripts/lib/reroll.mjs — pure core `rerollImages({...})` returning results[]
- taste/scripts/lib/reroll.test.mjs — node:test contract, injected fakes, no real gen/disk
- taste/scripts/brandmint-reroll.mjs — CLI wiring real generateImage + real scoreImage
- Conventions: pure core + injected I/O, isMain CLI guard, dense brandmint-style header comments

### NOT requested
- No real image generation in tests (inject fakes)
- No edits to any file outside the three named files (compose by import)
- No commit, no push
- No running the CLI against real specs (triggers real gen — primary agent runs the demo)
- No new dependencies (node: builtins only)

### Risks
- Mis-reading the "best vs threshold" semantics: must keep highest-scoring attempt even when none
  clear threshold, but STOP EARLY (no further attempts) the moment one clears it.
- scoreOf default must read `.coverage` from the score object (kit-qa's scorePalette shape).
- The CLI's scoreImage must read the PNG from disk, decode, and scorePalette against
  spec.visual_tokens.palette — and that path must NOT run in tests.
- Off-by-one on attempt counting: a passing first attempt = exactly 1 attempt.

### Plan
reroll.mjs: single pure function. For each descriptor, loop i in 1..maxAttempts: call
generateImage({prompt, out, refs}); if {ok:true}, score the out, compute s=scoreOf(scoreObj);
track best (max s). Push every attempt record. Break the loop the moment s>=threshold. After the
loop, the record is {name,file,out,attempts,bestScore,onBrand,ok}. `attempts` = number of attempts
actually made. `ok` = whether any attempt returned ok:true. If generateImage returns ok:false we do
not score that attempt (no out to read); it still counts as an attempt.

reroll.test.mjs: node:test + node:assert/strict (repo idiom). Inject generateImage fake
(returns {ok:true,out}) and scoreImage fake (scripted per-call scores via a shift()-queue keyed by
out/name). Four+ scenarios per spec.

brandmint-reroll.mjs: CLI. Parse spec + outDir + flags (--threshold, --max-attempts, --metric,
--skill-dir). descriptors=planImageArtifacts(spec) with each .out=`${outDir}/${d.file}`; mkdir
`${outDir}/images`. Real generateImage via makeGptImage. Real scoreImage(out)=read+decode+scorePalette.
scoreOf picks the --metric field. Print per-image attempts/bestScore/onBrand. exit 2 on usage/parse.

## Criteria

### reroll.mjs — pure core
- [x] ISC-1: reroll.mjs exists and exports `rerollImages` as a named function
- [x] ISC-2: rerollImages returns one result object per input descriptor
- [x] ISC-3: each result has keys name, file, out, attempts, bestScore, onBrand, ok
- [x] ISC-4: result.out defaults to descriptor.out when present
- [x] ISC-5: result.out falls back to descriptor.file when descriptor.out absent
- [x] ISC-6: scoreOf defaults to reading the score object's coverage field
- [x] ISC-7: a first attempt at-or-above threshold yields exactly 1 attempt
- [x] ISC-8: an at-or-above-threshold attempt sets onBrand true with no reroll
- [x] ISC-9: all-below-threshold scoring runs exactly maxAttempts attempts
- [x] ISC-10: all-below-threshold keeps the highest (best) score seen
- [x] ISC-11: all-below-threshold sets onBrand false
- [x] ISC-12: below-then-above stops at the first passing attempt
- [x] ISC-13: below-then-above bestScore equals the passing attempt's score
- [x] ISC-14: multiple descriptors are processed independently in order
- [x] ISC-15: generateImage is called with prompt, out, and refs per descriptor
- [x] ISC-16: rerollImages is pure — no disk/network, only injected fns

### reroll.test.mjs — RED-first contract
- [x] ISC-17: test file uses node:test and node:assert/strict
- [x] ISC-18: tests inject fake generateImage (no real gen) and fake scoreImage
- [x] ISC-19: covers passing-first, all-below, below-then-above, multi-descriptor
- [x] ISC-A1: tests do NOT import real gpt-image/png-decode/disk in the core suite

### brandmint-reroll.mjs — CLI
- [x] ISC-20: CLI exists with the isMain guard and main() is import-safe
- [x] ISC-21: CLI parses --threshold, --max-attempts, --metric, --skill-dir
- [x] ISC-22: CLI sets each descriptor.out to `${outDir}/${d.file}` and mkdirs images
- [x] ISC-23: CLI wires real makeGptImage + real read/decode/scorePalette scoreImage
- [x] ISC-24: CLI exits 2 on missing args or unparseable spec

### Whole-task gates
- [x] ISC-25: `node --test taste/scripts/lib/reroll.test.mjs` is all green
- [x] ISC-A2: no file outside the three named files is modified; nothing committed

## Decisions

- bestScore initialised to `-Infinity` so the first real score always wins; an all-ok:false run
  surfaces `-Infinity` rather than NaN (internal edge — tests only script ok:true paths).
- `attempts` counts loop iterations actually executed (so a passing first attempt = 1), not maxAttempts.
- `ok` = true if ANY attempt returned ok:true. An ok:false attempt is NOT scored (no out to read)
  but still increments `attempts`.
- Test fake scoreImage returns a fresh score OBJECT (e.g. `{coverage: q.shift()}`) so scoreOf's
  default field-read is exercised honestly, not a bare number.

## Verification

- RED watched: `node --test reroll.test.mjs` with no reroll.mjs → ERR_MODULE_NOT_FOUND, 0 pass / 1
  fail (honest failure = missing feature, not a typo). [ISC-17..19]
- GREEN: after writing reroll.mjs → 15 tests, 15 pass, 0 fail, pristine. [ISC-1..16, ISC-25]
- scoreOf default proven by a test where coverage(0.05) is below but accentPresence(0.99) is above
  threshold → it rerolls, confirming the default reads `coverage`. [ISC-6]
- Off-by-one pinned: passing-first asserts attempts===1, calls===1; all-below asserts
  attempts===maxAttempts; below-then-above asserts attempts===2 of a max of 5. [ISC-7,9,12]
- Best-of-non-monotonic: scores [0.05,0.09,0.04] → bestScore===0.09 (middle, not last). [ISC-10,13]
- CLI import-safety: `import()` of brandmint-reroll.mjs prints no CLI output, exports (none). [ISC-20]
- CLI exit-2 paths (no gen triggered): no-args → 2; `--metric bogus` → 2; non-JSON spec → 2; no
  render dir leaked (parse fails before mkdir). [ISC-21,24]
- CLI scoreImage wiring proven with a synthetic 2×2 #FF6B35 PNG + fake generateImage: read→decodePng
  →scorePalette→scoreOf yields coverage 1.000, 1 attempt, on-brand — no codex spend. [ISC-22,23]
- No regressions: full lib suite 177 tests / 177 pass / 0 fail. The four imported upstream modules
  (brandmint, gpt-image, kit-qa, png-decode) show empty `git status` — byte-unchanged. [ISC-A2]
- Nothing committed: HEAD remains c599e67. Only the three named files are new + mine; store-fs.mjs is
  a concurrent unrelated module (design-memory durability), not referenced by my code, not authored
  by my tool calls. [ISC-A2]
- /simplify (selected capability) invoked; applied one simplification (`scoreImage(res.out ?? out)`
  → `scoreImage(out)`); suite stayed green after the edit.

### Capability invocation check
- superpowers:test-driven-development — INVOKED via `Skill` tool (BUILD). RED-watched-then-green
  followed literally.
- /simplify — INVOKED via `Skill` tool (VERIFY). Four review angles applied to the 484-line diff;
  one fix applied, rest confirmed clean.
