---
name: brand-skin-composer
description: Use when reskinning a MotionSites template to a brand, composing a brand-skinned landing page or multi-page site, brand-skinning a template's fonts/palette/copy, or running the reskin/tokenize/assembler pipeline in motionsites-export. Use when a brand kit (e.g. Thoughtseed) should be rendered onto a curated template 1:1.
cluster: design
version: 1.0.0
origin: motionsites-export
---

# Brand-Skin Composer

## Overview

Compose a brand website by rendering a curated **MotionSites template 1:1 in structure + motion + composition** (the IP), and swapping only the **skin** — font / asset / palette / copy — for a target brand. Reskinning doesn't degrade a template; its fonts/stock-assets/copy were always placeholders, so the brand **completes** it.

The engine (Phases 0–5) is built and lives in this repo. This skill is the **operational front door**: the deterministic decision tree over the existing scripts. The formal model, schemas, and determinism map are in [SKILL-SPEC.md](SKILL-SPEC.md).

## When to use

- "Reskin / brand-skin template X to <brand>", "compose a <brand> landing page", "make a <brand> site from a MotionSites template".
- A `brand-kits/<brand>.json` exists (or you'll author one) and a template should render in its fonts/palette/voice.

**Not for:** authoring new template structure (templates are atomic, used whole), or cross-template section recombination — see hard rules in SKILL-SPEC.md §0.

## The front door (run this every time)

**One-command path:** once the choices below are made, `node scripts/compose.mjs <id> [brandKit] [--multi] [--bind] [--capture] [--src <dir>]` executes the reskin (steps 4–7): it auto-routes by template type, defaults to reuse-stock (omit `--bind`), and stays byte-identical on re-run. Step 3 (page scope) is still your call — pass `--multi` for a site. The numbered steps are the contract `compose.mjs` follows.

1. **Brand kit** → pick `brand-kits/<brand>.json` (default `brand-kits/thoughtseed.json`). It is the single source of truth for fonts, palette, voice, nav, `copyOverrides`.

2. **Template** → pick an `id` from `interfaces/<id>.json` by `role` (≈180 hero, 32 features, 9 cta, 7 about, 6 footer, …; see `interfaces/_coverage-report.md`). The id is the basename of `prompts/<id>.txt`.
   - If the user didn't name a template, **propose 2–3 by role and confirm** — don't silently default to the demo (`luxury-botanical`).
   - **Copy caveat (generalize past the demo):** copy only translates for ids present in the kit's `copyOverrides`. If `brand-kits/<brand>.json` has no `copyOverrides[<id>]`, the page renders with the template's *original placeholder copy*. Either add an overrides block for that id, or accept placeholder copy — state which.

3. **ASK page scope — REQUIRED, every run, before codegen.** Do not infer it from singular/plural phrasing. Ask the user:
   - **single-page** → one template, rendered 1:1, keeps the template's own nav (skinned).
   - **multi-page site** → shared brand shell + router over N page-bodies (`reskins/assembler-reference/`), one injected brand nav.

4. **Asset strategy — default = reuse-stock.** Keep the template's own composed media; brand only font/palette/copy. ⇒ run **without `--bind`**. `--bind` (swap media for other MotionSites-pool picks) is opt-in and **composition-risky** — it ignores focal point / text-safe zones (the v2 "Asset Compositional Contract" problem, SKILL-SPEC.md §10). Only use `--bind`, generate-to-fit, or a real brand `assetPool` when explicitly asked.

5. **Route codegen by template type — deterministic, do not re-derive:**

   | Template type | Predicate | Command | Output |
   |---|---|---|---|
   | Single-file HTML | `prompts/<id>.txt` is one self-contained HTML doc (CDN imports) | `node scripts/tokenize.mjs <id> brand-kits/<brand>.json` | `reskins/<id>__<brand>__tokenized.html` |
   | Component-spec | multi-file Vite + Tailwind-v4 `@theme` project dir | `node scripts/reskin-theme.mjs <srcDir> brand-kits/<brand>.json` | edits `<srcDir>` in place (writes `.bak`) |

   Use `tokenize.mjs` (full-palette, polarity-aware), **not** the legacy `reskin.mjs` (accent-only; skips polarity-sensitive neutrals — can't do a dark-mode flip).

6. **Assemble (only if multi-page)** → `node scripts/assemble.mjs <site-manifest.json> [brandKit]` scaffolds a runnable Vite + react-router site from a manifest of N pages: shared brand `Shell.tsx` (glass-pill nav built from the pages) + `main.tsx` router + brand-token `index.css`; each body is copied from its `source` (or stubbed). See `sites/thoughtseed-demo.json`. Inter-page transitions are not yet automated.

7. **Verify** → open the output HTML; for ground-truth, `node scripts/capture-references.mjs <id>` → `references/<id>/*.png` at scroll 0/25/50/75/99%.

**Output-overwrite note:** the output filename is deterministic, so re-running **overwrites** prior output (idempotent — expected). If the target is a committed demo (`luxury-botanical__thoughtseed__tokenized.html`), regenerating it is fine; just confirm the diff before committing.

## Worked example (proven)

luxury-botanical → Thoughtseed, single-page, reuse-stock:

```bash
cd motionsites-export
node scripts/tokenize.mjs luxury-botanical brand-kits/thoughtseed.json   # no --bind
# → reskins/luxury-botanical__thoughtseed__tokenized.html
```

`tokenize.mjs` remaps fonts (Instrument Serif / Inter) by role, rewrites hardcoded colors to `var(--role, …)` so `#000` resolves to `--bg` in one place and `--fg` in another (dark-mode flip, contrast preserved), injects the brand `:root`, applies `copyOverrides["luxury-botanical"]` (Bentley→Thoughtseed), and adds a legibility scrim over the hero `<video>`. Media is untouched. Verify: dark palette, teal accent, "Thoughtseed" wordmark, 600vh orbit motion intact.

## Determinism contract

Every step is a pure function of pinned, committed inputs: immutable corpus (`prompts/`, `interfaces/`), one-time feature vectors (`asset-features.json`), pure cost functions (no RNG), fixed-order role-keyed token rewrite (idempotent). **brand-kit = source of truth · interface = contract bridge · `references/<id>/*.png` = visual ground-truth.** Full map: SKILL-SPEC.md §11.

## Known limits (not yet built)

- `compose.mjs` runs this front door from one command (auto-routes by template type, reuse-stock default); `compose --multi` reskins one body then points at `assemble.mjs`.
- Multi-page **assembly is automated** — `assemble.mjs` scaffolds the Vite + react-router site (shared Shell + router + brand tokens) from a site manifest; **inter-page transitions** are not yet automated. Phase-0 interface parsing is still manual.
- No WCAG-AA contrast guard in the palette transform; component-spec capture needs a build+serve step.
- v2 generate-to-fit (contract-aware asset generation) is specified-only — until then, reuse-stock is the faithful default.
- v1.0 does not cover **arbitrary existing React projects** (only single-file HTML prompts and Vite + Tailwind-v4 component-spec dirs). Refining an existing React site falls back to "skill as reference" — use the brand-kit JSON + tokenized template HTML as design references, port patterns into the React code by hand. See [SKILL-BACKLOG.md](SKILL-BACKLOG.md) for the full v1.1 gap inventory captured from the Thoughtseed landing-page refinement (2026-06-20).
