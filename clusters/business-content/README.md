<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Business%20Content&fontSize=52&fontAlignY=38&desc=10%20specialists%2C%20one%20router%20%E2%80%94%20voice%20%E2%86%92%20publish%20%E2%86%92%20market%20%E2%86%92%20fund%20%E2%86%92%20reach&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-12-f59e0b?style=flat)](../../skills.sh.json)
[![Cluster](https://img.shields.io/badge/cluster-business--content-7c3aed?style=flat)](./README.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Go-to-market writing and outbound — 10 specialists behind a single router.**
Writing, marketing, fundraising, or doing outbound for a product? The orchestrator places your
task on the **lane × audience** map and routes; `business-content-core` holds the Voice Profile
and evidence model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

12 skills: `business-content-orchestrator` (router) + `business-content-core` (shared model) +
10 specialists. The cluster's job is to keep go-to-market output *navigable and consistent* —
the orchestrator knows which lane to reach for, and the core keeps the interlocking conventions
(one source-derived Voice Profile, sourced evidence, channel-native messaging) consistent so the
writing never collapses into generic AI copy.

```mermaid
graph TD
    O["business-content-orchestrator<br/>(hub · lane × audience router)"]
    O --> PUB["Publish<br/>(articles · content · seo)"]
    O --> MKT["Market<br/>(launch campaign)"]
    O --> FUND["Fund<br/>(materials · outreach)"]
    O --> REACH["Reach<br/>(leads · graph)"]
    PUB -. references .-> C["business-content-core<br/>(VOICE PROFILE · evidence substrate<br/>· channel contract · lane map)"]
    MKT -. references .-> C
    FUND -. references .-> C
    REACH -. references .-> C

    style O fill:#7c3aed,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by lane

| Lane | Spokes |
|---|---|
| **Router / model** | `business-content-orchestrator`, `business-content-core` |
| **Substrate (shared)** | `brand-voice`, `market-research` |
| **Publish** | `article-writing`, `content-engine`, `seo` |
| **Market** | `marketing-campaign` |
| **Fund** | `investor-materials`, `investor-outreach` |
| **Reach** | `lead-intelligence`, `social-graph-ranker` |

## The model that ties it together

Every output is the same pipeline, whatever the lane:

```
Real sources ──> VOICE PROFILE ─┐
                                ├──> Draft ──> Channel-native output
Market facts ──> Evidence ──────┘
```

Build the Voice Profile once and reuse it everywhere; ground every business claim in a real
source; shape each message for its surface (the same copy across email, LinkedIn, and X is a
tell). Full model in [`business-content-core`](../../skills/business-content-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@business-content-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@marketing-campaign -g -y              # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
