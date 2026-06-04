<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,30&height=220&text=Python%20Backend&fontSize=52&fontAlignY=38&desc=11%20specialists%2C%20one%20router%20%E2%80%94%20design%20%E2%86%92%20test%20%E2%86%92%20secure%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-13-f59e0b?style=flat)](../../skills.sh.json)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=flat&logo=python&logoColor=white)](https://www.python.org)
[![Django](https://img.shields.io/badge/Django-DRF-092E20?style=flat&logo=django&logoColor=white)](https://www.djangoproject.com)
[![FastAPI](https://img.shields.io/badge/FastAPI-async-009688?style=flat&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**11 Python backend & ML specialists behind a single router.**
Building, testing, securing, or shipping a Python web or ML backend? The orchestrator places
your task on the **framework × lifecycle** map and routes; `python-backend-core` holds the
thin-adapter model and the Django-vs-FastAPI decision they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,30&height=2" width="100%" />

## What it is

13 skills: `python-backend-orchestrator` (router) + `python-backend-core` (shared model) + 11
specialists spanning the language foundation, the Django stack, FastAPI, and the ML lane. The
cluster makes a broad skill set *navigable* — the orchestrator knows which specialist to reach
for, and the core keeps the interlocking conventions (thin adapter over a typed core, boundary
validation, the test/verify gate) consistent across every spoke.

```mermaid
graph TD
    O["python-backend-orchestrator<br/>(hub · framework × lifecycle router)"]
    O --> FND["Language foundation"]
    O --> DJ["Django lane"]
    O --> FA["FastAPI lane"]
    O --> ML["ML / data lane"]

    FND --> P1["python-patterns"]
    FND --> P2["python-testing"]
    DJ --> D1["django-patterns"]
    DJ --> D2["django-tdd"]
    DJ --> D3["django-security"]
    DJ --> D4["django-celery"]
    DJ --> D5["django-verification"]
    FA --> F1["fastapi-patterns"]
    ML --> M1["pytorch-patterns"]
    ML --> M2["recsys-pipeline-architect"]
    ML --> M3["mle-workflow"]

    P1 -. references .-> C["python-backend-core<br/>(thin adapter · Django vs FastAPI<br/>· boundary validation · test/verify gate)"]
    D1 -. references .-> C
    F1 -. references .-> C
    M3 -. references .-> C

    style O fill:#1d4ed8,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by lane

| Lane | Spokes |
|---|---|
| **Router / model** | `python-backend-orchestrator`, `python-backend-core` |
| **Language foundation** | `python-patterns`, `python-testing` |
| **Django** | `django-patterns`, `django-tdd`, `django-security`, `django-celery`, `django-verification` |
| **FastAPI** | `fastapi-patterns` |
| **ML / data** | `pytorch-patterns`, `recsys-pipeline-architect`, `mle-workflow` |

## The model that ties it together

The web/API layer is a **thin adapter** over a typed, tested core:

```
Request ──> Boundary (validate + parse) ──> Service / domain (typed, framework-free) ──> Persistence
```

Keep business logic out of views/routers; validate every input at the boundary (DRF serializers
or Pydantic models); no feature is done until tests cover it and the verify gate passes. Pick
Django (batteries-included, ORM, admin, DRF) or FastAPI (async-first, schema-driven) once per
service — the tie-breaker and full model live in
[`python-backend-core`](../../skills/python-backend-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@python-backend-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@django-patterns -g -y               # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
