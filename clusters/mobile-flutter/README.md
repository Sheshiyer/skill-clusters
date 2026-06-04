<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Mobile%20Flutter&fontSize=52&fontAlignY=38&desc=Dart%20%C2%B7%20Flutter%20%C2%B7%20Android%2FKMP%20%E2%80%94%20one%20router%3A%20write%20%E2%86%92%20structure%20%E2%86%92%20review&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-5-f59e0b?style=flat)](../../skills.sh.json)
[![Flutter](https://img.shields.io/badge/Flutter-3.7+-02569B?style=flat&logo=flutter&logoColor=white)](https://flutter.dev)
[![Dart](https://img.shields.io/badge/Dart-3-0175C2?style=flat&logo=dart&logoColor=white)](https://dart.dev)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Five skills behind one router for Flutter/Dart and Android/KMP work.**
Writing, structuring, or reviewing a mobile app? The orchestrator places your task on the
**layer × phase** map and routes; `mobile-flutter-core` holds the state-management decision they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

5 skills: `mobile-flutter-orchestrator` (router) + `mobile-flutter-core` (shared model) + 3
specialist spokes. The cluster's job is to make a deep mobile skill set *navigable* — the
orchestrator knows which spoke to reach for, and the core keeps the interlocking decisions
(state management → immutability → layering → tooling) consistent so no spoke contradicts another.

```mermaid
graph TD
    O["mobile-flutter-orchestrator<br/>(hub · layer × phase router)"]
    O --> P["dart-flutter-patterns<br/>(write idiomatic Dart/Flutter)"]
    O --> A["android-clean-architecture<br/>(structure Android/KMP)"]
    O --> R["flutter-dart-code-review<br/>(review & harden)"]
    P -. references .-> C["mobile-flutter-core<br/>(state decision · immutable contract<br/>· layering rule · version matrix)"]
    A -. references .-> C
    R -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#1d4ed8,color:#fff
```

## Skills

| Concern | Skill | Role |
|---|---|---|
| **Router** | `mobile-flutter-orchestrator` | Intent router over the layer × phase map |
| **Shared model** | `mobile-flutter-core` | State-management decision, immutable contract, layering rule, version/tooling matrix |
| **Write** | `dart-flutter-patterns` | Production Dart 3 / Flutter patterns — null safety, sealed state, async, widgets, BLoC + Riverpod, GoRouter, Dio, Freezed, testing |
| **Structure** | `android-clean-architecture` | Module boundaries & dependency rules for Android/KMP — UseCases, Repositories, Room/SQLDelight/Ktor, Koin/Hilt |
| **Review** | `flutter-dart-code-review` | Library-agnostic review checklist across 15 axes (widgets, state, perf, a11y, security, l10n, DI, static analysis) |

## The decision that ties it together

The cluster turns on **one choice: which state-management solution** — and that choice
constrains immutability, testing, rebuild discipline, and DI downstream:

```
state solution ──implies──> immutable-state contract ──shapes──> layering + testing + rebuilds
```

Pick one solution and one routing approach per app; model mutually-exclusive states as sealed
types (not boolean flags); keep `domain` framework-pure; `mounted`-check `BuildContext` after
every `await`. Full model in [`mobile-flutter-core`](../../skills/mobile-flutter-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@mobile-flutter-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@dart-flutter-patterns -g -y         # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
