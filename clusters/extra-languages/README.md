<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Extra%20Languages&fontSize=48&fontAlignY=38&desc=The%20long%20tail%20%E2%80%94%20niche%20stacks%2C%20one%20router%2C%20native-idiom%20discipline&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-3-9945FF?style=flat)](../../skills.sh.json)
[![Tier](https://img.shields.io/badge/tier-deferred-64748b?style=flat)](../../README.md)
[![Solana](https://img.shields.io/badge/Solana-kit--first-14F195?style=flat&logo=solana&logoColor=black)](https://solana.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for the long tail of language & runtime work.**
The stacks that carry real, version-sensitive knowledge but don't yet warrant their own cluster.
The orchestrator routes by **stack × layer** and decides whether the work even belongs here;
`extra-languages-core` holds the one decision they all turn on — **write the platform's native,
current idiom and contain any legacy/foreign runtime behind an adapter**. For the major languages
see **[rust](../rust)**, **[jvm](../jvm)**, **[python-backend](../python-backend)**, and
**[systems-languages](../systems-languages)**; for EVM see **[blockchain-web3](../blockchain-web3)**.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

A **deferred-tier** cluster: it starts thin and grows by absorbing niche specialists as they
mature. Three skills today — `extra-languages-orchestrator` (router) + `extra-languages-core`
(shared discipline) + the kept specialist `solana-dev`. The cluster's job is to give the long
tail a *consistent front door* and one cross-cutting rule, while keeping it honest: when a spoke
outgrows the drawer, it **graduates** to its own cluster instead of bloating this one.

```mermaid
graph TD
    O["extra-languages-orchestrator<br/>(hub · stack × layer router · scope check)"]
    O --> SOL["solana-dev<br/>(programs · dApp · wallet · tx · tests)"]
    O --> FUTURE["future niche spokes<br/>(added as they mature)"]
    SOL -. references .-> C["extra-languages-core<br/>(native-idiom + contained-boundary rule<br/>· stack×layer matrix · version pinning)"]
    O -. "major languages elsewhere" .-> MAJ["rust · jvm · python-backend<br/>· systems-languages · blockchain-web3 →"]

    style O fill:#7c3aed,color:#fff
    style C fill:#276749,color:#fff
    style SOL fill:#14532d,color:#fff
    style FUTURE fill:#475569,color:#fff,stroke-dasharray: 5 5
    style MAJ fill:#1e293b,color:#fff
```

## Skills

| Skill | Role |
|---|---|
| `extra-languages-orchestrator` | Router — scope check + stack/layer → spoke |
| `extra-languages-core` | The native-idiom + contained-boundary decision, stack×layer matrix, version-pinning, guardrails |
| `solana-dev` | End-to-end Solana — kit-first dApp UI, wallet connect, Anchor/Pinocchio programs, Codama codegen, LiteSVM/Mollusk/Surfpool tests, security, toolchain recovery |

## The decision everything turns on

A niche stack fails by **fighting the platform**, not on algorithms:

```
app code (native idiom) ──> [adapter / compat seam] ──> legacy or foreign runtime
                            ^ types stop here ^
```

Use the stack's **current, blessed** toolkit (for Solana: `@solana/kit` + framework-kit, *not*
`web3.js` by default); when a dependency forces a legacy runtime, isolate it behind one named
adapter so its types never diffuse app-wide. And **pin the toolchain** — this long tail breaks on
version drift more than on logic. Full model in
[`extra-languages-core`](../../skills/extra-languages-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@extra-languages-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@solana-dev -g -y                     # the spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (the repo is the single source of truth):

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
