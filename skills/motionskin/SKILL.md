---
name: motionskin
description: "Compose a coherent brand website by reskinning curated MotionSites landing-page templates to a brand — structure/motion preserved 1:1, only the skin (type, palette, copy, assets) swapped in. USE WHEN reskin a MotionSites template to a brand, build/port a brand landing page from a template, generate a brand hero/bg/section asset that fits a template slot, capture template reference frames, or compose a multi-page brand site."
cluster: design
version: 1.0.0
origin: "Sheshiyer/motionsites-skills (local)"
---

# motionskin — MotionSites → brand site composer

> **Canonical handle:** `motionskin` (skills.sh / skill-clusters). Legacy local name was `_MOTIONSKIN` — agents may still resolve that alias.


**Repo (scripts + substrate):** `/Users/sheshnarayaniyer/motionsites-skills`
(public mirror `Sheshiyer/motionsites-skills`). Full spec + math model (M1–M5) + roadmap: `SKILL-SPEC.md` there.

## Principle
A template's **structure + motion render 1:1 (verbatim)**; only its **skin** — font, palette, copy, assets —
becomes the brand. The skin was always placeholder; swapping it *completes* the template. Multi-page
coherence = the *same brand skin on every page* (skin-invariance), not one layout. **Assets are the hard
skin:** composed to a slot's *compositional contract* (placement / crop / text-safe zones / focal / motion),
not matched by pixels.

## Pipeline / tools (all in `scripts/`)
| step | script | does |
|---|---|---|
| fetch | `fetch-motionsites.mjs` | incremental, rate-limited, resumable catalog + media pull (no-refresh auth) |
| organize | `organize-assets.mjs` | media → `assets/<template>/…`, per-template + `_shared` |
| formalize | `interfaces/*.json` (Phase 0) | typed slots + skin surface + mechanic per template |
| asset features | `extract-asset-features.mjs` | aspect / CIELAB color / duration / alpha → `asset-features.json` |
| match (M1) | `match.mjs` | asset↔slot assignment (aspect log-ratio, alpha, duration, color cohesion) |
| reskin single-file | `reskin.mjs` + `tokenize.mjs` | M2/M3 + polarity-correct color tokenization + scrim + copy + `--bind` |
| reskin @theme | `reskin-theme.mjs` | multi-file Tailwind-v4 component templates (`--restore` reverts via `.bak`) |
| capture | `capture-references.mjs` | render template → reference frames at scroll states (the visual contract; also the verify step) |
| assemble | `reskins/assembler-reference/` | shared brand Shell + react-router over N page-bodies |

## Routing
- **"reskin template X to brand Y"** → pick the path by the template's `techDelivery` (its interface):
  single-file CDN → `tokenize.mjs X brand-kits/Y.json`; Tailwind-v4 `@theme` → `reskin-theme.mjs <srcDir> Y`.
- **"make a brand asset that fits slot Z"** → *generate-to-fit*: read the slot's `notes` (interface) + capture
  its reference frame → compose a generation brief that **keeps the composition, swaps the subject to the
  brand**. See `Evidence.md` (neural-interface → thoughtseed-hero.mp4 is the golden example).
- **"build a multi-page brand site"** → reskin the chosen templates → mount each body inside the Shell (assembler-reference) under one nav + router.
- **"capture references"** → `capture-references.mjs <id …>` or `--all` (incremental).

## Gotchas
- **Reskin ≠ literal replace.** A literal `#000` is both a background and a text color across one template;
  string-replacing it inverts contrast. Use `tokenize.mjs` (role-based `var(--role, default)` by CSS property/
  utility) so light→dark **polarity flips while contrast holds**. `@theme` templates are already tokenized.
- **Assets fit a *contract*, not an aspect.** A "16:9 video" is not interchangeable — the original's subject
  placement + text-safe zones are the contract. Capture the reference frame, then *generate* the brand asset to
  it. Naive `--bind` looks generic until a real per-brand pool exists.
- **Scroll-driven assets are temporal.** Capture multiple scroll states; e.g. a scroll-*scrubbed* hero
  (`video.currentTime ← scroll`) must read frame-by-frame, not autoplay — and survive blur/scale on scroll.
- **Atomic templates.** Keep only the template's *own* sectioning; never slice finer or recombine across templates.
- **Shell, not bypass.** Multi-page coherence breaks the moment a page opts out of the shared nav (the
  `landingpage-ts-2026` Philosophy `IMMERSIVE_ROUTES` bug). Every body mounts inside the Shell.
- **Fetcher auth:** never auto-refresh the Supabase token (refresh rotation signs the browser out); paste a
  fresh access token, no refresh. The fetcher is rate-limited + resumable (it survived a session limit mid-run).
- **`capture-references.mjs`** resolves Playwright from the `landingpage-ts-2026` install; component-spec
  templates return `needs-build` (codegen→build→capture is the follow-on path).

## Status
**v1 built** — reskin both paths, scrim/copy/M1-binding, assembler. **v2 in progress** — capture pass built;
*contract extraction* + *generate-to-fit* are next. Real worked examples accumulate in `Evidence.md`.
See `SKILL-SPEC.md` §8 (status) / §9 (v1.1 backlog) / §10 (Asset Compositional Contract — the crux).
