---
name: design-core
description: "Shared reference for the design cluster (the design cortex): the one decision every design turns on — research-first vs generate-from-defaults — plus the decision ledger, type/space/color conventions, the spoke capability matrix (including brand-site composers and scroll-world cinematics), and the anti-AI-slop quality gate. USE WHEN designing, styling, or polishing any UI or visual artifact and choosing how to ground the work before generating pixels."
cluster: design
version: 1.1.0
---

# Design Core — design cortex

Shared model for the `design` cluster. The methodology, system, engineering, and
brand-site spokes all depend on these concepts — keep them consistent here so no spoke
contradicts another. This file is the **design cortex**: the decision rules every spoke
reads before generating pixels.

## 1. The defining decision: research-first, not generate-from-defaults

A design is **grounded**, never averaged. The failure mode of an AI designer is reaching for
its mean output ("AI slop"): centered hero, generic SaaS gradient, default shadows, Inter at
three sizes. The cluster exists to prevent that. Every design follows one direction of flow:

```
Research references ──> Lock a direction ──> Record decisions (ledger) ──> Generate ──> Check against the slop gate
```

- **Research** — find concrete references before touching layout. `refero-design` makes this mandatory; `ui-ux-pro-max` supplies a searchable database when live references are thin.
- **Lock** — commit to one visual direction (a reference set, a system like Swiss, or a brand). Don't blend three.
- **Ledger** — write down each non-obvious choice and *why* (the reference it came from). This is what makes the result defensible and editable.
- **Gate** — before shipping, check the output against the anti-averaging gate in §5.

**Rule:** when the ask is "make it look good," that means *find references and commit to a
direction* — not improvise from defaults. Skipping research is the one thing that breaks the cluster.

## 2. Conventions every spoke shares

- **Type** on a scale (modular, e.g. 1.25×), not arbitrary px; limit families; weight and size carry hierarchy.
- **Space** on a system (4 / 8 px rhythm); whitespace is a design choice, not leftover.
- **Color** as tokens with explicit roles (primary / secondary / surface / text), enough contrast for accessibility; opacity for hierarchy over new hues.
- **Motion** is purposeful and hardware-accelerated (`transform`/`opacity`), never decorative jank. When motion is *pre-rendered video scrubbed by scroll* (`scroll-world`), the craft moves to frame-identical seams + camera grammar — still purposeful, not decorative.
- **Tokens** (color, type, spacing) are the contract between brand extraction, theming, and build — keep one source of truth.

## 3. Deliverable types & ownership

The frontend is the eventual surface; these spokes own different *stages* before it:

