---
task: brandmint logo / visual-identity generator (issue #26)
slug: 20260607-034120_brandmint-logo-generator
effort: standard
phase: complete
progress: 16/16
mode: interactive
started: 2026-06-07T03:41:20+0530
updated: 2026-06-07T03:52:00+0530
---

## Context

Issue #26: build the **generic brandmint logo / visual-identity capability** — `taste/scripts/gen-logo.mjs`.
It turns a **canonical brand-spec.json** (the validated contract emitted by brandmint, schema at
`taste/schemas/brand-spec.schema.json`) into a clean SVG logo system **deterministically** — no AI, no
network, no spend. This is the generic counterpart to Fitcheck's bespoke hand-built checkmark logo
(`fitcheck-landing/assets/{mark,logo,logo-dark}.svg`), which must stay untouched.

The lockup is reverse-engineered from the real Fitcheck assets: 300×64 viewBox, rounded-square mark
(rx 15) on the left filled with palette[1] (dark), accent glyph in palette[0]; wordmark at x≈80,
baseline y 43.5, system sans stack, font-size 38, weight 800, letter-spacing -1.2, with a trailing
accent-color `.` dot. The dark variant drops the square (accent-stroke mark), uses near-white #F7F7FB
for the wordmark. The generator generalizes this to ANY name/palette with a **monogram** mark
(`name[0]`) instead of Fitcheck's bespoke checkmark.

`genLogo(brandSpec)` is a PURE function (no I/O, no network) returning `{markSvg, logoSvg, logoDarkSvg}`
— so it's unit-testable under `node --test` like the repo's other pure cores (`composeBrandDNA`,
`emitBrandSpec`). The CLI (`node gen-logo.mjs <spec.json> <out-dir>`) writes `mark.svg`, `logo.svg`,
`logo-dark.svg`, guarded behind the repo's standard `isMain` check so importing for tests is
side-effect-free.

Requested: pure fn + CLI + TDD test + render proof on canonical HDILINT spec.
NOT requested: git commit/push, touching fitcheck-landing/assets, AI/network/spend, web fonts,
dependencies, a separate report file.

### Risks
- **Short palette**: a spec could give <2 hex values → near-white/dark must have safe fallbacks.
- **XML safety**: `identity.name` with `&`, `<`, `>`, `"` would corrupt the SVG → must escape.
- **Initial selection**: name could start with a combining char/emoji or lowercase → take first
  visible char, uppercase it for the monogram.
- **Wordmark width**: long names overflow a fixed 300 viewBox → width must scale to name length so
  `rsvg-convert` produces a non-clipped PNG.
- **Purity**: building SVGs must not mutate the input spec object (no sorting palette in place, etc.).

## Criteria

- [x] ISC-1: `gen-logo.mjs` exports a `genLogo` function (named export)
- [x] ISC-2: `genLogo(spec)` returns object with markSvg, logoSvg, logoDarkSvg keys
- [x] ISC-3: all three returned values are non-empty strings starting with `<svg`
- [x] ISC-4: markSvg viewBox is 64x64 (favicon-friendly square)
- [x] ISC-5: markSvg contains the brand initial (uppercased name[0])
- [x] ISC-6: markSvg contains palette[0] (accent) and palette[1] (dark) hexes
- [x] ISC-7: logoSvg contains the full brand name text
- [x] ISC-8: logoSvg contains palette[0] accent hex
- [x] ISC-9: logoSvg wordmark fill uses palette[1] (dark on light bg)
- [x] ISC-10: logoDarkSvg contains the full brand name text
- [x] ISC-11: logoDarkSvg contains palette[0] accent hex
- [x] ISC-12: genLogo is pure — same input yields byte-identical output
- [x] ISC-13: genLogo does not mutate the input brandSpec object
- [x] ISC-14: XML-special chars in name are escaped (no raw `&`/`<` in output)
- [x] ISC-15: CLI writes mark.svg, logo.svg, logo-dark.svg to out-dir, guarded by isMain
- [x] ISC-16: CLI run on HDILINT brand-spec → rsvg-convert renders logo.svg to a valid PNG

## Decisions

- **Monogram, not bespoke glyph**: the generic capability uses `name[0]` (uppercased, surrogate-safe
  via spread) in a rounded square — Fitcheck's checkmark stays bespoke in fitcheck-landing/assets.
- **Reused the exact reference lockup numbers** (rx, font stack, size 38, weight 800, tracking -1.2,
  baseline 43.5, accent `.` tspan, near-white #F7F7FB) so generated output matches the hand-built
  Fitcheck system's proportions but generalizes to any name/palette.
- **Dynamic lockup width** (`80 + codepoints*22 + 18`) so long names don't clip in a fixed 300 box;
  "Fitcheck" lands at 274.
- **Dark-lockup mark is outlined** (accent stroke, no fill) rather than a solid square, so it reads on
  a dark hero without a heavy block — consistent with assets/logo-dark.svg dropping the filled square.
- **Local `esc()` + fallbacks**: no XML-escape helper exists in the wing (the one `&amp;` ref in
  crawl-codrops.mjs un-escapes, opposite direction), so a local escaper is correct, not duplication.
  Palette fallbacks (#FF6B35/#1A1A2E) guard under-specified specs from leaking `undefined`.

## Verification

**Test (`node --test taste/scripts/gen-logo.test.mjs`): 9 tests, 9 pass, 0 fail.** RED confirmed first
(ERR_MODULE_NOT_FOUND before gen-logo.mjs existed), then GREEN after the minimal implementation, then
still GREEN after the simplify tightening.

- ISC-1..3: "three non-empty SVG strings" test — all 3 keys are strings, non-empty, `^<svg`…`</svg>$`.
- ISC-4..6: "64x64 monogram" test — `viewBox="0 0 64 64"`, `>F<`, `#FF6B35` + `#1A1A2E` all present.
- ISC-7..9: "light lockup" test — `/Fitcheck/`, `#FF6B35`, and `fill="#1A1A2E"…>Fitcheck` (dark wordmark).
- ISC-10..11: "dark lockup" test — `/Fitcheck/`, `#FF6B35`, and NOT dark-on-dark.
- ISC-12: "pure" test — `deepEqual(genLogo(SPEC), genLogo(SPEC))`.
- ISC-13: "no mutation" test — `JSON.stringify(SPEC)` identical before/after.
- ISC-14: "XML escape" test — `M&Co <X>` → `M&amp;Co &lt;X&gt;`, no unescaped `&` in any output.
- ISC-5/short-palette/lowercase: extra tests — `undefined`-leak guard + `acme`→`A` uppercasing.
- ISC-15: CLI run `node gen-logo.mjs HDILINT/brand-spec.json /tmp/fitcheck-logo-gen` wrote all three
  files; tests import genLogo without triggering main() → isMain guard verified.
- ISC-16: `rsvg-convert logo.svg -w 600 -o /tmp/genlogo.png` → `PNG image data, 600 x 141, 8-bit RGBA`;
  mark.svg + logo-dark.svg also render to valid PNGs; visually confirmed on-brand (accent F monogram,
  dark wordmark, accent dot — matches the hand-built Fitcheck lockup).

**Capabilities invoked**: test-driven-development (Skill, governed RED→GREEN) and simplify (Skill,
4-angle review — code clean, one redundant `String()` coercion tightened). fitcheck-landing/assets
untouched; no git commit/push; no network/AI/spend.
