<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14&height=180&text=python-backend&fontSize=42&fontAlignY=38&desc=Route%20a%20Python%20backend%20task&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-17-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-ECC-0ea5e9?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for Python server-side and ML-engineering work — it locates a task on the framework × lifecycle map (idiomatic Python, pytest/TDD, the Django stack, FastAPI services, the PyTorch/recsys/MLE lane) and delegates to the right specialist. The cross-cutting model every spoke shares — the web/API layer is a thin adapter over a typed, tested core; validate at the boundary; gate every change through the test/verify loop — lives in `python-backend-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([python-backend-orchestrator]):::hub --> c([python-backend-core]):::hub
  o --> s1([python-patterns])
  o --> s2([python-testing])
  o --> s3([django-patterns])
  o --> s4([django-tdd])
  o --> s5([django-security])
  o --> s6([django-celery])
  o --> s7([django-verification])
  o --> s8([fastapi-patterns])
  o --> s9([pytorch-patterns])
  o --> s10([mle-workflow])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 7 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `python-backend-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `python-backend-core` | 📐 hub · shared reference | ✅ enumerated |
| `python-patterns` | spoke | ⤵ on-demand |
| `python-testing` | spoke | ⤵ on-demand |
| `django-patterns` | spoke | ⤵ on-demand |
| `django-tdd` | spoke | ⤵ on-demand |
| `django-verification` | spoke | ⤵ on-demand |
| `django-security` | spoke | ⤵ on-demand |
| `django-celery` | spoke | ⤵ on-demand |
| `fastapi-patterns` | spoke | ⤵ on-demand |
| `pytorch-patterns` | spoke | ⤵ on-demand |
| `recsys-pipeline-architect` | spoke | ⤵ on-demand |
| `mle-workflow` | spoke | ⤵ on-demand |
| `textual` | spoke | ⤵ on-demand |
| `ai-native-cli` | spoke | ⤵ on-demand |
| `discord-bot-architect` | spoke | ⤵ on-demand |
| `hubspot-integration` | spoke | ⤵ on-demand |
| `skill-rails-upgrade` | spoke | ⤵ on-demand |
| `slack-bot-builder` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@python-backend-orchestrator -g -y
```

## Attribution

Primary source: **ECC** (affaan-m/ECC, MIT) — the Python / Django / PyTorch / MLE specialist spokes. Picked-up spokes come from antigravity-awesome-skills (MIT); the FastAPI and recsys spokes are authored for skill-clusters (MIT). Mixed sources — see [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
