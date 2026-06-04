<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,2&height=220&text=AI%20Agents%20Meta&fontSize=52&fontAlignY=38&desc=14%20specialists%2C%20one%20router%20%E2%80%94%20plan%20%E2%86%92%20orchestrate%20%E2%86%92%20loop%20%E2%86%92%20audit&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-16-f59e0b?style=flat)](../../skills.sh.json)
[![Layer](https://img.shields.io/badge/layer-meta-7c3aed?style=flat)](../../skills/ai-agents-meta-core/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**The meta cluster — 14 agent-engineering specialists behind a single router.**
Planning, orchestrating, looping, auditing, debugging, or economizing an LLM-agent system? The
orchestrator places your task on the **lifecycle × concern** map and routes;
`ai-agents-meta-core` holds the eval-first, default-deny-autonomy model they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,2&height=2" width="100%" />

## What it is

16 skills: `ai-agents-meta-orchestrator` (router) + `ai-agents-meta-core` (shared model) + 14
specialists for building agents that build. The cluster's job is to make the *meta* layer —
how you design, run, and harden an agent system — navigable: the orchestrator knows which
specialist to reach for, and the core keeps the interlocking ideas (eval gates, autonomy
budgets, the agent stack, cost-routing tiers) consistent across all of them.

```mermaid
graph TD
    O["ai-agents-meta-orchestrator<br/>(hub · lifecycle × concern router)"]
    O --> FND["Foundation<br/>(eval-first · search-first)"]
    O --> PLAN["Plan & compose<br/>(blueprint · plan-orchestrate)"]
    O --> ARCH["Architect runtime<br/>(agentic-os · dynamic-workflow-mode)"]
    O --> ORCH["Orchestrate & loop<br/>(squads · autonomous loops)"]
    O --> AUD["Audit & debug<br/>(12-layer · introspection)"]
    O --> ECON["Prompt & economics<br/>(prompt · cost · token budget)"]
    O --> EVO["Evolve<br/>(continuous-learning-v2)"]
    FND -. references .-> C["ai-agents-meta-core<br/>(eval-first × default-deny autonomy<br/>· agent stack · cost tiers · gate matrix)"]
    PLAN -. references .-> C
    ARCH -. references .-> C
    ORCH -. references .-> C
    AUD -. references .-> C
    ECON -. references .-> C
    EVO -. references .-> C

    style O fill:#7c3aed,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `ai-agents-meta-orchestrator`, `ai-agents-meta-core` |
| **Foundation & discipline** | `agentic-engineering`, `search-first` |
| **Plan & compose** | `blueprint`, `plan-orchestrate` |
| **Architect the runtime** | `agentic-os`, `dynamic-workflow-mode` |
| **Orchestrate & loop** | `team-agent-orchestration`, `continuous-agent-loop` |
| **Audit & debug** | `agent-architecture-audit`, `agent-introspection-debugging` |
| **Prompt & economics** | `prompt-optimizer`, `cost-aware-llm-pipeline`, `token-budget-advisor` |
| **Evolve** | `continuous-learning-v2` |

## The model that ties it together

Every spoke answers one question — *how much can this agent do on its own, and how do we know
it did it right?* The cluster's stance couples two rules:

```
Plan ──gated by──> Eval ──authorizes──> Autonomous step ──bounded by──> Tool / loop budget
```

**Eval-first**: no unattended step ships without a gate that can fail it. **Default-deny
autonomy**: grant the narrowest tool/permission/loop budget that works, and state every
widening. Full model in [`ai-agents-meta-core`](../../skills/ai-agents-meta-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@ai-agents-meta-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@agent-architecture-audit -g -y      # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
