---
name: react-native-core
description: "Shared reference for the React Native cluster: the New Architecture (Fabric/TurboModules/JSI/bridgeless), styling approaches, navigation options, the Reanimated + Gesture Handler animation stack, platform differences, performance rules, and integrated product-flow audits. USE WHEN making RN UI/interaction decisions or reviewing whole-app flow gaps. Pairs with expo-core for the toolchain."
cluster: react-native
version: 1.0.1
---

# React Native Core

Shared model for the `react-native` cluster. UI and interaction spokes depend on these
runtime facts — keep them consistent. For build/ship/Expo specifics, see `expo-core`.

## 1. Architecture (know which you're on)

- **New Architecture** (default on recent RN): **Fabric** renderer, **TurboModules** (lazy native modules), **JSI** (direct JS↔native, no async bridge), **bridgeless** mode. Enables synchronous calls and better perf.
- **Old bridge** (legacy): async, serialized JSON bridge — the bottleneck the New Arch removes.
- Most decisions (Reanimated worklets, synchronous measurements) assume the New Architecture.

## 2. Styling

- **StyleSheet + Flexbox** is the baseline (Flexbox defaults differ from web: `flexDirection: 'column'`, no `px`).
- **NativeWind / Tailwind** for utility styling across native + web → `expo-tailwind-setup`.
- Platform-specific styles via `Platform.select` or `.ios.tsx` / `.android.tsx` files.

## 3. Navigation

- **React Navigation** — the library standard (native-stack, tabs, drawer).
- **Expo Router** — file-based routing on top of React Navigation → `building-native-ui` (expo cluster).
- Pick one per app; don't mix routing paradigms.

## 4. Animation & gesture stack (the modern default)

- **Reanimated** — animations run in **worklets on the UI thread**, so they don't stall when the JS thread is busy. Use `useSharedValue`, `useAnimatedStyle`, `withTiming/withSpring`.
- **Gesture Handler** — native-driven gestures that compose with Reanimated.
- Day-to-day usage → `react-native-design`; touch/haptics feel → `mobile-touch`.
- **Animate `transform`/`opacity`** for 60fps; avoid animating layout. Honor reduce-motion.

## 5. Platform differences

- `Platform.OS` / `Platform.select` for runtime branches; `.ios.tsx`/`.android.tsx` for whole-file splits.
- Safe areas, status bar, back-button (Android), and haptics differ — design for both.
- Native iOS in **SwiftUI/UIKit** (not RN) → `native-ios` cluster (`mobile-ios-design`).

## 6. Performance

- **Virtualize long lists** — `FlatList` / `FlashList`, never `.map()` a big array into views.
- Minimize re-renders: `React.memo`, stable callbacks, `useMemo` for heavy derivations.
- Keep work off the JS thread; move animation/gesture to the UI thread (Reanimated).
- Profile with the New Arch tooling / Flipper / DevTools.

## 7. Data

Network + cache + offline via `native-data-fetching` (fetch, React Query/SWR). Treat the
server cache (React Query) as separate from UI state.

## 8. Integrated product-flow audits

Use `references/integrated-flow-audit.md` when the task asks whether the whole app flow,
role architecture, or UI/UX implementation matches the product/agent contract. The audit
order is:

1. Product contract: actors, entry gates, success states, safety/consent, revenue or token rules.
2. Route graph: first-run, authenticated, role-specific tabs, modal/deep-link paths, exits.
3. State authority: server, local bootstrap, cache, secure storage, fixtures, and reset behavior.
4. Data path: screen -> hook/provider -> API -> cache/fallback -> persistence -> recovery UI.
5. UI/UX states: empty/loading/error/offline/success/retry/back paths, not just happy paths.
6. Verification: static checks, route validators, simulator scripts, live API smoke where relevant.

For Expo Router or EAS evidence, pair this with `expo-core` / `expo-orchestrator`.

## 9. Shared guardrails

- UI-thread animations/gestures (Reanimated worklets + Gesture Handler) — never block JS.
- Transforms over layout for motion; 60fps target; respect reduce-motion.
- Virtualize lists; cut needless re-renders.
- One navigation paradigm per app.
- One authority per product fact: auth identity, role, wallet balance, booking, conversation, consent, and safety state should not have competing production sources.
- Fixture/mock fallbacks must be visibly bounded to demo/simulator/test paths and must not be used as proof that production flow works.
- Toolchain/build/ship → `expo-core`; native SwiftUI → `native-ios`.
