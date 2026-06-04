<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Research%20%26%20Knowledge&fontSize=46&fontAlignY=38&desc=12%20specialists%2C%20one%20router%20%E2%80%94%20lightest%20lane%20first%2C%20every%20claim%20sourced&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-14-10b981?style=flat)](../../skills.sh.json)
[![Evidence](https://img.shields.io/badge/evidence-tiered-6366f1?style=flat)](../../skills/research-knowledge-core/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Research, literature, and codebase knowledge — 12 specialists behind a single router.**
Researching, reviewing the literature, looking something up, or understanding a repo? The
orchestrator places your task on the **question type × evidence depth** map and routes;
`research-knowledge-core` holds the evidence ladder and provenance discipline they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

14 skills: `research-knowledge-orchestrator` (router) + `research-knowledge-core` (shared
model) + 12 specialists. The cluster's job is to make a broad knowledge-gathering toolkit
*navigable and trustworthy* — the orchestrator knows which spoke to reach for, and the core
keeps the cross-cutting discipline (lightest lane first, four provenance tiers, dated &
reproducible sources) consistent across web research, scientific databases, and code comprehension.

```mermaid
graph TD
    O["research-knowledge-orchestrator<br/>(hub · question-type × depth router)"]
    O --> WEB["Current-web<br/>research"]
    O --> LIT["Academic &<br/>scientific literature"]
    O --> CODE["Understand a<br/>codebase"]
    O --> REF["Reference &<br/>memory"]
    WEB -. references .-> C["research-knowledge-core<br/>(evidence ladder · 4 provenance tiers<br/>· freshness · reproducibility)"]
    LIT -. references .-> C
    CODE -. references .-> C
    REF -. references .-> C

    style O fill:#047857,color:#fff
    style C fill:#4338ca,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `research-knowledge-orchestrator`, `research-knowledge-core` |
| **Current-web research** | `research-ops`, `exa-search`, `deep-research` |
| **Academic & scientific literature** | `scientific-thinking-literature-review`, `scientific-thinking-scholar-evaluation`, `scientific-db-pubmed-database`, `scientific-db-uspto-database`, `scientific-pkg-gget` |
| **Understand a codebase** | `codebase-onboarding`, `code-tour` |
| **Reference & memory** | `documentation-lookup`, `ck` |

## The model that ties it together

Two interlocking rules. **Climb the evidence ladder** — start at the cheapest lane that
answers the question and escalate only when synthesis or verification demands it:

```
local / docs / ck memory  →  fast discovery (exa, one DB query)  →  multi-source synthesis  →  evaluation
```

And **label every claim by provenance** — sourced fact · supplied context · inference ·
recommendation — so nothing misleads. Full model in
[`research-knowledge-core`](../../skills/research-knowledge-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@research-knowledge-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@deep-research -g -y                     # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
