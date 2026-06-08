# Skill-Clusters Roadmap

Where this project has been and where it's going. Every cluster follows the **anatomy**:
`<name>-orchestrator` (router) + `<name>-core` (shared reference) + spokes (referenced canonically;
authored to fill gaps) + `clusters/<name>/README.md` + a `groupings` entry in `skills.sh.json`.

**Current state:** 40 clusters · 716 indexed skills · 54 enumerated hubs at startup · 27 active /
13 deferred · the closed conductor loop (Phases 0–5) shipped. Health gate PASS 0/0.

---

## Shipped — the journey

### Wave 1 · The hub-and-spoke pilots (7, authored)
Proved the pattern: a router + a shared core makes a fuzzy request resolvable.
`tauri` (flagship, 40 spokes — "organize at scale") · `creative-frontend` (Astro·GSAP·Remotion) ·
`expo` · `react-native` · `astro` · `raycast` · `electron`. Boundaries settled (Expo toolchain+Router
UI vs RN craft; creative-frontend = motion vs astro = static/SSR).

### Wave 2 · ECC extraction (21 clusters, MIT)
Re-clustered [affaan-m/ECC](https://github.com/affaan-m/ECC)'s 251 flat skills into hub-and-spoke form,
each skill validated through the Skills-Health gate. Methodology in
[`ECC-EXTRACTION-PLAN.md`](ECC-EXTRACTION-PLAN.md). Brought in `ai-agents-meta`, `frontend-web`,
`python-backend`, `devops-infra`, `security`, `databases-data`, `rust`, `native-ios`, and 13 more.

### Wave 3 · Curation + platform clusters
Curated reputable community spokes (incl. [antigravity-awesome-skills](https://github.com/sickn33/antigravity-awesome-skills))
and authored platform clusters: `cloudflare`, `supabase`, `design`, `growth-seo`, `growth-content`,
`git-pr-ops`, `browser-automation`, `media-gen`, `documents`, `growth-sales-cro`.

### Wave 4 · The closed loop (Phases 0–5)
Turned the catalog into an **engine**. See [`CONDUCTOR-INTEGRATION.md`](CONDUCTOR-INTEGRATION.md):

- **P0** — `resolve-task.mjs`, the resolver (task → cluster, phantom-proof).
- **P1** — vendored [conducty](https://github.com/robertbarclayy/conducty) (MIT) as the `conductor` cluster.
- **P2** — wired conducty Execute → resolver; scoring hardened to v1.5 (5/5 on the mixed smoke).
- **P3** — `--propose`: classifier proposes a cluster, resolver validates (Capability-Name audit).
- **P4** — `ship-battery.mjs`, the fail-closed ship gate.
- **P5** — `loop-feedback.mjs`, the close (record → rollup → next plan).
- **+ Delivery modalities** — `swarm-architect` (plan) + `github-next-wave-orchestrator` (execute) wired
  as the **github-delivery** modality alongside the local-subagent path.

---

## Now — the 40-cluster catalog

**Active (27)** — enumerated at startup: `agentic-ops · ai-agents-meta · astro · backend-architecture ·
browser-automation · cloudflare · conductor · creative-frontend · databases-data · design · devops-infra ·
electron · expo · frontend-web · git-pr-ops · growth-content · growth-seo · native-ios · python-backend ·
quality-eval · raycast · react-native · research-knowledge · rust · security · supabase · tauri`.

**Deferred (13)** — off until activated (`node scripts/tier.mjs --activate <c> --apply`): `php-laravel ·
jvm · systems-languages · mobile-flutter · healthcare · supply-chain · blockchain-web3 · business-content ·
social-media · extra-languages · media-gen · documents · growth-sales-cro`.

---

## Next — forward roadmap

| Priority | Item | Why |
|---|---|---|
| **1** | **Live-PAI opt-ins** — flip gate hooks `exit(0)→exit(2)`; `commit-on-criterion` PostToolUse hook | make the gates fail-closed in the daily driver (documented switches today) |
| **2** | **Lightweight CI** — schema-validate manifest + frontmatter + dead-symlink + ship-battery on PR | catch drift before merge; the only health check today is local |
| **3** | **Classifier-line maturation** — feed PAI's Algorithm OBSERVE phase into `resolve-task --propose` | replace keyword-floor noise on genuinely ambiguous stack-vs-domain tasks |
| **4** | **Install profiles** — `frontend` / `mobile` / `backend` / `everything` over clusters | one-command working sets (ECC's profiles pattern) |
| **5** | **Cluster scaffolder** — generate orchestrator+core+README+manifest from a cluster spec | keep new clusters consistent; lower authoring cost |
| **6** | **Promote-on-signal** — `loop-feedback --rollup` auto-suggests deferred→active for hot clusters | close the tier loop with real usage data |

---

## Brandmint — lessons from the first brand genesis (Fitcheck)

Running a real brand end-to-end (**waves 0-8**) through the engine surfaced what worked and what's missing. Full retrospective: **[LESSONS-FITCHECK-RUN.md](./LESSONS-FITCHECK-RUN.md)**.

**Shipped into the engine:**
- **Mission-grounded prompts** — `planImageArtifacts` now grounds renders in `identity.mission` + the new `visual_tokens.logo_brief` + `visual_tokens.art_direction` (anti-cues), so a render reflects the *product*, not a literal reading of the name (the "Fitcheck → fitness" drift). *(PR #103 + schema.)*
- **Multi-backend rendering** — `brandmint --backend gpt-image|nanobanana`; **Nano Banana Pro** (Gemini 3 Pro Image) is the recommended quality lane. *(PR #104.)*

**Three gates the engine still needs (next cycle):**

| Pri | Gate | Why (from the run) |
|---|---|---|
| **B1** | **Name-validation gate** — domain + trademark + App-Store + competitor-collision check at the *start* of genesis | "Fitcheck" is meaning-perfect but commercially DOA (exact-name Shopify incumbent + a saturated namespace) — found *after* building the brand |
| **B2** | **Semantic visual-QA** — a brief-match (vision-judge) score gating render acceptance, alongside palette coverage | the fitness-drift logo *passed* the palette-coverage reroll while being off-concept |
| **B3** | **Reference-anchored campaigns** — a brand character/model source so the whole asset set shares one identity | a contact-sheet `-i` reference held one model across the hero + every product tile |

---

## Cross-cutting conventions

- **Naming:** `<cluster>-orchestrator` / `<cluster>-core`; spokes keep their canonical names.
- **Shared spokes** may appear in multiple `groupings` — one canonical copy, many references.
- **Source of truth = this repo;** `~/.agents/skills` symlinks back via `scripts/link-agents.sh`.
- **Every cluster ships the full treatment:** banner, plastic badges, mermaid, skills table, install, attribution.
- **Debloat invariant:** only active orchestrators+cores enumerate; spokes load on demand; deferred = 0 cost.
- **Fail-closed where it counts:** correctness/security/secrets gate via `ship-battery.mjs`; ship never auto-merges.
