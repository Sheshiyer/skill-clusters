<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Security&fontSize=52&fontAlignY=38&desc=Six%20specialists%2C%20one%20router%20%E2%80%94%20defend%20%C3%97%20attack%20over%20code%2C%20config%20%26%20runtime&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-8-ef4444?style=flat)](../../skills.sh.json)
[![Posture](https://img.shields.io/badge/posture-default--deny-dc2626?style=flat&logo=shieldsdotio&logoColor=white)](../../skills/security-core/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Six security specialists behind a single router.**
Securing, auditing, hardening, or attacking a codebase or an agent setup? The orchestrator places
your task on the **posture × surface** map and routes; `security-core` holds the trust-boundary
model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

8 skills: `security-orchestrator` (router) + `security-core` (shared model) + 6 specialist
spokes. The cluster's job is to make security work *navigable* — the orchestrator knows which
of the six to reach for across the *defend vs attack* × *code / agent-config / runtime* matrix,
and the core keeps the one idea they all turn on — the **trust boundary** (untrusted input/action
reaching a privileged sink, contained by default-deny) — consistent.

```mermaid
graph TD
    O["security-orchestrator<br/>(hub · posture × surface router)"]
    O --> RV["security-review<br/>(defend · code)"]
    O --> BH["security-bounty-hunter<br/>(attack · code)"]
    O --> SC["security-scan<br/>(audit · agent-config)"]
    O --> RS["repo-scan<br/>(audit · source tree)"]
    O --> GG["gateguard<br/>(contain · investigate)"]
    O --> SG["safety-guard<br/>(contain · destructive ops)"]

    RV -. references .-> C["security-core<br/>(trust boundary · default-deny<br/>· severity & exploitability · tooling matrix)"]
    BH -. references .-> C
    SC -. references .-> C
    RS -. references .-> C
    GG -. references .-> C
    SG -. references .-> C

    style O fill:#b91c1c,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `security-orchestrator`, `security-core` |
| **Defend — code** | `security-review` |
| **Attack — code** | `security-bounty-hunter` |
| **Audit — agent config** | `security-scan` |
| **Audit — source tree** | `repo-scan` |
| **Contain — runtime** | `gateguard`, `safety-guard` |

## The model that ties it together

Every security question reduces to one thing — **can attacker-controlled input or action reach a
privileged sink, and what contains it?**

```
Untrusted source ──reaches──> Sink (privileged effect) ──contained by──> Control (default-deny)
```

A finding is real only when a reachable path connects an untrusted source to a meaningful sink;
a control is sound only when it grants the narrowest access that works and never widens silently.
Full model in [`security-core`](../../skills/security-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@security-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@security-review -g -y           # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
