---
name: design-orchestrator
description: "Route a UI/visual-design task to the right skill among design specialists — research-first methodology, design-intelligence database, style systems, senior engineering rules, spec emitters, design-agent workflows, theming, static art, brand extraction, MotionSites brand reskin, and scroll-scrubbed 3D world landings. USE WHEN a user is designing, styling, redesigning, or polishing an interface, artifact, or brand surface but hasn't named the specific skill or approach."
cluster: design
version: 1.2.0
---

# Design Orchestrator

The single entry skill for design work. It locates the task on the **intent × deliverable**
map and delegates to specialist spokes. The cross-cutting model every design task
shares — **research and constraints before generation**, the decision ledger, and the
anti-AI-slop quality gate — lives in `design-core` (the design cortex); read it before
generating any pixels.

## Routing map (intent → spoke)

**Design a real product UI (default path)**
- Any interface, landing page, dashboard, redesign, or visual polish → `refero-design` *(research is mandatory — reference before implementation)*
- Need styles / palettes / font pairings / chart types per stack → `ui-ux-pro-max` *(searchable design-intelligence DB)*
- Want a specific, opinionated look applied → `swiss-design` *(Swiss/modernist system in Tailwind)*

**Engineer the interface to a senior bar**
- Metric-based rules, component architecture, motion, hardware-accelerated performance → `taste-skill`
- Emit a reusable, agent-enforceable spec file (anti-generic standards) → `stitch-design-taste` *(produces DESIGN.md)*

**Run a design-agent workflow**
- Iterate drafts / branch variations / extend to more pages from a component → `superdesign`

**Theme an existing artifact**
- Apply or generate a theme for slides, docs, reports, or HTML → `theme-factory`

**Produce static visual art**
- Poster, art piece, print-ready `.png` / `.pdf` → `canvas-design`

**Pull brand identity from the web**
- Extract logos, colors, backdrops, brand name from a URL → `openbrand`

**Reskin a MotionSites template to a brand (structure/motion 1:1)**
- Compose a brand site from curated MotionSites templates — swap skin only (type, palette, copy, assets) → `motionskin` *(substrate + scripts: `~/motionsites-skills`; pairs with `brandmint` for brand tokens)*

**Turn a brand into a scroll-scrubbed 3D world (cinematic flight)**
- Immersive continuous camera fly-through landing — AI scene stills + seamless video chain scrubbed by scroll → `scroll-world` *(origin: [oso95/scroll-world](https://github.com/oso95/scroll-world); Monid/Higgsfield pipeline; not live GSAP — that is creative-frontend)*

**Ground AI visuals in real cinema language**
- Camera / lighting / composition / genre prompt craft from the GrokFilm technique index → `grokfilm` *([grokfilm.app/#index](https://grokfilm.app/#index); local 300-technique corpus; pair with brandmint tokens before generate)*

## Standard Operating Flow

1. Locate the task on **intent × deliverable**: is the output a *product UI*, a *spec*, a *themed artifact*, *static art*, *brand data*, a *MotionSites reskin*, or a *scroll-world cinematic*?
2. If the output is a product UI or anything user-facing, pull the gate from `design-core` first — **research → lock references → ledger decisions → generate → check against the slop gate.** Skipping research is the failure mode. For `scroll-world`, also lock art direction + camera architecture before any paid render.
3. Delegate to the spoke(s). Multi-step asks fan out in deliverable order (e.g. "brand this landing page" → `openbrand` for tokens → `refero-design` for the layout → `taste-skill` for the build; "make our company a scrollable 3D world" → `openbrand`/`brandmint` → `scroll-world`).
4. Return: chosen spoke(s), the references/constraints that anchored the work, the deliverable type, and the next action.

## Guardrails

See `design-core`. In short: **research before generation** — never average from the model's
defaults; ground every choice in a concrete reference and record it in the decision ledger.
Keep type scale, spacing, and color on a system, not ad-hoc. Treat "make it look good" as a
request to *find references and commit to a direction*, not to improvise. The cluster's value
is craft that resists generic AI output — don't quietly fall back to the default look.

## Loading spokes on demand

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as
skills — only this orchestrator and its `*-core` are enumerated. When you route to a spoke
named above, **load it on demand** by reading its file:

`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`  (or `skills/<spoke-name>/SKILL.md` inside the skill-clusters repo).
