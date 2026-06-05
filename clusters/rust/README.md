<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=10,18,22&height=180&text=rust&fontSize=42&fontAlignY=38&desc=route%20Rust%20work%20to%20the%20right%20skill&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-3-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for Rust work: it locates the task on the **write ↔ verify** axis and delegates to one of two specialists — idiomatic patterns (ownership, errors, traits, concurrency, crate layout) versus testing (unit, integration, async, property-based, mocking, coverage, TDD). The cross-cutting model both spokes share — the library-vs-application error strategy (`thiserror` vs `anyhow`), type-driven design, and the standard cargo toolchain — lives in `rust-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([rust-orchestrator]):::hub --> c([rust-core]):::hub
  o --> s1([rust-patterns])
  o --> s2([rust-testing])
  o --> s3([rust-coding-skill])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `rust-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `rust-core` | 📐 hub · shared reference | ✅ enumerated |
| `rust-patterns` | spoke | ⤵ on-demand |
| `rust-testing` | spoke | ⤵ on-demand |
| `rust-coding-skill` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@rust-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [../../NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
