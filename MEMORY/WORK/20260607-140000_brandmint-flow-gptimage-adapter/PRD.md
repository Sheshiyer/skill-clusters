---
task: TDD GREEN brandmint flow + gpt-image adapter modules
slug: 20260607-140000_brandmint-flow-gptimage-adapter
effort: standard
phase: complete
progress: 15/15
mode: interactive
started: 2026-06-07T06:30:27+0530
updated: 2026-06-07T06:32:10+0530
---

## Context

Strict TDD GREEN: two already-written test files define the contract; write the MINIMAL
zero-dependency Node ESM modules that make them pass. Do NOT modify tests, commit, add deps,
or touch unrelated files.

- Test contract 1: taste/scripts/lib/gpt-image.test.mjs → exercises buildGenArgs + makeGptImage.
- Test contract 2: taste/scripts/brandmint.test.mjs → exercises buildTextArtifacts + planImageArtifacts + runBrandKit.

Modules to import (already present, unchanged):
- gen-logo.mjs → genLogo(spec) returns OBJECT { markSvg, logoSvg, logoDarkSvg } (NOT a bare string — task prompt was wrong; use .logoSvg for logo.svg).
- gen-voice.mjs → genVoiceGuide(spec) returns a Markdown string.
- gen-positioning.mjs → genPositioning(spec) returns a Markdown string.
- brand-version.mjs → versionOf(spec) returns a 12-hex content hash.

Requested: minimal GREEN code, project conventions (zero-dep, pure cores + injected I/O, isMain CLI guard,
dense comment headers like gen-logo.mjs). NOT requested: running the real CLI (triggers real image gen),
committing, deps, refactoring siblings.

### Risks
- genLogo returns an object, not a string → logo.svg must be genLogo(spec).logoSvg or the <svg test fails.
- brand-spec.json must round-trip EXACTLY to SPEC (deepEqual after JSON.parse) → plain JSON.stringify(spec,null,2), no canonicalization.
- buildGenArgs ordering is asserted positionally (indexOf +1) → keep exact argv order.
- planImageArtifacts prompts are substring-asserted (brand name in both; all 3 palette hexes in brand-board; wordmark/logo in logo-concept).

## Criteria

- [x] ISC-1: gpt-image.mjs exports buildGenArgs and makeGptImage
- [x] ISC-2: buildGenArgs argv[0] is `${skillDir}/scripts/gen.sh`
- [x] ISC-3: buildGenArgs emits --prompt then prompt, --out then out
- [x] ISC-4: buildGenArgs emits one --ref pair per ref in order; none when empty
- [x] ISC-5: buildGenArgs emits --timeout-sec as string only when provided
- [x] ISC-6: generateImage throws on blank prompt or blank out
- [x] ISC-7: generateImage calls runner with built argv; returns {ok,out,code} by status
- [x] ISC-8: brandmint.mjs exports buildTextArtifacts, planImageArtifacts, runBrandKit
- [x] ISC-9: buildTextArtifacts logo.svg is SVG string, voice.md H1, positioning.md, version.txt 12-hex
- [x] ISC-10: buildTextArtifacts brand-spec.json round-trips SPEC; spec not mutated
- [x] ISC-11: planImageArtifacts returns 2 descriptors, both naming the brand
- [x] ISC-12: brand-board prompt carries all palette hexes; logo-concept names wordmark
- [x] ISC-13: runBrandKit writes 5 text artifacts + README, calls generateImage once per descriptor
- [x] ISC-14: runBrandKit manifest enumerates artifacts + version; idempotent; images:false skips gen
- [x] ISC-15: both test files pass with 0 failures, pristine output

## Decisions

- logo.svg = genLogo(spec).logoSvg (genLogo returns an object; the full lockup SVG is .logoSvg). Task prompt's "returns an SVG string" was inaccurate vs the real module.
- brand-spec.json = JSON.stringify(spec, null, 2) — NOT canonicalized — so JSON.parse round-trips to SPEC exactly (deepEqual test).
- gpt-image.mjs is library-only (no CLI): it's a bridge consumed by brandmint; the real spawnSync wiring lives in brandmint's main().
- isMain guard uses pathToFileURL form per the task + gen-logo.mjs sibling.

## Verification

`node --test taste/scripts/lib/gpt-image.test.mjs taste/scripts/brandmint.test.mjs`
→ tests 25 | pass 25 | fail 0 | cancelled 0 | skipped 0 | todo 0. Output pristine.
git status: only taste/scripts/brandmint.mjs + taste/scripts/lib/gpt-image.mjs are new code files; test files were already untracked at session start; nothing committed; no package.json/deps touched.
