---
name: php-laravel-orchestrator
description: "Route a PHP/Laravel task to the right specialist — architecture patterns (controllers → services → actions, Eloquent, queues), test-driven development with Pest/PHPUnit, the pre-PR/pre-deploy verification loop, security hardening (authz, validation, CSRF, uploads), and package discovery. USE WHEN a user is building, testing, hardening, or shipping a Laravel app but hasn't named the specific concern."
cluster: php-laravel
version: 1.0.0
---

# PHP / Laravel Orchestrator

The single entry skill for Laravel work. It places the task on the **build → test → verify →
ship** lifecycle and delegates to one of five specialist spokes. The cross-cutting conventions
every spoke shares — the layered request flow (controller → service → action → model), the
typed-Eloquent and validation rules, the response envelope, and the version/tooling matrix —
live in `php-laravel-core`; read it before wiring controllers, validation, or the test/CI
pipeline so no two spokes contradict each other.

## Cluster map (spoke → role)

- **`laravel-patterns`** — application architecture: routing & controllers, the controller →
  service → action layering, Eloquent models/scopes/casts, migrations, API resources, queues,
  events, and caching. The structural backbone everything else builds on.
- **`laravel-tdd`** — red-green-refactor with Pest (default) or PHPUnit: unit/feature/integration
  layers, factories & states, `RefreshDatabase`, fakes (`Bus`/`Queue`/`Mail`/`Notification`),
  Sanctum auth tests, Inertia assertions, and 80%+ coverage targets.
- **`laravel-verification`** — the 7-phase gate to run before a PR and before deploy: env →
  composer → pint/phpstan → tests+coverage → `composer audit` → migration review → build/queue
  readiness. The pipeline that says "is this safe to ship?".
- **`laravel-security`** — hardening: authn/authz (Sanctum, policies, gates), input validation,
  CSRF, mass-assignment, file-upload safety, rate limiting, secrets, signed URLs, security
  headers, and CORS. The default-deny posture for every endpoint.
- **`laravel-plugin-discovery`** — find and vet Composer packages via the LaraPlugins.io MCP:
  health score, last-activity, Laravel/PHP compatibility, and vendor reputation before you
  `composer require`.

## Routing rules by intent

**"Build / structure the app"**
- Project layout, controllers, services, Eloquent, queues, API shape → `laravel-patterns`
  *(layering + response envelope in `php-laravel-core`)*

**"Test it"**
- New feature/endpoint, bug fix, model/policy/job coverage, Pest vs PHPUnit → `laravel-tdd`

**"Is it safe to ship?"**
- Pre-PR or pre-deploy gate, lint + static analysis + tests + audit + migration review →
  `laravel-verification`

**"Harden it"**
- Auth, authorization, validation, CSRF, uploads, rate limiting, secrets, headers →
  `laravel-security`

**"Which package should I use?"**
- Find/evaluate a Composer package, check maintenance & version compatibility →
  `laravel-plugin-discovery`

## Sibling clusters

Laravel owns the **app layer** (request flow, Eloquent, queues, auth-in-app). Defer the edges:

- **`frontend-web`** — Inertia/Vue (or Blade-coupled) UI components, client-side state, and asset
  bundling once you cross from the controller response into the browser.
- **`databases-data`** — DB engine internals, query-plan/index tuning, and migration mechanics
  below Eloquent (Laravel models the schema; this cluster models the engine).
- **`devops-infra`** — deploy, queue workers, and scheduler infrastructure (containers, supervisor,
  cron/runtime hosting) — Laravel defines the jobs; this cluster runs them.
- **`security`** — cross-framework / infrastructure hardening beyond the app's authz, validation,
  and headers (network, secrets management, supply-chain) that `laravel-security` doesn't cover.

## Standard flow

1. Locate the task on the lifecycle (build → test → verify → ship) and the concern.
2. If it touches **layering, validation, the response envelope, or the version/tooling matrix**,
   pull the model from `php-laravel-core` first — these are shared, not per-spoke.
3. Delegate to the spoke(s). Multi-step asks fan out in lifecycle order — e.g. "build and ship
   an orders endpoint" → `laravel-patterns` (structure) → `laravel-tdd` (cover it) →
   `laravel-security` (authorize + validate) → `laravel-verification` (gate it).
4. Return: chosen spoke(s), the conventions implied (layer boundaries, auth/validation, coverage),
   and the next action.

## Guardrails

See `php-laravel-core`. In short: **keep controllers thin** and push logic into services/actions;
**validate every input** in a Form Request and never trust the payload for derived fields;
**default-deny on authorization** (policies/gates, `$fillable` not `unguard()`); **the verification
gate is sequential** — env/composer failures stop everything, lint must be clean before tests, and
security/migration review precede any release step. Never widen mass-assignment, CORS origins, or
scope without saying so explicitly.
