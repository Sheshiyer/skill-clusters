<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=8,12,16&height=220&text=Expo&fontSize=56&fontAlignY=38&desc=The%20Expo%20toolchain%20%E2%80%94%20set%20up%20%E2%86%92%20build%20%E2%86%92%20EAS%20ship%20%E2%86%92%20update&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-11-3b82f6?style=flat)](../../skills.sh.json)
[![Expo](https://img.shields.io/badge/Expo-SDK-000020?style=flat&logo=expo&logoColor=white)](https://expo.dev)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Hub-and-spoke cluster for the Expo toolchain.**
Setting up, building, or shipping an Expo app? The orchestrator routes by lifecycle stage and
`expo-core` holds the platform model (EAS, app config, the managed↔bare spectrum, SDK policy).
Pairs with the **[react-native](../react-native)** cluster for UI/interaction craft.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=8,12,16&height=2" width="100%" />

## What it is

`expo-orchestrator` (router) + `expo-core` (platform model) + the Expo spokes. The cluster
turns a fuzzy "build/ship my Expo app" into the right step — dev client, Expo Router UI,
in-app API routes, native modules, EAS build/submit/update, SDK upgrades — and keeps the EAS
and config-plugin model consistent across them.

```mermaid
graph TD
    O["expo-orchestrator<br/>(hub · lifecycle router)"]
    O --> DEV["expo-dev-client · expo-tailwind-setup"]
    O --> UI["building-native-ui<br/>(Expo Router)"]
    O --> NAT["expo-module · expo-api-routes"]
    O --> SHIP["expo-cicd-workflows · expo-deployment<br/>(EAS Build/Submit/Update)"]
    O --> MNT["upgrading-expo"]
    O -. "UI/animation craft" .-> RN["react-native cluster →"]
    DEV -. references .-> C["expo-core<br/>(EAS · app config · CNG · SDK policy)"]
    NAT -. references .-> C
    SHIP -. references .-> C

    style O fill:#1d4ed8,color:#fff
    style C fill:#276749,color:#fff
    style RN fill:#334155,color:#fff
```

## Skills

| Skill | Role |
|---|---|
| `expo-orchestrator` | Router — lifecycle → spoke |
| `expo-core` | EAS, app config + plugins, managed↔bare, SDK policy |
| `expo-dev-client` | Custom dev client (local / TestFlight) |
| `expo-tailwind-setup` | Tailwind v4 + NativeWind v5 styling |
| `building-native-ui` | App screens with Expo Router |
| `expo-api-routes` | Server API routes + EAS Hosting |
| `expo-module` | Native modules via Expo Modules API |
| `expo-cicd-workflows` | CI for EAS pipelines |
| `expo-deployment` | EAS Build → Submit → Update (OTA) |
| `upgrading-expo` | SDK upgrades + dep alignment |
| `native-data-fetching` | *(shared)* fetch / React Query / SWR / offline |

## The model that ties it together

The **Expo SDK version** is the source of truth (it pins the RN version + native deps);
**EAS Update ships JS only** (native changes need a new build + runtime-version bump); prefer
**config plugins** over manual native edits so prebuild/CNG stays reproducible. Full model in
[`expo-core`](../../skills/expo-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@expo-orchestrator -g -y
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo (repo = single source of truth):

```bash
./scripts/link-agents.sh --apply
```
