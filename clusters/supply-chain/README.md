<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Supply%20Chain&fontSize=52&fontAlignY=38&desc=8%20specialists%2C%20one%20router%20%E2%80%94%20plan%20%E2%86%92%20make%20%E2%86%92%20deliver%20%E2%86%92%20return&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-10-f59e0b?style=flat)](../../skills.sh.json)
[![Domain](https://img.shields.io/badge/domain-SCOR-0EA5E9?style=flat)](https://www.ascm.org/corporate-solutions/standards-tools/scor/)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Operational supply-chain expertise — 8 domain specialists behind a single router.**
Planning, making, moving, clearing, or returning goods? The orchestrator places your task on the
**SCOR backbone (Plan → Source → Make → Deliver → Return)** and routes; `supply-chain-core` holds
the service-vs-landed-cost trade-off they all optimize.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

10 skills: `supply-chain-orchestrator` (router) + `supply-chain-core` (shared model) + 8
function specialists drawn from decades of operator experience. The cluster's job is to make a
broad operational domain *navigable* — the orchestrator knows which of the 8 to reach for, and
the core keeps the interlocking ideas (the service/landed-cost trade-off, buffers, the binding
constraint, escalation thresholds) consistent so no spoke contradicts another.

```mermaid
graph TD
    O["supply-chain-orchestrator<br/>(hub · SCOR-backbone router)"]
    O --> PLAN["Plan<br/>inventory-demand-planning"]
    O --> SRC["Source<br/>energy-procurement"]
    O --> MAKE["Make<br/>production-scheduling<br/>quality-nonconformance"]
    O --> DEL["Deliver<br/>carrier-relationship-management<br/>logistics-exception-management<br/>customs-trade-compliance"]
    O --> RET["Return<br/>returns-reverse-logistics"]
    PLAN -. references .-> C["supply-chain-core<br/>(service ⇄ landed-cost trade-off<br/>· binding constraint · buffers · escalation)"]
    MAKE -. references .-> C
    DEL -. references .-> C
    RET -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by SCOR stage

| Stage | Spokes |
|---|---|
| **Router / model** | `supply-chain-orchestrator`, `supply-chain-core` |
| **Plan** | `inventory-demand-planning` |
| **Source** | `energy-procurement` |
| **Make** | `production-scheduling`, `quality-nonconformance` |
| **Deliver** | `carrier-relationship-management`, `logistics-exception-management`, `customs-trade-compliance` |
| **Return** | `returns-reverse-logistics` |

## The model that ties it together

Every function optimizes the **same objective**:

```
maximize Service (OTIF / fill rate)   minimize Total landed cost
   subject to the stage's binding constraint   buffered by deliberate slack
```

Protect the customer promise at the lowest total landed cost; name the binding constraint before
optimizing; price every buffer; honor compliance/safety hard stops. Full model in
[`supply-chain-core`](../../skills/supply-chain-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@supply-chain-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@inventory-demand-planning -g -y     # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
