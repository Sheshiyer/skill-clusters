<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=8,13,24&height=180&text=explee-master&fontSize=42&fontAlignY=38&desc=Route%20Explee%20Search%2C%20Enrichment%2C%20Agents%2C%20and%20AutoGTM&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-12-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-author%20%2B%20import-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The Explee product cluster routes GTM and data tasks across Search, Enrichment, AI Agents, AutoGTM, and auth context. It keeps the older product skills and the imported Explee-native skills in one deferred capability surface so Hermes can invoke the right branch without relying on local external symlinks.

## Hub-and-spoke

```mermaid
graph LR
  o([explee-master-orchestrator]):::hub
  o --> s1([explee-product-search])
  o --> s2([explee-product-enrichment])
  o --> s3([explee-product-autogtm])
  o --> s4([explee-product-ai-agents])
  o --> s5([explee-api-cookie-access])
  o --> s6([explee-orchestrator])
  o --> s7([explee-search])
  o --> s8([explee-enrichment])
  o --> s9([explee-agents])
  o --> s10([explee-autogtm])
  classDef hub fill:#8b5cf6,color:#fff;
```

_...and 2 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `explee-master-orchestrator` | 🧭 hub · router | ⤵ deferred |
| `explee-product-search` | spoke | ⤵ on-demand |
| `explee-product-enrichment` | spoke | ⤵ on-demand |
| `explee-product-autogtm` | spoke | ⤵ on-demand |
| `explee-product-ai-agents` | spoke | ⤵ on-demand |
| `explee-api-cookie-access` | spoke | ⤵ on-demand |
| `explee-orchestrator` | spoke | ⤵ on-demand |
| `explee-search` | spoke | ⤵ on-demand |
| `explee-enrichment` | spoke | ⤵ on-demand |
| `explee-agents` | spoke | ⤵ on-demand |
| `explee-autogtm` | spoke | ⤵ on-demand |
| `explee-api-core` | spoke | ⤵ on-demand |
| `explee-auth-cookie` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate explee-master --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@explee-master-orchestrator -g -y
```

## Attribution

Authored for skill-clusters, with imported Explee-native skills from `Sheshiyer/explee-skills`. See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
