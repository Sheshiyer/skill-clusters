<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&text=blockchain-web3&fontSize=42&fontAlignY=38&desc=EVM%20and%20prediction-market%20specialist%20router&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-6-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for EVM and prediction-market work. It places a task on the **surface × concern** map — what is touching value (a contract, an autonomous agent, a market signal) crossed with which failure mode (a silent correctness bug, an exploit, or an unreviewed risk) — and delegates to one of six specialist spokes that share one adversarial on-chain threat model and a non-advisory stance.

## Hub-and-spoke

```mermaid
graph LR
  o([blockchain-web3-orchestrator]):::hub --> c([blockchain-web3-core]):::hub
  o --> s1([defi-amm-security])
  o --> s2([evm-token-decimals])
  o --> s3([llm-trading-agent-security])
  o --> s4([nodejs-keccak256])
  o --> s5([prediction-market-oracle-research])
  o --> s6([prediction-market-risk-review])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `blockchain-web3-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `blockchain-web3-core` | 📐 hub · shared reference | ✅ enumerated |
| `defi-amm-security` | spoke | ⤵ on-demand |
| `evm-token-decimals` | spoke | ⤵ on-demand |
| `llm-trading-agent-security` | spoke | ⤵ on-demand |
| `nodejs-keccak256` | spoke | ⤵ on-demand |
| `prediction-market-oracle-research` | spoke | ⤵ on-demand |
| `prediction-market-risk-review` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate blockchain-web3 --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@blockchain-web3-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT) — derived from [affaan-m/ECC](../../NOTICE) (MIT) + mixed. See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
