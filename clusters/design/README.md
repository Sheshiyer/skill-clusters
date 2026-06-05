<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Design&fontSize=56&fontAlignY=38&desc=9%20specialists%2C%20one%20router%20%E2%80%94%20research%20%E2%86%92%20lock%20%E2%86%92%20generate%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-11-f59e0b?style=flat)](../../skills.sh.json)
[![Tier](https://img.shields.io/badge/tier-active-22c55e?style=flat)](../../profiles.json)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**A craft cluster — 9 design specialists behind a single router.**
Designing, styling, redesigning, or polishing an interface, artifact, or brand surface? The
orchestrator places your task on the **intent × deliverable** map and routes; `design-core`
holds the research-first gate they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

11 skills: `design-orchestrator` (router) + `design-core` (shared model) + 9 existing
specialists. The cluster's job is to make a strong-but-scattered design skill set *navigable* —
the orchestrator knows which of the 9 to reach for, and the core keeps the one rule that
matters (**research and constraints before generation**, the decision ledger, the anti-AI-slop
gate) consistent across all of them.

```mermaid
graph TD
    O["design-orchestrator<br/>(hub · intent × deliverable router)"]
    O --> RES["Design a product UI<br/>(default · research-first)"]
    O --> ENG["Engineer to a<br/>senior bar / emit a spec"]
    O --> WF["Run a design-agent<br/>workflow"]
    O --> THM["Theme an<br/>artifact"]
    O --> ART["Static<br/>visual art"]
    O --> BR["Brand input<br/>from a URL"]
    RES -. references .-> C["design-core<br/>(research → lock → ledger → generate → slop gate<br/>· type/space/color system · capability matrix)"]
    ENG -. references .-> C
    WF -. references .-> C

    style O fill:#1e293b,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by intent

| Intent | Spokes |
|---|---|
| **Router / model** | `design-orchestrator`, `design-core` |
| **Design a product UI** | `refero-design` (default, research-first), `ui-ux-pro-max` (design-intelligence DB), `swiss-design` (modernist Tailwind system) |
| **Engineer / spec** | `taste-skill` (senior rules + perf), `stitch-design-taste` (emits `DESIGN.md`) |
| **Workflow** | `superdesign` (drafts · branch variations · multi-page flows) |
| **Theme an artifact** | `theme-factory` (slides · docs · reports · HTML) |
| **Static art** | `canvas-design` (`.png` / `.pdf` posters & art) |
| **Brand input** | `openbrand` (logos · colors · backdrops · name from a URL) |

## The rule that ties it together

A design is **grounded, never averaged**:

```
Research references ──> Lock a direction ──> Record decisions (ledger) ──> Generate ──> Check against the slop gate
```

"Make it look good" means *find references and commit to a direction* — not improvise from the
model's defaults. Full model and the anti-AI-slop gate in
[`design-core`](../../skills/design-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@design-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@refero-design -g -y           # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
