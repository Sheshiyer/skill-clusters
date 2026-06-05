<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14&height=180&text=business-content&fontSize=42&fontAlignY=38&desc=go-to-market%20writing%20and%20outbound&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-22-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry point for go-to-market writing and outbound: it locates a task on the **lane × audience** map — publish, market, fund, reach — and delegates to the right specialist. Every spoke shares one substrate: a source-derived **Voice Profile**, the market/competitor evidence base, and a per-channel message contract that keeps copy native to its surface and traceable to real sources.

## Hub-and-spoke

```mermaid
graph LR
  o([business-content-orchestrator]):::hub --> c([business-content-core]):::hub
  o --> s1([brand-voice])
  o --> s2([market-research])
  o --> s3([article-writing])
  o --> s4([content-engine])
  o --> s5([seo])
  o --> s6([marketing-campaign])
  o --> s7([investor-materials])
  o --> s8([investor-outreach])
  o --> s9([lead-intelligence])
  o --> s10([social-graph-ranker])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 12 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
| --- | --- | --- |
| `business-content-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `business-content-core` | 📐 hub · shared reference | ✅ enumerated |
| `brand-voice` | spoke | ⤵ on-demand |
| `market-research` | spoke | ⤵ on-demand |
| `article-writing` | spoke | ⤵ on-demand |
| `content-engine` | spoke | ⤵ on-demand |
| `seo` | spoke | ⤵ on-demand |
| `marketing-campaign` | spoke | ⤵ on-demand |
| `investor-materials` | spoke | ⤵ on-demand |
| `investor-outreach` | spoke | ⤵ on-demand |
| `lead-intelligence` | spoke | ⤵ on-demand |
| `social-graph-ranker` | spoke | ⤵ on-demand |
| `aphorisms` | spoke | ⤵ on-demand |
| `writestory` | spoke | ⤵ on-demand |
| `inkos-multi-agent-novel-writing` | spoke | ⤵ on-demand |
| `novel-writer-workflow-guide` | spoke | ⤵ on-demand |
| `natural-dialogue-techniques` | spoke | ⤵ on-demand |
| `internal-comms` | spoke | ⤵ on-demand |
| `ai-product` | spoke | ⤵ on-demand |
| `ai-wrapper-product` | spoke | ⤵ on-demand |
| `micro-saas-launcher` | spoke | ⤵ on-demand |
| `notion-template-business` | spoke | ⤵ on-demand |
| `product-manager` | spoke | ⤵ on-demand |
| `segment-cdp` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate business-content --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@business-content-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT), + mixed: 6 spokes are adapted from antigravity-awesome-skills (MIT). See [NOTICE](../../NOTICE) for the full per-skill provenance.

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
