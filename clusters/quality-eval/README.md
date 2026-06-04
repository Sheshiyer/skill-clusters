<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,20&height=220&text=Quality%20%2B%20Eval&fontSize=52&fontAlignY=38&desc=12%20specialists%2C%20one%20router%20%E2%80%94%20write%20%E2%86%92%20test%20%E2%86%92%20verify%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-14-10b981?style=flat)](../../skills.sh.json)
[![Gates](https://img.shields.io/badge/gates-write%20%E2%86%92%20commit%20%E2%86%92%20CI%20%E2%86%92%20ship-6366f1?style=flat)](../../skills/quality-eval-core/SKILL.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Prove it works — and prove the agent that wrote it works.**
Testing, verifying, evaluating, benchmarking, or hardening code? The orchestrator places
your task on the **gate-stage × subject** map and routes; `quality-eval-core` holds the
four-gate model and the evidence ladder they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=2,12,20&height=2" width="100%" />

## What it is

14 skills: `quality-eval-orchestrator` (router) + `quality-eval-core` (shared model) + 12
specialist spokes covering evaluation, TDD, verification, E2E (web + Windows desktop),
AI-regression and browser QA, error handling, performance benchmarking, write-time linting,
and production-readiness audits. The cluster's job is to make "is this actually done?"
answerable with evidence instead of vibes — the orchestrator knows which gate to reach for,
and the core keeps the interlocking concepts (the four gates, the evidence ladder, `pass@k`,
the AI write-and-review blind spot) consistent.

```mermaid
graph TD
    O["quality-eval-orchestrator<br/>(hub · gate-stage × subject router)"]
    O --> EVAL["Evaluate &<br/>compare agents"]
    O --> WRITE["Write correctly<br/>(TDD · errors)"]
    O --> VERIFY["Verify a change<br/>is finished"]
    O --> E2E["Test behavior<br/>end-to-end"]
    O --> PERF["Benchmark<br/>performance"]
    O --> SHIP["Guard quality ·<br/>ship-readiness"]

    EVAL -. references .-> C["quality-eval-core<br/>(four gates · evidence ladder<br/>· pass@k · write-and-review blind spot)"]
    WRITE -. references .-> C
    VERIFY -. references .-> C
    E2E -. references .-> C
    PERF -. references .-> C
    SHIP -. references .-> C

    style O fill:#047857,color:#fff
    style C fill:#4338ca,color:#fff
```

## Skills by gate stage

| Gate stage | Spokes |
|---|---|
| **Router / model** | `quality-eval-orchestrator`, `quality-eval-core` |
| **Evaluate & compare** | `eval-harness`, `agent-eval` |
| **Write correctly** | `tdd-workflow`, `error-handling` |
| **Verify (commit-time)** | `verification-loop`, `ai-regression-testing` |
| **Test end-to-end (CI)** | `e2e-testing`, `windows-desktop-e2e`, `browser-qa` |
| **Benchmark** | `benchmark` |
| **Guard & ship** | `plankton-code-quality`, `production-audit` |

## The model that ties it together

Quality is enforced at **four gates**, cheapest-and-earliest first — each catches a
different failure class:

```
Edit ──write──> Commit ──commit──> CI ──build──> Release ──ship──> Prod
```

Push every check to the **earliest** gate that can catch it; climb the **evidence ladder**
(asserted → ran → tested → measured → reproduced) before claiming a pass; judge anything
stochastic by its `pass@k` **rate**, not a lucky single green run; and never let the thing
under test grade itself. Full model in
[`quality-eval-core`](../../skills/quality-eval-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@quality-eval-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@e2e-testing -g -y                 # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
