<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,2,7&height=180&text=backend-architecture&fontSize=42&fontAlignY=38&desc=route%20to%208%20server-side%20specialists&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-8-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-ECC-0ea5e9?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for server-side work: it locates a task on the **layer × concern** map and delegates to one of 8 specialist spokes — architecture boundaries (hexagonal/ports-and-adapters), REST API design, HTTP connector building, NestJS structure, MCP servers, deployment/CI-CD, and decision records. The cross-cutting model every backend shares — the dependency-inversion boundary (domain → ports → adapters), the layering contract, transport conventions, and the runtime matrix — lives in `backend-architecture-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([backend-architecture-orchestrator]):::hub --> c([backend-architecture-core]):::hub
  o --> s1([hexagonal-architecture])
  o --> s2([backend-patterns])
  o --> s3([nestjs-patterns])
  o --> s4([api-design])
  o --> s5([api-connector-builder])
  o --> s6([mcp-server-patterns])
  o --> s7([deployment-patterns])
  o --> s8([architecture-decision-records])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `backend-architecture-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `backend-architecture-core` | 📐 hub · shared reference | ✅ enumerated |
| `hexagonal-architecture` | spoke | ⤵ on-demand |
| `backend-patterns` | spoke | ⤵ on-demand |
| `nestjs-patterns` | spoke | ⤵ on-demand |
| `api-design` | spoke | ⤵ on-demand |
| `api-connector-builder` | spoke | ⤵ on-demand |
| `mcp-server-patterns` | spoke | ⤵ on-demand |
| `deployment-patterns` | spoke | ⤵ on-demand |
| `architecture-decision-records` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@backend-architecture-orchestrator -g -y
```

## Attribution

Spokes adapted from [affaan-m/ECC](../../NOTICE) (MIT). See [NOTICE](../../NOTICE) for full provenance.

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
