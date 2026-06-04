<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Systems%20Languages&fontSize=48&fontAlignY=38&desc=7%20specialists%2C%20one%20router%20%E2%80%94%20Go%20%C2%B7%20C%2B%2B%20%C2%B7%20Perl%20%C2%B7%20write%20%E2%86%92%20prove%20%E2%86%92%20harden&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-9-f59e0b?style=flat)](../../skills.sh.json)
[![Go](https://img.shields.io/badge/Go-1.22%2B-00ADD8?style=flat&logo=go&logoColor=white)](https://go.dev)
[![C++](https://img.shields.io/badge/C%2B%2B-17%2F20%2F23-00599C?style=flat&logo=cplusplus&logoColor=white)](https://isocpp.github.io/CppCoreGuidelines/CppCoreGuidelines)
[![Perl](https://img.shields.io/badge/Perl-5.36%2B-39457E?style=flat&logo=perl&logoColor=white)](https://www.perl.org)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**7 Go, C++ & Perl specialists behind a single router.**
Writing, reviewing, testing, or hardening systems code? The orchestrator places your task on the
**language × concern** map and routes; `systems-languages-core` holds the language-axis decision
and the write → prove → harden lifecycle they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

9 skills: `systems-languages-orchestrator` (router) + `systems-languages-core` (shared model) +
7 specialists across Go, C++, and Perl. The cluster's job is to make a multi-language skill set
*navigable* — the orchestrator knows which spoke to reach for given your language and concern, and
the core keeps the decision (which language → which idiom, error model, and toolchain) and the
patterns → testing → (Perl) security lifecycle consistent.

```mermaid
graph TD
    O["systems-languages-orchestrator<br/>(hub · language × concern router)"]
    O --> GO["Go"]
    O --> CPP["C++"]
    O --> PL["Perl"]

    GO --> g1["golang-patterns"]
    GO --> g2["golang-testing"]
    CPP --> c1["cpp-coding-standards"]
    CPP --> c2["cpp-testing"]
    PL --> p1["perl-patterns"]
    PL --> p2["perl-testing"]
    PL --> p3["perl-security"]

    GO -. references .-> CORE["systems-languages-core<br/>(language axis · write→prove→harden<br/>· idiom / error-model / tooling matrix)"]
    CPP -. references .-> CORE
    PL -. references .-> CORE

    style O fill:#b45309,color:#fff
    style CORE fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `systems-languages-orchestrator`, `systems-languages-core` |
| **Go** | `golang-patterns`, `golang-testing` |
| **C++** | `cpp-coding-standards`, `cpp-testing` |
| **Perl** | `perl-patterns`, `perl-testing`, `perl-security` |

## The model that ties it together

There is no framework choice here — each spoke is one language. The single decision is **which
language**, which fixes the idiom, error model, and toolchain; from there every task walks the
same lifecycle:

```
Language (Go · C++ · Perl) ──> write ──> prove ──> harden
                          (patterns/    (testing   (Perl: security)
                           standards)    spoke)
```

One language per task — crossing idioms (Go errors vs C++ exceptions vs Perl taint) is the main
failure mode. Full decision, lifecycle, and the per-language tooling matrix in
[`systems-languages-core`](../../skills/systems-languages-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@systems-languages-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@perl-security -g -y                       # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
