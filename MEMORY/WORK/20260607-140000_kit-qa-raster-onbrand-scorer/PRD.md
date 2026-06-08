---
task: Build zero-dep raster on-brand scorer with strict TDD
slug: 20260607-140000_kit-qa-raster-onbrand-scorer
effort: advanced
phase: complete
progress: 28/28
mode: interactive
started: 2026-06-07T14:00:00Z
updated: 2026-06-07T14:25:00Z
---

## Context

Build a zero-dependency raster "on-brand" scorer for the Skill-clusters taste pipeline.
It answers: does a rendered PNG kit actually use the brand's palette? Two new lib modules
plus their tests plus a CLI, all using only `node:` builtins (zlib, fs, url, path).

- `png-decode.mjs` — a minimal PNG decoder: parse signature + chunks (skip CRCs), read IHDR,
  inflate concatenated IDAT, un-filter scanlines (all 5 filters), output RGB row-major.
  Supports ONLY truecolor RGB / bitDepth 8 / non-interlaced; throws clearly otherwise.
- `kit-qa.mjs` (lib) — `hexToRgb` + `scorePalette` (euclidean-distance palette coverage scoring).
- `kit-qa.mjs` (CLI) — read PNG → decode → derive palette (from `--spec` or hex args) → score → JSON.

STRICT TDD: tests written FIRST, run to confirm they FAIL (red), then minimal code to green.
Conventions mirror `taste/scripts/lib/design-memory.mjs` and `taste/scripts/gen-logo.mjs`:
pure cores + injected I/O, `isMain` CLI guard via `pathToFileURL`, dense header comments,
`node:test` + `node:assert`. `visual_tokens.palette` is an array of hex strings per the schema.

What was requested: the 5 files exactly, zero deps, strict TDD, sibling conventions.
What was NOT requested: committing, editing anything outside the 5 files, CRC validation,
support for non-RGB8 PNG variants, running the CLI on real vault images.

### Risks

- PNG filter math (Paeth predictor, Average floor) is easy to get subtly wrong → round-trip
  tests across ALL 5 filter types are the guard.
- The in-test encoder must produce bytes the decoder accepts; if the encoder is wrong the test
  is meaningless → encoder kept dead-simple (one IDAT, zlib.deflateSync, dummy CRCs).
- `scorePalette` auto-stride must still sample at least 1 pixel on tiny images (avoid div-by-zero).
- accentPresence uses palette[0]; perColor must key by the ORIGINAL hex string passed in.

### Plan

1. RED: write png-decode.test.mjs (encoder helper + round-trip per filter + palette-throw) and
   kit-qa.test.mjs (hexToRgb + scorePalette synthetic cases). Run `node --test` → confirm FAIL.
2. GREEN: implement png-decode.mjs, then kit-qa.mjs lib, minimally, until both test files pass.
3. Implement kit-qa.mjs CLI (not under `node --test`, but must parse-check and import cleanly).
4. /simplify pass over the new code, then VERIFY each ISC against `node --test` output.

## Criteria

Decoder — structure:
- [x] ISC-1: decodePng exported from png-decode.mjs as a function
- [x] ISC-2: PNG 8-byte signature parsed and validated
- [x] ISC-3: Chunks iterated by length(4)/type(4)/data/crc(4); CRCs skipped
- [x] ISC-4: IHDR width, height, bitDepth, colorType, interlace read
- [x] ISC-5: All IDAT chunk data concatenated then zlib.inflateSync'd
- [x] ISC-6: Returns { width, height, channels: 3, pixels } RGB row-major
- [x] ISC-7: pixels is a Uint8Array of length width*height*3

Decoder — filters (each independently round-trips):
- [x] ISC-8: Filter 0 (None) reconstructs exact RGB pixels
- [x] ISC-9: Filter 1 (Sub) reconstructs exact RGB pixels
- [x] ISC-10: Filter 2 (Up) reconstructs exact RGB pixels
- [x] ISC-11: Filter 3 (Average, floor((a+b)/2)) reconstructs exact RGB pixels
- [x] ISC-12: Filter 4 (Paeth) reconstructs exact RGB pixels

Decoder — rejection:
- [x] ISC-13: Throws a clear Error on colorType 3 (palette) IHDR

