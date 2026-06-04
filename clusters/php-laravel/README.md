<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,30&height=220&text=PHP%20%C2%B7%20Laravel&fontSize=52&fontAlignY=38&desc=7%20skills%2C%20one%20router%20%E2%80%94%20build%20%E2%86%92%20test%20%E2%86%92%20verify%20%E2%86%92%20ship&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-7-f59e0b?style=flat)](../../skills.sh.json)
[![Laravel](https://img.shields.io/badge/Laravel-11%2F12-FF2D20?style=flat&logo=laravel&logoColor=white)](https://laravel.com)
[![PHP](https://img.shields.io/badge/PHP-8.2%2B-777BB4?style=flat&logo=php&logoColor=white)](https://php.net)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Five Laravel specialists behind a single router.**
Building, testing, hardening, or shipping a Laravel app? The orchestrator places your task on the
**build × concern** map and routes; `php-laravel-core` holds the layering and conventions they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,30&height=2" width="100%" />

## What it is

7 skills: `php-laravel-orchestrator` (router) + `php-laravel-core` (shared model) + 5
specialists. The cluster's job is to make Laravel work *navigable* — the orchestrator knows which
spoke to reach for, and the core keeps the cross-cutting conventions (thin controllers → service →
action → model, Form Request validation, the JSON response envelope, the test/verify pipeline)
consistent so no two spokes contradict each other.

```mermaid
graph TD
    O["php-laravel-orchestrator<br/>(hub · build × concern router)"]
    O --> P["laravel-patterns<br/>(architecture)"]
    O --> T["laravel-tdd<br/>(test)"]
    O --> V["laravel-verification<br/>(pre-PR / pre-deploy gate)"]
    O --> S["laravel-security<br/>(harden)"]
    O --> D["laravel-plugin-discovery<br/>(package vetting)"]
    P -. references .-> C["php-laravel-core<br/>(layered flow · validation<br/>· response envelope · version matrix)"]
    T -. references .-> C
    V -. references .-> C
    S -. references .-> C
    D -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `php-laravel-orchestrator`, `php-laravel-core` |
| **Build (architecture)** | `laravel-patterns` |
| **Test** | `laravel-tdd` |
| **Verify (pre-PR / pre-deploy)** | `laravel-verification` |
| **Harden (security)** | `laravel-security` |
| **Package vetting** | `laravel-plugin-discovery` |

## The model that ties it together

Every request crosses the **same one-way pipeline** — logic flows down, never back up:

```
Request ─> Form Request (validate + authorize) ─> Controller (thin)
        ─> Service ─> Action ─> Model ─> API Resource ─> { success, data, error, meta }
```

Keep controllers thin; validate every input in a Form Request; default-deny on authorization; and
every API response uses the same four-key envelope. Full model in
[`php-laravel-core`](../../skills/php-laravel-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@php-laravel-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@laravel-security -g -y             # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
