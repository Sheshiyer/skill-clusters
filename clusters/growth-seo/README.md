<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Growth-SEO&fontSize=52&fontAlignY=38&desc=8%20search%20specialists%2C%20one%20router%20%E2%80%94%20intent%20%E2%86%92%20content%20%E2%86%92%20rank%20%E2%86%92%20AI%20answers&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-10-22c55e?style=flat)](../../skills.sh.json)
[![Tier](https://img.shields.io/badge/tier-active-16a34a?style=flat)](../../README.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Rank, get found, and show up in AI answers — 8 SEO specialists behind a single router.**
Researching demand, planning content, fixing technical issues, or optimizing for AI search? The
orchestrator places your task on the **funnel stage × concern** map and routes; `growth-seo-core`
holds the search-intent model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

10 skills: `growth-seo-orchestrator` (router) + `growth-seo-core` (shared model) + 8 SEO
specialists. The cluster's job is to make a broad SEO toolkit *navigable* — the orchestrator
knows which of the 8 to reach for, and the core keeps the one decision everything turns on —
**search intent → page** — consistent across research, content, architecture, and audit.

```mermaid
graph TD
    O["growth-seo-orchestrator<br/>(hub · funnel × concern router)"]
    O --> UND["Understand<br/>(Google's rules)"]
    O --> RES["Research<br/>(intent · briefs)"]
    O --> ARC["Architect<br/>(site structure)"]
    O --> PRO["Produce<br/>(schema · pSEO)"]
    O --> OPT["Optimize<br/>(audit · AI search)"]
    RES -. references .-> C["growth-seo-core<br/>(search intent → page · one query/page<br/>· intent→type matrix · E-E-A-T · crawl→index→rank)"]
    ARC -. references .-> C
    PRO -. references .-> C
    OPT -. references .-> C

    style O fill:#15803d,color:#fff
    style C fill:#1e3a5f,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `growth-seo-orchestrator`, `growth-seo-core` |
| **Understand** | `google-official-seo-guide` |
| **Research (intent & briefs)** | `searchintentautomation`, `seo-content-brief` |
| **Architect** | `site-architecture` |
| **Produce & enrich** | `schema-markup`, `programmatic-seo` |
| **Optimize** | `seo-audit`, `ai-seo` |

## The decision that ties it together

Every SEO task reduces to one question:

```
Demand (a query) ──has──> Intent ──determines──> Content type ──filled by──> ONE page ──earns──> Visibility
```

Name the query and its intent **before** you write, build, or audit a page; one primary query per
URL (don't cannibalize); match content type to intent; earn rankings with genuine E-E-A-T. AI-search
visibility (AEO/GEO) is downstream of the same foundation, not a separate trick. Full model in
[`growth-seo-core`](../../skills/growth-seo-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@growth-seo-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@seo-audit -g -y                   # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
