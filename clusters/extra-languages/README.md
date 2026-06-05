<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,24,27&height=180&text=extra-languages&fontSize=42&fontAlignY=38&desc=long-tail%20language%20and%20runtime%20work&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-1-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The entry skill for the **long-tail** of language and runtime work — specialists that don't warrant their own first-class cluster yet but carry real, version-sensitive knowledge. It places a task on the **stack × layer** map, decides whether the work truly belongs here (versus a major-language cluster), and delegates to the right spoke; today the kept specialist is end-to-end Solana on-chain + dApp development.

## Hub-and-spoke

```mermaid
graph LR
  o([extra-languages-orchestrator]):::hub --> c([extra-languages-core]):::hub
  o --> s1([solana-dev])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `extra-languages-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `extra-languages-core` | 📐 hub · shared reference | ✅ enumerated |
| `solana-dev` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate extra-languages --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@extra-languages-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
