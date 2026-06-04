<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,24,12&height=220&text=React%20Native&fontSize=50&fontAlignY=38&desc=UI%20%26%20interaction%20craft%20%E2%80%94%20style%20%C2%B7%20animate%20%C2%B7%20touch%20%C2%B7%20fetch&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-6-61dafb?style=flat)](../../skills.sh.json)
[![React Native](https://img.shields.io/badge/React%20Native-New%20Arch-61DAFB?style=flat&logo=react&logoColor=black)](https://reactnative.dev)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for React Native UI & interaction craft — toolchain-agnostic.**
Styling, navigation, Reanimated motion, gestures, and data. The orchestrator routes by what
you're crafting; `react-native-core` holds the runtime model (New Architecture, Reanimated,
performance). Toolchain lives in **[expo](../expo)**; native SwiftUI in **native-ios**.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=20,24,12&height=2" width="100%" />

## What it is

`react-native-orchestrator` (router) + `react-native-core` (runtime model) + the craft spokes.
It separates *what you build* (UI, motion, touch, screens, data) from *how you ship it* (the
expo cluster) — so RN UI knowledge stays reusable whether the app is Expo-managed or bare.

```mermaid
graph TD
    O["react-native-orchestrator<br/>(hub · craft router)"]
    O --> D["react-native-design<br/>(style · nav · Reanimated)"]
    O --> T["mobile-touch<br/>(gesture · haptics)"]
    O --> S["sleek-design-mobile-apps<br/>(screen / app design)"]
    O --> F["native-data-fetching<br/>(fetch · React Query · offline)"]
    O -. "build / ship" .-> EXPO["expo cluster →"]
    O -. "native SwiftUI" .-> IOS["native-ios cluster →"]
    D -. references .-> C["react-native-core<br/>(New Arch · Reanimated · perf)"]
    T -. references .-> C
    F -. references .-> C

    style O fill:#0e7490,color:#fff
    style C fill:#276749,color:#fff
    style EXPO fill:#1d4ed8,color:#fff
    style IOS fill:#334155,color:#fff
```

## Skills

| Skill | Role |
|---|---|
| `react-native-orchestrator` | Router — craft → spoke |
| `react-native-core` | New Architecture, styling, navigation, Reanimated, performance |
| `react-native-design` | Styling, navigation, Reanimated animations |
| `mobile-touch` | Gestures, haptics, touch interactions |
| `sleek-design-mobile-apps` | High-level screen / app design |
| `native-data-fetching` | *(shared)* fetch / React Query / SWR / offline |

## The model that ties it together

Animations and gestures run in **Reanimated worklets on the UI thread** (never block JS);
animate `transform`/`opacity` for 60fps; **virtualize long lists** (FlatList/FlashList); pick
**one navigation paradigm** per app. Full model in
[`react-native-core`](../../skills/react-native-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@react-native-orchestrator -g -y
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (repo = single source of truth):

```bash
./scripts/link-agents.sh --apply
```
