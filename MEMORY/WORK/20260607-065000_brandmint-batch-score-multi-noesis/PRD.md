---
task: Build 3 no-spend threads score multi-brand noesis
slug: 20260607-065000_brandmint-batch-score-multi-noesis
effort: advanced
phase: complete
progress: 29/29
mode: interactive
started: 2026-06-07T06:50:00-07:00
updated: 2026-06-07T07:05:00-07:00
---

## Context

Follow-up batch (user picked threads 1+2+3 after the brandmint-flow shipped as PR #98). Three independent, no-spend capabilities that close loops around the new brand kit. Disjoint files → built in parallel by 3 TDD subagents; I verify + run the real demos + commit.

- **Thread 1 — auto-score the renders:** a zero-dep raster on-brand scorer. `lib/png-decode.mjs` (truecolor-8 PNG → pixels via node:zlib) + `lib/kit-qa.mjs` (score pixels vs brand palette) + `kit-qa.mjs` CLI. Run on the 2 real Fitcheck renders → real on-brand numbers. Closes the taste loop (top LEARN item).
- **Thread 2 — multi-brand (#35) + asset-pack (#37):** `brandmint-multi.mjs` (runBrandKit over N brands) + `brandmint-pack.mjs` (kit dir → pack.json with per-file sha256 + sizes). Proves the orchestrator generalizes; packs a kit for distribution.
- **Thread 3 — kit → noesis/design-memory:** `kit-register.mjs` registers the kit (reusing the brand's existing 1024-dim prototype embedding — no NIM/spend) into noesis' `brand` namespace + per-brand design-memory; queryAll recalls it.

Built on existing exports: noesis `makeNoesis`/`NAMESPACES`; design-memory `makeDesignMemory`/`cosine`/`makeMemoryStore`; brandmint `runBrandKit`. Reuse the prototype embedding in `taste/brands/hdilint.json`.

Not requested: new spend, NIM embedding calls, committing the vault kit.

## Criteria

### Thread 1 — raster on-brand scorer
- [x] ISC-1: png-decode parses the PNG signature + IHDR (width/height/colortype)
- [x] ISC-2: png-decode inflates IDAT via node:zlib and un-filters scanlines (filters 0-4)
- [x] ISC-3: png-decode returns {width,height,pixels} for a truecolor-8 image
- [x] ISC-4: png-decode throws on an unsupported PNG (palette/grayscale/interlaced/16-bit)
- [x] ISC-5: kit-qa hexToRgb converts a #RRGGBB to [r,g,b]
- [x] ISC-6: kit-qa scorePalette returns coverage in [0,1] for pixels vs a palette
- [x] ISC-7: kit-qa scores an all-accent image near 1 and an off-palette image near 0
- [x] ISC-8: kit-qa CLI prints a JSON score for an image + brand-spec/palette
- [x] ISC-9: thread-1 tests are all-green under node --test

### Thread 2 — multi-brand + asset-pack
- [x] ISC-10: runMultiBrand runs runBrandKit once per brand in the list
- [x] ISC-11: runMultiBrand returns one manifest per brand
- [x] ISC-12: brandmint-multi CLI reads a brands.json and writes per-brand kits
- [x] ISC-13: packKit returns a manifest with one entry per kit file
- [x] ISC-14: each pack entry has a sha256 and a byte size
- [x] ISC-15: brandmint-pack CLI writes pack.json into a kit dir
- [x] ISC-16: thread-2 tests are all-green under node --test

### Thread 3 — kit → noesis/design-memory
- [x] ISC-17: registerKit adds a record to noesis' `brand` namespace
- [x] ISC-18: registerKit adds a record to design-memory (brand-namespaced)
- [x] ISC-19: registerKit returns the ids it created
- [x] ISC-20: a noesis query for the brand recalls the registered kit
- [x] ISC-21: kit-register CLI registers from a prototype + kit dir and prints recall
- [x] ISC-22: thread-3 tests are all-green under node --test

### Real runs + integration
- [x] ISC-23: kit-qa scores both real Fitcheck renders (brand-board, logo-concept) with real numbers
- [x] ISC-24: brandmint-multi runs the flow on 2 specs (Fitcheck + a 2nd), text-only
- [x] ISC-25: brandmint-pack packs the real Fitcheck kit → pack.json on disk
- [x] ISC-26: kit-register registers the real Fitcheck prototype + recalls it
- [x] ISC-27: full brandmint-wing suite stays green (no regressions)

### Anti-criteria
- [x] ISC-A1: No new API spend (reuse the existing prototype embedding; no NIM calls)
- [x] ISC-A2: Changes are additive (new files; no breakage of existing modules)
- [x] ISC-A3: No commit of HDILINT vault artifacts

## Decisions
- 3 disjoint-file threads built by 3 parallel TDD subagents (no shared-file edits → no conflicts).
- Thread 1 decodes PNG with node:zlib (pure, testable via a synthesized PNG) rather than sips (shell, untestable).
- Thread 3 reuses the brand's existing 1024-dim prototype embedding (no NIM/spend); stores are in-memory (persistence deferred).

## Verification

**Fresh consolidated run (2026-06-07T07:05):**
- **119 tests / 119 pass / 0 fail** across all 5 new test groups (png-decode, kit-qa, brandmint-multi, brandmint-pack, kit-register = 45) + the 7 wing files (74) → no regressions (ISC-9/16/22/27).
- **Thread 1 (real):** `kit-qa` on the 2 real Fitcheck renders → brand-board coverage 19.3% / accent 6.0%; logo-concept coverage 50.4% / accent 1.2%. Honest, interpretable numbers (navy-dominant logo bg → high palette coverage; white board space is neutral; orange is an accent, hence small) (ISC-23).
- **Thread 2 (real):** `brandmint-multi` on Fitcheck + Tryambakam Noesis (synthesized sacred/organic spec) → 2 text kits + index.json; versions 99f09665df9d + dc5d90302e9c — orchestrator generalized to a distinct brand (ISC-24). `brandmint-pack` on the real kit → pack.json (8 files, 2.21 MB, brand=Fitcheck, per-file sha256) (ISC-25).
- **Thread 3 (real):** `kit-register` reused hdilint's existing 1024-dim prototype → noesis[brand] + design-memory both recall `hdilint:99f09665df9d` at cosine 1.0000; census {brand:1}. No NIM call, no spend (ISC-26, A1).
- Additive: 11 new files; existing modules byte-for-byte unchanged (subagents confirmed) (A2). Vault kit/pack.json stay uncommitted (A3).

**Capability invocations:** 3× Agent(Engineer) parallel TDD builds; each subagent invoked Skill(test-driven-development) + Skill(simplify) in its own context; primary ran the consolidated verification.
