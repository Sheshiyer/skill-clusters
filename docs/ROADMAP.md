# Skill-Clusters Roadmap

Build plan for all clusters. Each follows the **anatomy**: `*-orchestrator` (router) +
`*-core` (shared reference) + spokes (existing, referenced canonically; authored to fill gaps)
+ `clusters/<name>/README.md` + a `groupings` entry in `skills.sh.json`.

**Legend** — Strategy: `organize` (wrap existing skills) · `author` (write new spokes).
Status: ✅ live · ⏳ planned · 🔴 gap (needs authoring).

---

## 1. creative-frontend ✅ — Astro · GSAP · Remotion

**Pilot / template.** Routes on *in-browser vs. render-time video*.

- **New:** `creative-frontend-orchestrator`, `creative-frontend-core`
- **Spokes:** `astro-framework`, `astro-gsap-scrolltrigger`, `animejs`, `web-motion-library`, `remotion`, `remotion-best-practices`, `remotion-video-toolkit`
- **Status:** done — use as the reference for everything below.

---

## 2. tauri ✅ — cross-platform desktop/mobile (flagship)

**Built 2026-06-05.** 40 existing skills — the showcase for "organize a huge stack." The work was
almost entirely the orchestrator's routing taxonomy + a core of cross-cutting Tauri rules.

- **New:** `tauri-orchestrator`, `tauri-core` (capability/permission model, IPC contract, security posture, version/v2 notes)
- **Routing sub-domains → spokes:**
  - *Setup/architecture:* `setting-up-tauri-projects`, `tauri-v2`, `understanding-tauri-architecture`, `understanding-tauri-process-model`, `understanding-tauri-lifecycle-security`, `understanding-tauri-runtime-authority`, `migrating-tauri-apps`, `updating-tauri-dependencies`
  - *Config:* `configuring-tauri-apps`, `configuring-tauri-capabilities`, `configuring-tauri-permissions`, `configuring-tauri-scopes`, `configuring-tauri-csp`, `configuring-tauri-http-headers`, `customizing-tauri-windows`
  - *IPC / frontend bridge:* `understanding-tauri-ipc`, `calling-frontend-from-tauri-rust`, `calling-rust-from-tauri-frontend`, `listening-to-tauri-events`, `integrating-tauri-js-frontends`, `integrating-tauri-rust-frontends`
  - *Sidecars / resources:* `embedding-tauri-sidecars`, `running-nodejs-sidecar-in-tauri`, `managing-tauri-app-resources`
  - *UI extras:* `adding-tauri-splashscreen`, `adding-tauri-system-tray`
  - *Plugins:* `developing-tauri-plugins`, `managing-tauri-plugin-permissions`
  - *Security:* `understanding-tauri-ecosystem-security` (+ the config/permission spokes)
  - *Distribution/signing:* `distributing-tauri-for-{macos,windows,ios,android}`, `packaging-tauri-for-linux`, `signing-tauri-apps`, `optimizing-tauri-binary-size`, `building-tauri-with-github-actions`, `using-crabnebula-cloud-with-tauri`
  - *Debug/test:* `debugging-tauri-apps`, `testing-tauri-apps`
- **Cross-cluster:** the Rust-bridge spokes are shared with the `rust` cluster (fine — a skill can sit in two `groupings`).

---

## 3. expo ✅ — Expo toolchain

**Built 2026-06-05.** Boundary settled (below).

- **New:** `expo-orchestrator`, `expo-core` (EAS, app config + plugins, managed↔bare/CNG, SDK policy)
- **Spokes:** `expo-dev-client`, `expo-tailwind-setup`, `building-native-ui` *(Expo Router UI)*, `expo-api-routes`, `expo-module`, `expo-cicd-workflows`, `expo-deployment`, `upgrading-expo`, `native-data-fetching` *(shared with react-native)*
- **Boundary (settled):** **Expo = toolchain/build/ship + Expo-Router UI; react-native = toolchain-agnostic UI/interaction craft.** Orchestrators cross-reference.

---

## 4. react-native ✅ — RN UI & interaction craft

