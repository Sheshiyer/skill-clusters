<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,30&height=220&text=Backend%20Architecture&fontSize=48&fontAlignY=38&desc=8%20specialists%2C%20one%20router%20%E2%80%94%20shape%20%E2%86%92%20design%20%E2%86%92%20integrate%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-10-f59e0b?style=flat)](../../skills.sh.json)
[![Cluster](https://img.shields.io/badge/cluster-backend--architecture-3178C6?style=flat&logo=node.js&logoColor=white)](../../skills/backend-architecture-orchestrator/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**8 server-side specialists behind a single router.**
Designing, building, integrating, or shipping a backend? The orchestrator places your task on the
**layer × concern** map and routes; `backend-architecture-core` holds the dependency-inversion
boundary they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,30&height=2" width="100%" />

## What it is

10 skills: `backend-architecture-orchestrator` (router) + `backend-architecture-core`
(shared model) + 8 specialists. The cluster's job is to keep a backend's business logic
independent of frameworks and I/O — the orchestrator knows which specialist to reach for, and
the core keeps the interlocking layering rules (domain → ports → adapters, transport conventions,
runtime matrix) consistent.

```mermaid
graph TD
    O["backend-architecture-orchestrator<br/>(hub · layer × concern router)"]
    O --> SHAPE["Shape architecture<br/>(hexagonal · patterns · nestjs)"]
    O --> API["Design API surface<br/>(rest · connectors · mcp)"]
    O --> SHIP["Ship & record<br/>(deploy · ADRs)"]

    SHAPE --> HEX["hexagonal-architecture"]
    SHAPE --> BP["backend-patterns"]
    SHAPE --> NEST["nestjs-patterns"]
    API --> AD["api-design"]
    API --> ACB["api-connector-builder"]
    API --> MCP["mcp-server-patterns"]
    SHIP --> DEP["deployment-patterns"]
    SHIP --> ADR["architecture-decision-records"]

    HEX -. references .-> C["backend-architecture-core<br/>(domain → ports → adapters<br/>· layering contract · transport · runtime matrix)"]
    BP -. references .-> C
    NEST -. references .-> C
    AD -. references .-> C
    ACB -. references .-> C
    MCP -. references .-> C
    DEP -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `backend-architecture-orchestrator`, `backend-architecture-core` |
| **Shape architecture** | `hexagonal-architecture`, `backend-patterns`, `nestjs-patterns` |
| **Design API surface** | `api-design`, `api-connector-builder`, `mcp-server-patterns` |
| **Ship & record** | `deployment-patterns`, `architecture-decision-records` |

## The model that ties it together

**Dependencies point inward** — the domain never imports a framework, driver, or HTTP client:

```
HTTP · CLI · queue ──> [Port] ──> Domain + Use cases ──> [Port] ──> DB · API · bus · cache
   inbound adapters                (no framework imports)            outbound adapters
```

Put a port between business logic and anything swappable; validate at the transport boundary;
match the repo's existing pattern instead of inventing a second architecture. Full model in
[`backend-architecture-core`](../../skills/backend-architecture-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@backend-architecture-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@hexagonal-architecture -g -y              # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
