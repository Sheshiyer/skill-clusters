<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8&height=180&text=conductor&fontSize=42&fontAlignY=38&desc=closed-loop%20spec-driven%20build&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-19-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-conducty-f59e0b?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Runs a spec-driven build through the closed conductor loop — shape → plan → execute → verify → improve → review → ship — dispatching each task to the right skill-cluster and closing the feedback loop. Four organs combine: conducty conducts the loop, PAI triages and enforces fail-closed gates around it, spec-kit fronts it, and skill-clusters resolves which capability runs each task.

## Hub-and-spoke

```mermaid
graph LR
  o([conductor-orchestrator]):::hub --> c([conductor-core]):::hub
  o --> s1([conducty-shape])
  o --> s2([conducty-plan])
  o --> s3([conducty-execute])
  o --> s4([conducty-verify])
  o --> s5([conducty-checkpoint])
  o --> s6([conducty-debug])
  o --> s7([conducty-improve])
  o --> s8([conducty-code-review])
  o --> s9([conducty-ship])
  o --> s10([conducty-vault-graph])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 9 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `conductor-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `conductor-core` | 📐 hub · shared reference | ✅ enumerated |
| `conducty-bootstrap` | spoke | ⤵ on-demand |
| `conducty-checkpoint` | spoke | ⤵ on-demand |
| `conducty-code-review` | spoke | ⤵ on-demand |
| `conducty-context` | spoke | ⤵ on-demand |
| `conducty-debug` | spoke | ⤵ on-demand |
| `conducty-dialectic` | spoke | ⤵ on-demand |
| `conducty-execute` | spoke | ⤵ on-demand |
| `conducty-improve` | spoke | ⤵ on-demand |
| `conducty-obsidian` | spoke | ⤵ on-demand |
| `conducty-plan` | spoke | ⤵ on-demand |
| `conducty-review` | spoke | ⤵ on-demand |
| `conducty-shape` | spoke | ⤵ on-demand |
| `conducty-ship` | spoke | ⤵ on-demand |
| `conducty-system` | spoke | ⤵ on-demand |
| `conducty-tdd` | spoke | ⤵ on-demand |
| `conducty-terse` | spoke | ⤵ on-demand |
| `conducty-vault-graph` | spoke | ⤵ on-demand |
| `conducty-verify` | spoke | ⤵ on-demand |
| `conducty-worktrees` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@conductor-orchestrator -g -y
```

## Attribution

The conductor loop spokes derive from [robertbarclayy/conducty](../../NOTICE) (MIT); the `conductor-orchestrator` and `conductor-core` integration layer is authored for skill-clusters (MIT).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
