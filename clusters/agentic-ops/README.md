<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Agentic%20Ops&fontSize=52&fontAlignY=38&desc=16%20operators%2C%20one%20router%20%E2%80%94%20resolve%20%E2%86%92%20read%20%E2%86%92%20act%20%E2%86%92%20prove&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-18-f59e0b?style=flat)](../../skills.sh.json)
[![Surfaces](https://img.shields.io/badge/surfaces-6-10b981?style=flat)](../../skills/agentic-ops-core/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Real-world operations for autonomous agents — 16 surface specialists behind a single router.**
Operating an inbox, a repo, a tracker, a billing system, or a docs drive? The orchestrator places
your task on the **surface × intent** map and routes; `agentic-ops-core` holds the evidence-first
operator loop they all run.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

18 skills: `agentic-ops-orchestrator` (router) + `agentic-ops-core` (shared model) + 16 operator
specialists. The cluster's job is to make an agent's real-world actions **provable** — the
orchestrator knows which surface to reach for, and the core keeps the one loop every spoke shares
(resolve surface → read live state → smallest reversible action → prove it → report an exact status
word) consistent, so nothing is claimed that wasn't verified.

```mermaid
graph TD
    O["agentic-ops-orchestrator<br/>(hub · surface × intent router)"]
    O --> COMMS["Communication<br/>(email · messages · alerts)"]
    O --> CODE["Code-host & exec<br/>(github · git · terminal)"]
    O --> FLOW["Project flow<br/>(project-flow · jira)"]
    O --> KNOW["Knowledge & docs<br/>(knowledge · workspace)"]
    O --> REV["Revenue<br/>(customer · finance billing)"]
    O --> AUDIT["Audit & observe<br/>(automation · surface · social · dashboards)"]
    COMMS -. references .-> C["agentic-ops-core<br/>(operator loop · surface taxonomy<br/>· status vocabulary · guardrails)"]
    CODE -. references .-> C
    REV -. references .-> C
    AUDIT -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by surface

| Surface | Spokes |
|---|---|
| **Router / model** | `agentic-ops-orchestrator`, `agentic-ops-core` |
| **Communication** | `email-ops`, `messages-ops`, `unified-notifications-ops` |
| **Code-host & execution** | `github-ops`, `git-workflow`, `terminal-ops` |
| **Project flow & trackers** | `project-flow-ops`, `jira-integration` |
| **Knowledge & documents** | `knowledge-ops`, `google-workspace-ops` |
| **Revenue** | `customer-billing-ops`, `finance-billing-ops` |
| **Audit & observability** | `automation-audit-ops`, `workspace-surface-audit`, `connections-optimizer`, `dashboard-builder` |

## The model that ties it together

Every spoke runs the same **evidence-first operator loop**:

```
Resolve surface ──> Read live state ──> Smallest reversible action ──> Prove it ──> Report exact status
```

Read before you write; default to draft / read-only / no-op unless a live action was explicitly
requested; never claim *sent / pushed / fixed / refunded* without naming the proof. Full model —
the surface taxonomy, the status-word contract, the freshness and no-duplicate rules, and the
shared guardrails — in [`agentic-ops-core`](../../skills/agentic-ops-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@agentic-ops-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@terminal-ops -g -y                 # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
