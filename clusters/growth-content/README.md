<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,2,12&height=220&text=Growth%20Content&fontSize=52&fontAlignY=38&desc=13%20specialists%2C%20one%20router%20%E2%80%94%20plan%20%E2%86%92%20write%20%E2%86%92%20convert%20%E2%86%92%20launch&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-15-f59e0b?style=flat)](../../skills.sh.json)
[![Cluster](https://img.shields.io/badge/cluster-growth--content-db2777?style=flat)](./README.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Demand generation and content marketing — 13 specialists behind a single router.**
Planning, writing, converting, or launching marketing content? The orchestrator places your task
on the **funnel stage × asset type** map and routes; `growth-content-core` holds the
searchable-vs-shareable decision and the one positioning doc they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=20,2,12&height=2" width="100%" />

## What it is

15 skills: `growth-content-orchestrator` (router) + `growth-content-core` (shared model) + 13
specialists. The cluster's job is to keep marketing output *navigable and on-strategy* — the
orchestrator knows which spoke to reach for, and the core keeps the interlocking decisions (every
asset is searchable/shareable/both, aimed at one buyer stage, written from one source-of-truth
positioning doc) consistent so the work never drifts into generic AI copy.

```mermaid
graph TD
    O["growth-content-orchestrator<br/>(hub · funnel × asset router)"]
    O --> PLAN["Plan<br/>(strategy · ideas · psychology)"]
    O --> WRITE["Write<br/>(articles · page copy · editing)"]
    O --> CONV["Convert<br/>(magnets · tools · email · ads)"]
    O --> LAUNCH["Launch<br/>(GTM · Product Hunt)"]
    PLAN -. references .-> C["growth-content-core<br/>(searchable vs shareable · buyer stage<br/>· product-marketing-context · VOC)"]
    WRITE -. references .-> C
    CONV -. references .-> C
    LAUNCH -. references .-> C

    style O fill:#be185d,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by stage

| Stage | Spokes |
|---|---|
| **Router / model** | `growth-content-orchestrator`, `growth-content-core` |
| **Foundation (shared)** | `product-marketing-context` |
| **Plan** | `content-strategy`, `marketing-ideas`, `marketing-psychology` |
| **Write** | `content-research-writer`, `copywriting`, `copy-editing` |
| **Convert** | `lead-magnets`, `free-tool-strategy`, `cold-email`, `email-sequence`, `ad-creative` |
| **Launch** | `launch-strategy` |

## The decision that ties it together

Every asset is **searchable, shareable, or both** — named before it's written, aimed at **one
buyer stage**, and drawn from one positioning doc:

```
SEARCHABLE (captures demand) ──┬── BOTH (rank + spread) ──┬── SHAREABLE (creates demand)
   keyword · intent · structure │                          │  insight · emotion · contrarian
                                └──── one buyer stage ──────┘
                          all sourced from .agents/product-marketing-context.md
```

Name the call before you write; serve one stage; pull voice and proof from the context doc — never
invent them. Full model in [`growth-content-core`](../../skills/growth-content-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@growth-content-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@copywriting -g -y                   # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