**Built 2026-06-05.** Corrections applied: `react-native-design` was **not** duplicated (grep artifact); `building-native-ui` went to **expo** (it's Expo Router); `mobile-ios-design` is SwiftUI → reserved for **native-ios**; `frontend-mobile-development` / `frontend-mobile-security` are agent+command bundles (no SKILL.md) → **excluded**.

- **New:** `react-native-orchestrator`, `react-native-core` (New Arch, Reanimated, perf)
- **Spokes:** `react-native-design`, `mobile-touch`, `sleek-design-mobile-apps`, `native-data-fetching` *(shared with expo)*

---

## 5. astro ✅ — static-first sites (islands/content/SSR/publishing)

**Built 2026-06-05.** Reserved out of the pilot so creative-frontend stays about *motion*. Audit
result: `astro-framework` already covers SSR adapters, Content Layer, actions, `astro:env`,
sessions, i18n, view transitions — **no authoring needed**, pure organize.

- **New:** `astro-orchestrator`, `astro-core` (the static/SSR/hybrid decision + content/hydration model)
- **Spokes:** `astro-framework` *(shared with creative-frontend)*, `astro-wiki-publisher`. The 1-file `astro` stub stays dropped (superseded).
- **Cross-ref:** animation on Astro pages → creative-frontend (`astro-gsap-scrolltrigger`).

---

## 6. raycast ✅ — extensions, AI tools, Store publishing

**Built 2026-06-05.** Existing spokes were thin (both 1-file; `raycast-ui-skills` is actually the
Raycast *aesthetic* for your own app, not the extension API) → authored a real core + 2 spokes.

- **New:** `raycast-orchestrator`, `raycast-core` (command types, manifest, @raycast/api, data hooks, build/publish)
- **Spokes:** `raycast-extension`, `raycast-ui-skills`
- **Authored:** `raycast-ai-extensions` (tools[] for Raycast AI), `raycast-store-publishing` (submit + review). `raycast-script-commands` folded into core.

---

## 7. native-ios 🔴 — Swift / SwiftUI / Xcode / App Store

Biggest authoring job; only `mobile-ios-design` exists today.

- **New:** `native-ios-orchestrator`, `native-ios-core`
- **Existing spoke:** `mobile-ios-design`
- **Cross-cluster (shipping):** `app-store-optimization`, `app-store-screenshots`, `aso-appstore-screenshots`
- **Author:** `swiftui-views-and-layout`, `swift-concurrency-async-await`, `xcode-project-and-targets`, `swiftdata-and-persistence`, `ios-app-distribution`, `ios-testing-xctest`

---

## 8. electron 🔴 — desktop (main/renderer/IPC/packaging)

Only `electron` exists.

- **New:** `electron-orchestrator`, `electron-core` (process model, context isolation, security checklist)
- **Existing spoke:** `electron`
- **Author:** `electron-main-renderer-ipc`, `electron-security-hardening`, `electron-builder-packaging`, `electron-auto-update`, `electron-native-modules`
- **Note:** core should explicitly contrast with Tauri (when to pick which) — useful cross-link.

---

## 9. rust 🔴 — Cargo / async / CLI / WASM / testing

Only `rust-coding-skill` exists (+ Tauri's Rust-bridge spokes to cross-reference).

- **New:** `rust-orchestrator`, `rust-core` (ownership/borrow mental model, error strategy, crate-selection)
- **Existing spoke:** `rust-coding-skill`
- **Author:** `rust-cargo-and-workspaces`, `rust-async-tokio`, `rust-error-handling`, `rust-cli-with-clap`, `rust-and-wasm`, `rust-testing-and-benches`

---

## Build order (suggested)

1. ✅ **creative-frontend** (template)
2. ✅ **tauri** — flagship; proves "organize at scale," highest install appeal
3. ✅ **expo** + **react-native** — boundary settled (Expo toolchain+Router UI / RN craft)
4. ✅ **astro** + **raycast** — organize + Raycast authoring (AI + Store)
5. **rust** — author; unblocks/extends tauri + electron cores
6. **native-ios**, **electron** — heaviest authoring last

## Cross-cutting conventions

- **Naming:** new skills `<cluster>-orchestrator` / `<cluster>-core`; spokes keep their canonical names.
- **Shared spokes** may appear in multiple `groupings` (astro-framework, app-store-*, Tauri↔Rust bridges) — one canonical copy, many references.
- **Dedupe on intake:** resolve known duplicates (`react-native-design` ×2; the `astro` stub vs `astro-framework`) as each cluster is built.
- **Source of truth = this repo;** `~/.agents/skills` symlinks back via `scripts/link-agents.sh`.
- **Every cluster ships the full treatment:** banner, badges, mermaid, skills table, install, local-dev section.

## Open decisions (carry into each build)

- **RN ⇆ Expo boundary** — toolchain vs UI/native (proposed above; confirm when building).
- **`astro-framework` audit** — how much of SSR/content/islands it already covers before authoring astro spokes.
- **skills.sh "install the whole cluster"** — confirm at publish time whether `groupings` install as a bundle or whether the orchestrator is the documented entry point that pulls spokes.
- **Polish automation** — a generator that scaffolds `orchestrator`+`core`+README+manifest entry from a cluster spec, so clusters 2–9 are consistent.
