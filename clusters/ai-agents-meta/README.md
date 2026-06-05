<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=6,11,20&height=180&text=ai-agents-meta&fontSize=42&fontAlignY=38&desc=route%20AI-agent%20engineering%20tasks&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-53-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-antigravity-ec4899?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The meta layer above any one agent app — *building agents that build*. It locates a task on the lifecycle × concern map (plan → compose → orchestrate → loop → audit → economize → evolve) and routes to a specialist, with one cross-cutting decision every spoke turns on: **eval-first execution behind a default-deny autonomy boundary**.

## Hub-and-spoke

```mermaid
graph LR
  o([ai-agents-meta-orchestrator]):::hub --> c([ai-agents-meta-core]):::hub
  o --> s1([agentic-engineering])
  o --> s2([search-first])
  o --> s3([blueprint])
  o --> s4([plan-orchestrate])
  o --> s5([agentic-os])
  o --> s6([team-agent-orchestration])
  o --> s7([continuous-agent-loop])
  o --> s8([agent-architecture-audit])
  o --> s9([cost-aware-llm-pipeline])
  o --> s10([continuous-learning-v2])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 43 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `ai-agents-meta-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `ai-agents-meta-core` | 📐 hub · shared reference | ✅ enumerated |
| `agentic-engineering` | spoke | ⤵ on-demand |
| `agentic-os` | spoke | ⤵ on-demand |
| `agent-architecture-audit` | spoke | ⤵ on-demand |
| `agent-introspection-debugging` | spoke | ⤵ on-demand |
| `prompt-optimizer` | spoke | ⤵ on-demand |
| `token-budget-advisor` | spoke | ⤵ on-demand |
| `cost-aware-llm-pipeline` | spoke | ⤵ on-demand |
| `team-agent-orchestration` | spoke | ⤵ on-demand |
| `continuous-agent-loop` | spoke | ⤵ on-demand |
| `dynamic-workflow-mode` | spoke | ⤵ on-demand |
| `blueprint` | spoke | ⤵ on-demand |
| `search-first` | spoke | ⤵ on-demand |
| `plan-orchestrate` | spoke | ⤵ on-demand |
| `continuous-learning-v2` | spoke | ⤵ on-demand |
| `swarm-architect` | spoke | ⤵ on-demand |
| `task-master-planner` | spoke | ⤵ on-demand |
| `arch-orchestrator` | spoke | ⤵ on-demand |
| `accesslint-audit` | spoke | ⤵ on-demand |
| `agent-evaluation` | spoke | ⤵ on-demand |
| `agent-memory-systems` | spoke | ⤵ on-demand |
| `agent-tool-builder` | spoke | ⤵ on-demand |
| `bullmq-specialist` | spoke | ⤵ on-demand |
| `context-window-management` | spoke | ⤵ on-demand |
| `conversation-memory` | spoke | ⤵ on-demand |
| `convex` | spoke | ⤵ on-demand |
| …and 28 more | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@ai-agents-meta-orchestrator -g -y
```

## Attribution

Primary source: **antigravity-awesome-skills** (MIT) + mixed (ECC and skills authored for skill-clusters). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
