<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=23,20,27&height=220&text=Blockchain%20%2F%20Web3&fontSize=46&fontAlignY=38&desc=On-chain%20is%20immutable%2C%20public%2C%20adversarial%20%E2%80%94%20build%20accordingly&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-8-f59e0b?style=flat)](../../skills.sh.json)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for smart-contract / DeFi / on-chain work.**
The orchestrator routes by concern; `blockchain-web3-core` holds the one fact everything follows
from — **on-chain code is immutable, public, and adversarial.** Spokes extracted from
[affaan-m/ECC](https://github.com/affaan-m/ECC) (MIT, see [NOTICE](../../NOTICE)).

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=23,20,27&height=2" width="100%" />

## What it is

A router + a shared adversarial-threat-model core + security/research spokes. Because a deployed
bug is permanent and exploitable for the contract's full value, the **security model is the spine**
— checks-effects-interactions, no spot-reserve oracles, explicit decimals, and a hard
**non-advisory** stance on the trading/prediction spokes.

```mermaid
graph TD
    O["blockchain-web3-orchestrator<br/>(hub · concern router)"]
    O --> AMM["defi-amm-security<br/>(AMM/vault audit)"]
    O --> DEC["evm-token-decimals<br/>(precision)"]
    O --> AGT["llm-trading-agent-security<br/>(wallet-touching agents)"]
    O --> ORC["prediction-market-oracle-research"]
    O --> RISK["prediction-market-risk-review"]
    O --> HASH["nodejs-keccak256<br/>(hashing util)"]
    AMM -. references .-> C["blockchain-web3-core<br/>(adversarial model · CEI<br/>· oracle safety · non-advisory)"]
    AGT -. references .-> C
    ORC -. references .-> C

    style O fill:#7c2d12,color:#fff
    style C fill:#276749,color:#fff
```

## Skills

| Skill | Role |
|---|---|
| `blockchain-web3-orchestrator` | Router — concern → spoke |
| `blockchain-web3-core` | Adversarial model, CEI, oracle safety, decimals, non-advisory stance |
| `defi-amm-security` | AMM / vault / DeFi security review |
| `evm-token-decimals` | Token decimals & precision bugs |
| `llm-trading-agent-security` | Securing agents that hold a wallet / trade |
| `prediction-market-oracle-research` | Oracle design / manipulation research |
| `prediction-market-risk-review` | Prediction-market risk analysis |
| `nodejs-keccak256` | keccak256 hashing utility (match on-chain) |

## The fact everything turns on

On-chain code is **immutable, public, and adversarial** — anyone can call any function in any
order, all state is readable, transactions are front-runnable (MEV), and a bug is permanent.
Hence: checks-effects-interactions, reentrancy guards, TWAP/multi-source oracles, explicit
decimals, audited primitives, and **non-advisory** trading outputs that never auto-move funds.
Full model in [`blockchain-web3-core`](../../skills/blockchain-web3-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@blockchain-web3-orchestrator -g -y
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (repo = single source of truth):

```bash
./scripts/link-agents.sh --apply
```
