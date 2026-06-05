---
name: python-backend-orchestrator
description: "Route a Python backend task to the right specialist — idiomatic Python, pytest/TDD, the Django stack (patterns, TDD, security, Celery, verification), FastAPI services, and the ML lane (PyTorch, recsys pipelines, MLE workflow). USE WHEN building, testing, securing, or shipping a Python web/ML backend but the specific framework or concern hasn't been named yet."
cluster: python-backend
version: 1.0.0
---

# Python Backend Orchestrator

The single entry skill for Python server-side and ML-engineering work. It locates the task on
the **framework × lifecycle** map and delegates to one of 11 specialist spokes. The
cross-cutting model every Python backend shares — *the web/API layer is a thin adapter over a
typed, tested core; validate at the boundary; gate every change through the test/verify loop* —
lives in `python-backend-core`; read it before choosing a framework or wiring persistence.

## Cluster map (spoke → role)

**Language foundation (framework-agnostic)**
- `python-patterns` — idiomatic Python, PEP 8, type hints, packaging, error handling.
- `python-testing` — pytest, TDD red/green/refactor, fixtures, mocking, parametrization, coverage.

**Django lane (batteries-included web)**
- `django-patterns` — project layout, DRF API design, ORM, caching, signals, middleware.
- `django-tdd` — pytest-django, factory_boy, testing models/views/serializers and DRF endpoints.
- `django-security` — auth/authz, CSRF, SQLi/XSS prevention, secure production settings.
- `django-celery` — background jobs, Beat scheduling, retries, canvas workflows, task testing.
- `django-verification` — the pre-PR/pre-deploy gate: migrations → lint → tests → security → readiness.

**FastAPI lane (async-first services)**
- `fastapi-patterns` — async endpoints, dependency injection, Pydantic request/response models, OpenAPI, security.

**ML / data lane**
- `pytorch-patterns` — device-agnostic, reproducible training loops, model architectures, data loading.
- `recsys-pipeline-architect` — the six-stage Source→Hydrator→Filter→Scorer→Selector→SideEffect ranking/feed pattern.
- `mle-workflow` — production ML: data contracts, reproducible training, eval gates, deployment, monitoring, rollback.

## Routing rules by intent

- **"Write/refactor/review plain Python"** → `python-patterns` (+ `python-testing` for the tests).
- **"Set up tests / follow TDD"** → `python-testing` (Django app → `django-tdd` instead, for pytest-django + factory_boy + DRF).
- **"Build a web app / REST API"** → pick the lane: batteries-included, ORM, admin, server-rendered or DRF → `django-patterns`; async-first, OpenAPI-driven, Pydantic I/O, microservice → `fastapi-patterns`. (Tie-breaker in `python-backend-core`.)
- **"Background jobs / scheduled / async processing"** → `django-celery`.
- **"Lock it down / auth / production hardening"** → `django-security` (FastAPI security lives inside `fastapi-patterns`).
- **"Is it ready to ship?" / pre-PR / pre-deploy** → `django-verification` (the verify loop; non-Django → run the equivalent gate from `python-testing` + `mle-workflow`).
- **"Train a model / training loop / GPU"** → `pytorch-patterns`.
- **"Rank/recommend/feed — top-K for a (user, context)"** → `recsys-pipeline-architect`.
- **"Turn notebook code into a production ML system"** → `mle-workflow` (orchestrates `python-patterns`, `python-testing`, `pytorch-patterns` for the pieces).

## Standard flow

1. **Classify** the task: which lane (foundation / Django / FastAPI / ML) and which lifecycle stage (design → implement → test → secure → ship).
2. **Anchor on the core**: if it touches framework choice, boundary validation, persistence, or the test gate, pull the shared model from `python-backend-core` first.
3. **Delegate** to the spoke(s). Multi-step asks fan out in lifecycle order — e.g. "build and ship a Django API" → `django-patterns` → `django-tdd` → `django-security` → `django-celery` (if async) → `django-verification`.
4. **Return**: the chosen spoke(s), the framework lane, the test/security implications, and the next action.

## Guardrails

See `python-backend-core`. In short: **keep business logic out of views/routers** — they are thin adapters over a typed core; **validate every input at the boundary** (DRF serializers / Pydantic models), never trust the client; **tests before "done"** — no feature is complete until `python-testing`/`django-tdd` covers it and `django-verification` (or the lane's equivalent gate) passes; **secrets and DEBUG never ship** — `django-security` settings are non-negotiable in production; for ML, **reproducibility and a rollback path** gate promotion (`mle-workflow`). Don't silently widen scope: a new external call, a loosened auth check, or a skipped migration check is a change worth stating.

## Loading spokes on demand

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as skills — only this orchestrator and its `*-core` are enumerated. When you route to a spoke named above, **load it on demand** by reading its file:

`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`  (or `skills/<spoke-name>/SKILL.md` inside the skill-clusters repo).
