---
name: frontend-web-orchestrator
description: "Route a web-UI task to the right skill among 18 frontend specialists — framework choice (React/Next, Vue/Nuxt, Angular), build tooling (Vite, Turbopack, Bun), motion, accessibility, design direction, and component conversion. USE WHEN building, reviewing, or shipping a web interface but the specific framework or concern hasn't been named yet."
cluster: frontend-web
version: 1.0.0
---

# Frontend Web Orchestrator

The single entry skill for browser-UI work. It locates the task on the
**framework × concern** map and delegates to one of 18 specialist spokes. The cross-cutting
model every web UI shares — the rendering/runtime choice that cascades into hydration, data
fetching, motion bindings, and accessibility — lives in `frontend-web-core`; read it before
picking a framework or wiring SSR-sensitive code.

## Cluster map (spoke → role)

**Framework core**
- `react-patterns` — React 18/19 hooks discipline, server/client boundaries, Suspense, form actions, composition
- `react-performance` — the Vercel-derived 70-rule performance ruleset (waterfalls → re-render → micro-perf)
- `react-testing` — React Testing Library + Vitest/Jest + MSW + axe; the component-vs-e2e boundary
- `nextjs-turbopack` — Next.js 16+ with Turbopack: incremental bundling, FS caching, Turbopack-vs-webpack
- `nuxt4-patterns` — Nuxt 4 hydration safety, route rules, lazy loading, SSR-safe `useFetch`/`useAsyncData`
- `angular-developer` — Angular signals/resource, forms, DI, routing, SSR, plus a 34-file reference set
- `ui-to-vue` — batch-convert UI screenshots/exports into Vue 3 (Vant, Element Plus, Ant Design Vue)

**Build & runtime**
- `vite-patterns` — Vite config, plugins, HMR, env, proxy, SSR, library mode, dependency pre-bundling
- `bun-runtime` — Bun as runtime / package manager / bundler / test runner; when to pick Bun over Node

**Motion (layered — foundations first)**
- `motion-foundations` — motion tokens, spring presets, perf rules, device adaptation, reduced-motion, SSR safety. Every other motion skill depends on this.
- `motion-patterns` — production UI patterns (button, modal, toast, stagger, page transitions, scroll) built on the foundation
- `motion-advanced` — drag/gestures, text animation, SVG path drawing, `useAnimate` sequences, the full API decision tree

**Look & feel**
- `accessibility` — WCAG 2.2 AA: POUR, semantic ARIA, target size, focus appearance, Web + iOS/Android. The spec/audit authority.
- `frontend-a11y` — the React/Next implementation of a11y: labels, ARIA, keyboard nav, focus management
- `design-system` — generate or audit design systems, token/visual consistency, review styling PRs
- `make-interfaces-feel-better` — concrete design-engineering polish: spacing, type, borders, shadows, hit areas, states
- `frontend-design-direction` — set a product-appropriate visual direction before implementation
- `frontend-slides` — animation-rich HTML presentations from scratch or converted from PPTX

## Routing rules by intent

- **"Build / review a React component"** → `react-patterns` (+ `frontend-a11y` for interactive elements, `react-testing` for coverage)
- **"It's slow / re-rendering / big bundle"** → `react-performance`; if Next.js dev speed → `nextjs-turbopack`
- **"Vue / Nuxt"** → `nuxt4-patterns`; converting designs to Vue components → `ui-to-vue`
- **"Angular"** → `angular-developer` (everything Angular routes here; it carries its own reference set)
- **"Add an animation / transition"** → `motion-foundations` FIRST, then `motion-patterns`; gestures/SVG/imperative → `motion-advanced`
- **"Make it accessible"** → `accessibility` for the WCAG standard (browser DOM/ARIA), `frontend-a11y` for the React implementation
- **"Make it look better / more polished / on-brand"** → `make-interfaces-feel-better` + `frontend-design-direction` + `design-system`
- **"Bundler / dev server / monorepo tooling"** → `vite-patterns` or `nextjs-turbopack`; runtime/package-manager → `bun-runtime`
- **"Build a deck / slides"** → `frontend-slides`

## Standard flow

1. **Pick the rendering model** — which framework, and CSR / SSR / RSC? This is the decision in `frontend-web-core` that everything else inherits.
2. **Route to the framework spoke** for structure (`react-patterns` / `nuxt4-patterns` / `angular-developer`).
3. **Layer cross-cutting concerns** in order: accessibility (`frontend-a11y` + `accessibility`) → motion (`motion-foundations` → `motion-patterns`/`motion-advanced`) → polish (`make-interfaces-feel-better`, `design-system`).
4. **Tooling & verification** — wire the bundler/runtime (`vite-patterns` / `nextjs-turbopack` / `bun-runtime`); verify with `react-testing`.
5. **Return**: chosen spoke(s), the rendering model implied (SSR/RSC sensitivity), the a11y + reduced-motion obligations, and the next action.

## Sibling clusters

This cluster is **browser UI only** (DOM, CSS, web frameworks). For **native mobile UI**, hand off — don't try to route React/Vue web idioms onto a device screen:

- **React Native screens / components** → `react-native` cluster
- **Expo / managed React Native apps** → `expo` cluster
- **Flutter / Dart UI** → `mobile-flutter` cluster

The `accessibility` spoke here is the WCAG **spec/audit** authority and states cross-platform principles, but implementation in this cluster is browser DOM/ARIA; native a11y belongs to the mobile clusters above.

## Guardrails

See `frontend-web-core`. In short: **respect the SSR boundary** — wrap stateful/motion components in `"use client"` and match server/client initial state to avoid hydration mismatch; **layer motion on `motion-foundations`** (never inline ad-hoc durations); **accessibility is not optional** — semantic HTML first, every interactive element keyboard-reachable, every animation honors `prefers-reduced-motion`; **never mix `motion/react` and `framer-motion`** in one project. Pick the framework once and route consistently — don't blend React and Vue idioms in the same surface.

## Loading spokes on demand

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as skills — only this orchestrator and its `*-core` are enumerated. When you route to a spoke named above, **load it on demand** by reading its file:

`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`  (or `skills/<spoke-name>/SKILL.md` inside the skill-clusters repo).