Scorer lib — hexToRgb:
- [x] ISC-14: hexToRgb exported; accepts '#RRGGBB' form
- [x] ISC-15: hexToRgb accepts bare 'RRGGBB' form (no hash)
- [x] ISC-16: hexToRgb returns [r,g,b] integers 0-255

Scorer lib — scorePalette:
- [x] ISC-17: scorePalette exported returning { coverage, accentPresence, perColor, sampled }
- [x] ISC-18: All-accent pixels → coverage ~1 within tolerance
- [x] ISC-19: All-accent pixels → accentPresence ~1 (palette[0])
- [x] ISC-20: All off-palette pixels → coverage ~0
- [x] ISC-21: Half-accent/half-off-palette → coverage ~0.5
- [x] ISC-22: perColor keyed by each original hex string with its fraction
- [x] ISC-23: sampled count and opts.stride/auto-stride honored (>=1 sample)

CLI:
- [x] ISC-24: CLI imports decodePng + scorePalette + hexToRgb from lib files
- [x] ISC-25: CLI derives palette from --spec visual_tokens.palette OR trailing hex args
- [x] ISC-26: CLI prints JSON report {image, coverage, accentPresence, perColor} to stdout
- [x] ISC-27: CLI exits 2 on usage/parse errors; isMain guard via pathToFileURL

Gate:
- [x] ISC-28: `node --test png-decode.test.mjs kit-qa.test.mjs` all green, pristine output

## Decisions

- The in-test PNG encoder applies the SAME filter the decoder reverses (per-row), and tests assert
  the decoded RGB equals the ORIGINAL unfiltered pixels. This guarantees the Sub/Up/Average/Paeth
  reverse branches are actually executed — encoding every row as filter-0 would fake-green ISC-9..12.
- Auto-stride floors at 1 sample (`Math.max(1, ...)`) so tiny images (2x2 = 4px) sample every pixel
  and the synthetic coverage math is exact.
- perColor is keyed by the ORIGINAL hex string passed in (not a normalized form), so callers can map
  results back to the palette they supplied.
- CRCs are written as zero bytes by the encoder and skipped by the decoder (spec says skip CRCs).
- Tolerance default 48 (euclidean RGB distance); #00FF00 vs #FF6B35 is ~300 → cleanly off-palette.

## Verification

- RED checkpoint: first `node --test` run failed with ERR_MODULE_NOT_FOUND (both modules missing) —
  a genuine red (feature absent, not a typo). Captured before any implementation.
- GREEN gate: `node --test taste/scripts/lib/png-decode.test.mjs taste/scripts/lib/kit-qa.test.mjs`
  → tests 27, pass 27, fail 0, pristine output. Re-confirmed after the /simplify refactor.
- Filters: all 5 (None/Sub/Up/Average/Paeth) round-trip exact RGB on 2x2 AND 3x1 (10 tests). The
  in-test encoder applies each REAL filter per-row, so the decoder's reverse branches truly execute.
- Rejection: colorType-3 (palette) IHDR throws a clear Error; non-PNG signature throws.
- Scorer: all-accent → coverage/accentPresence 1; all-#00FF00 off-palette → 0; half/half → 0.5;
  perColor keyed by original hex; explicit stride honored (sampled=10); auto-stride ≥1 on 4px;
  tolerance opt widens matches.
- CLI end-to-end on a SYNTHETIC /tmp PNG (no vault images): --spec path and trailing-hex path both
  produced { coverage:0.5, accentPresence:0.5, perColor:{'#FF6B35':0.5,...} } on a 4x4 top-accent/
  bottom-off image. Exit 2 confirmed (real codes) for no-args, bad-image, bad-spec. Import is
  side-effect-free (isMain guard). /tmp scratch files deleted.
- Cleanliness: only the 5 target files created; no commit/checkout/reset performed (reflog clean);
  kit-register.* in the tree are from a parallel branch and do not import these modules.
- Capabilities: Skill("superpowers:test-driven-development") invoked in BUILD; Skill("simplify")
  invoked in VERIFY (one dedup'd simplification+efficiency fix applied: fold palette[0] distance
  into the nearest-color scan, removing a second dist2 per sampled pixel). No phantom capabilities.
