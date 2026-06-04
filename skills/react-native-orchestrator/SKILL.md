---
name: react-native-orchestrator
description: "Route a React Native craft task to the right spoke — styling/navigation/Reanimated animation, touch/gesture/haptics, data fetching, or full screen/app visual design. USE WHEN building React Native UI and interaction (toolchain-agnostic). For the Expo toolchain (EAS, dev client, Expo Router, native modules) hand off to the expo cluster; for native SwiftUI/iOS, the native-ios cluster."
cluster: react-native
version: 1.0.0
---

# React Native Orchestrator

Entry skill for **React Native UI and interaction craft** — independent of how the app is
built or shipped. It routes by what you're crafting (layout, motion, touch, data, screens);
the runtime model (New Architecture, Reanimated, navigation, performance) lives in
`react-native-core`. Toolchain/build/ship belongs to the **expo** cluster.

## Cluster map (routing targets)

- `react-native-core` — RN runtime model: New Architecture (Fabric/TurboModules/JSI), styling approaches, navigation options, the Reanimated + Gesture Handler stack, platform differences, performance.
- `react-native-design` — styling, navigation, and **Reanimated** animations; the day-to-day RN UI craft.
- `mobile-touch` — gestures, haptic feedback, touch interactions, native-feel micro-animations.
- `sleek-design-mobile-apps` — high-level screen/app **design** ("design a mobile app", build screens) incl. Sleek projects.
- `native-data-fetching` — *(shared with expo)* network requests, React Query/SWR, caching, offline, error handling.

## Routing Rules by Intent

- **Styling / layout / navigation / animation** → `react-native-design` (+ `react-native-core` for the Reanimated/nav model).
- **Gestures, haptics, touch feel** → `mobile-touch`.
- **Design a screen / whole app visually** → `sleek-design-mobile-apps`.
- **Fetch / cache / sync data** → `native-data-fetching`.
- **Toolchain** (EAS build/submit/update, dev client, Expo Router, native modules, SDK upgrade) → **expo cluster** (`expo-orchestrator`).
- **Native iOS** (SwiftUI, UIKit, HIG) → **native-ios cluster** (`mobile-ios-design`).

## Standard Operating Flow

1. Identify the craft: layout/motion, touch, screen design, or data.
2. Pull the relevant model from `react-native-core` (e.g. Reanimated worklets, list performance, Platform splits).
3. Delegate to the spoke(s). If the request implies build/ship, redirect that part to `expo-orchestrator`.
4. Return: chosen spoke(s), the runtime concerns in play (UI-thread vs JS-thread, New Arch), next action.

## Guardrails

See `react-native-core`. In short: run animations/gestures on the **UI thread** (Reanimated
worklets + Gesture Handler) — never block the JS thread; animate transforms, not layout, for
60fps; respect `prefers-reduced-motion` / reduce-motion settings; use `Platform`/platform-file
splits instead of runtime OS branching where it matters; and virtualize long lists
(FlatList/FlashList) rather than mapping arrays.
