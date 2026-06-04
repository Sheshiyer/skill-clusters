<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Rust&fontSize=56&fontAlignY=38&desc=Write%20idiomatic%2C%20prove%20it%20%E2%80%94%20one%20router%2C%20patterns%20%2B%20testing&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-4-f59e0b?style=flat)](../../skills.sh.json)
[![Rust](https://img.shields.io/badge/Rust-2024-000000?style=flat&logo=rust&logoColor=white)](https://www.rust-lang.org)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Idiomatic Rust, behind a single router.**
Writing, reviewing, refactoring, or testing Rust? The orchestrator places your task on the
**write ↔ verify** axis and routes; `rust-core` holds the error strategy both spokes share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

4 skills: `rust-orchestrator` (router) + `rust-core` (shared model) + 2 specialists
(`rust-patterns`, `rust-testing`). The cluster's job is to make Rust work *navigable* — the
orchestrator knows whether you're shaping code or proving it, and the core keeps the one decision
everything hinges on (library `thiserror` vs application `anyhow`) consistent across both spokes.

```mermaid
graph TD
    O["rust-orchestrator<br/>(hub · write ↔ verify router)"]
    O --> P["rust-patterns<br/>(ownership · errors · traits<br/>· concurrency · crate layout)"]
    O --> T["rust-testing<br/>(TDD · unit/integration/async<br/>· proptest · mockall · coverage)"]
    P -. references .-> C["rust-core<br/>(thiserror vs anyhow · type-driven design<br/>· cargo/CI matrix · guardrails)"]
    T -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills

| Concern | Skill | Role |
|---|---|---|
| **Router** | `rust-orchestrator` | Places the task on the write ↔ verify axis and delegates |
| **Shared model** | `rust-core` | The error strategy, type-driven conventions, cargo/CI matrix, guardrails |
| **Write** | `rust-patterns` | Idiomatic ownership, error handling, traits, concurrency, crate structure |
| **Verify** | `rust-testing` | Unit, integration, async, property-based tests, mocking, coverage, TDD |

## The model that ties it together

The cluster turns on **who consumes the error**:

```
Library / reusable crate ──> thiserror  (typed enum — callers & tests MATCH on variants)
Application / binary ───────> anyhow     (dynamic Result + .context() — callers REPORT it)
```

Decide library-vs-application first; it fixes the public API and whether tests assert on typed
variants (`matches!`) or just propagate context. `?` over `unwrap()`, illegal states
unrepresentable, `unsafe` minimal and documented. Full model in
[`rust-core`](../../skills/rust-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@rust-orchestrator -g -y    # entry point
npx skills add Sheshiyer/skill-clusters@rust-testing -g -y         # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