- **Methodology / research** → `refero-design` (default), `ui-ux-pro-max` (DB), `swiss-design` (a ready system).
- **Engineering / spec** → `taste-skill` (senior rules + perf), `stitch-design-taste` (emits an enforceable `DESIGN.md`).
- **Workflow** → `superdesign` (drafts, branch iterations, multi-page flows).
- **Artifact theming** → `theme-factory` (slides/docs/HTML).
- **Static art** → `canvas-design` (`.png`/`.pdf`).
- **Brand input** → `openbrand` (logos/colors/name from a URL → tokens), `brandmint` (full brand kit pipeline).
- **Brand site composition** → `motionskin` (reskin curated MotionSites templates 1:1 structure/motion), `scroll-world` (generate a scroll-scrubbed cinematic 3D-world landing).
- **Film / cinematic language** → `grokfilm` (300-technique GrokFilm index — camera, lighting, composition, genre — as prompt language for stills/video; local corpus + [grokfilm.app](https://grokfilm.app/#index)).

### Brand-site decision (cortex rule)

When the ask is a *branded landing / world*, pick **one** composition path — don't blend:

| Intent | Spoke | What stays fixed | What changes |
|---|---|---|---|
| Reskin a known MotionSites template | `motionskin` | structure + motion | skin (type, palette, copy, assets) |
| Invent a continuous fly-through world | `scroll-world` | scroll→camera scrub mechanic | scenes, art direction, camera architecture |
| Live interactive scroll (GSAP/R3F/etc.) | → **creative-frontend** cluster | runtime animation stack | components / timelines |

Budget rule for `scroll-world`: **state estimated cost and get go before any paid render** (N stills + ~(2N−1) video clips; mobile 9:16 roughly doubles). Seam law: connector endpoints are **actual rendered frames**, never fresh stills.

## 4. Capability matrix

| I need to… | Spoke | Output |
|---|---|---|
| Design a product UI, grounded in references | `refero-design` | layout + rationale |
| Pick styles / palettes / fonts / charts per stack | `ui-ux-pro-max` | design-intelligence lookups |
| Apply an opinionated modernist system | `swiss-design` | Tailwind Swiss styling |
| Hit a senior engineering bar (rules + perf) | `taste-skill` | component architecture |
| Emit a reusable anti-generic spec file | `stitch-design-taste` | `DESIGN.md` |
| Iterate drafts / variations / extra pages | `superdesign` | design-agent run |
| Theme slides / docs / reports / HTML | `theme-factory` | applied theme |
| Make a poster / print-ready art piece | `canvas-design` | `.png` / `.pdf` |
| Extract a brand from a URL | `openbrand` | brand tokens |
| Build a full brand kit (tokens + renders) | `brandmint` | brand kit |
| Reskin a MotionSites template to a brand | `motionskin` | skinned template site |
| Turn a brand into a scroll-scrubbed 3D world | `scroll-world` | cinematic scroll landing |
| Name camera/light/genre language for AI stills or video | `grokfilm` | technique + prompt clause |

### Film language (cortex rule)

When generating **cinematic** stills or motion (brandmint boards, scroll-world dives, Grok Imagine, Higgsfield):

1. Lock brand tokens first (palette / type / subject).
2. Search `grokfilm` for **1–3** techniques (usually 1 camera + 1 lighting, optional genre).
3. Fold their prompt clauses into the shared style preamble — same stack on every scene of a world.
4. Attribute GrokFilm when public work relies on the catalogue.

```bash
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs prompt "luxury lobby night rain" --limit 3
```

## 5. The anti-AI-slop quality gate

Before calling a design done, check it does **not** read as default AI output:

- Did it start from a **real reference**, or from the model's mean? (References required.)
- Is there a **point of view** — one direction committed to — or a blend of three?
- Are type, space, and color on a **system**, or ad-hoc?
- Is there **intentional asymmetry / tension**, or just a centered column with a gradient?
- Could you **defend each choice** from the ledger?
- For `scroll-world`: one **shared style preamble** across stills? seams **frame-identical**? camera architecture matches art direction (A vs B)?
- For cinematic gens: did techniques come from `grokfilm` (named, intentional) or vague "cinematic lighting"?

If any answer is "default," return to §1 step 1.

## 6. Conventions / scope

- Most spokes are **stack-agnostic** craft; `ui-ux-pro-max` carries stack-specific data (React, Next, Vue, Svelte, SwiftUI, RN, Flutter, Tailwind), and `swiss-design` targets Tailwind.
- `openbrand` depends on an external MCP/npm service for live extraction — treat it as the *input* edge that feeds tokens into the rest of the cluster.
- `scroll-world` depends on Monid (default video chain) and/or Higgsfield CLIs + ffmpeg; stills may bill via Codex `image_gen` when present. Origin: [oso95/scroll-world](https://github.com/oso95/scroll-world) (MIT).
- `motionskin` depends on the local substrate at `~/motionsites-skills`.

## 7. Shared guardrails

- **Research before generation**; never average from defaults.
- Commit to **one** direction; don't blend references.
- Keep type / space / color on a **system** with explicit tokens.
- Record non-obvious choices in the **decision ledger** with their source.
- Run the **slop gate** (§5) before shipping any user-facing surface.
- Motion and effects must be purposeful and performant — no decorative jank.
- **Paid generative pipelines** (`scroll-world`, brandmint renders): confirm backend + budget before batch jobs; never silent spend.
