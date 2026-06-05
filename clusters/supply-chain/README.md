<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,20&height=180&text=supply-chain&fontSize=42&fontAlignY=38&desc=Plan%20Source%20Make%20Deliver%20Return&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-8-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-ECC-0ea5e9?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a supply-chain task along the SCOR backbone (Plan → Source → Make → Deliver → Return) to one of 8 specialists — demand & inventory planning, production scheduling, quality/non-conformance, carrier relationships, logistics exceptions, customs & trade compliance, returns/reverse logistics, and energy procurement. Every spoke optimizes the **same objective with different levers**: protect the customer promise (OTIF / fill rate) at the lowest total landed cost under a binding constraint.

## Hub-and-spoke

```mermaid
graph LR
  o([supply-chain-orchestrator]):::hub --> c([supply-chain-core]):::hub
  o --> s1([inventory-demand-planning])
  o --> s2([production-scheduling])
  o --> s3([quality-nonconformance])
  o --> s4([carrier-relationship-management])
  o --> s5([logistics-exception-management])
  o --> s6([customs-trade-compliance])
  o --> s7([returns-reverse-logistics])
  o --> s8([energy-procurement])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `supply-chain-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `supply-chain-core` | 📐 hub · shared reference | ✅ enumerated |
| `inventory-demand-planning` | spoke | ⤵ on-demand |
| `production-scheduling` | spoke | ⤵ on-demand |
| `quality-nonconformance` | spoke | ⤵ on-demand |
| `carrier-relationship-management` | spoke | ⤵ on-demand |
| `logistics-exception-management` | spoke | ⤵ on-demand |
| `customs-trade-compliance` | spoke | ⤵ on-demand |
| `returns-reverse-logistics` | spoke | ⤵ on-demand |
| `energy-procurement` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate supply-chain --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@supply-chain-orchestrator -g -y
```

## Attribution

Adapted from [affaan-m/ECC](../../NOTICE) (MIT). All 8 spokes in this cluster originate from ECC.

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
