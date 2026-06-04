---
name: expo-orchestrator
description: "Route an Expo task to the right spoke across the app lifecycle — dev environment (dev client, NativeWind), Expo Router app-building, in-app API routes, native modules, EAS build/submit/update, and SDK upgrades. USE WHEN building or shipping an Expo / React Native app with the Expo toolchain but the specific step isn't named. For RN UI/animation/gesture craft that isn't Expo-specific, hand off to the react-native cluster."
---

# Expo Orchestrator

Entry skill for the **Expo toolchain**. It locates the task in the Expo lifecycle (set up →
build UI → add native/server → ship via EAS → maintain) and delegates. The platform model —
EAS, app config + config plugins, Expo Go vs dev client vs prebuild/CNG, SDK version policy —
lives in `expo-core`; read it before changing native config or upgrading.

## Cluster map (routing targets)

- `expo-core` — EAS (Build/Submit/Update/Hosting), `app.json`/`app.config`, config plugins, managed↔bare spectrum, SDK versioning.
- `expo-dev-client` — build & distribute a custom dev client (local / TestFlight) beyond Expo Go.
- `expo-tailwind-setup` — Tailwind v4 + NativeWind v5 styling for universal RN.
- `building-native-ui` — building app screens with **Expo Router**: fundamentals, components, navigation, animations, native tabs.
- `expo-api-routes` — server API routes in Expo Router + EAS Hosting.
- `expo-module` — native modules/views via the Expo Modules API (Swift/Kotlin/TypeScript).
- `expo-cicd-workflows` — CI for EAS (build/submit pipelines).
- `expo-deployment` — release: EAS Build → Submit → Update (OTA).
- `upgrading-expo` — SDK upgrades and dependency alignment.
- `native-data-fetching` — *(shared with react-native)* fetch/React Query/SWR, caching, offline.

## Routing Rules by Intent

- **Dev environment** → `expo-dev-client` (need native modules / leaving Expo Go), `expo-tailwind-setup` (styling).
- **Build screens & navigation** → `building-native-ui` (Expo Router).
- **In-app backend** → `expo-api-routes`.
- **Drop to native** (Swift/Kotlin) → `expo-module`.
- **Ship it** → `expo-cicd-workflows` + `expo-deployment` (EAS). Confirm the SDK/runtime version first (`expo-core`).
- **Data layer** → `native-data-fetching`.
- **Upgrade SDK** → `upgrading-expo`.
- **RN craft that isn't Expo-specific** (Reanimated, gestures/haptics, pure RN styling/nav, screen design) → **react-native cluster** (`react-native-orchestrator`).

## Standard Operating Flow

1. Place the task in the lifecycle (setup → UI → native/server → ship → maintain).
2. If it touches native config, EAS, or SDK version, pull the model from `expo-core` first.
3. Delegate; for "ship" asks, sequence build → submit → update and confirm signing/version.
4. Return: chosen spoke(s), EAS/config implications, target platform(s), next action.

## Guardrails

See `expo-core`. In short: keep the **SDK version** the source of truth (it pins the RN version
and native deps — don't mix); prefer config plugins over manual native edits so prebuild stays
reproducible; confirm credentials/identifiers before an EAS Submit; treat a managed→bare
ejection as a one-way decision worth stating.
