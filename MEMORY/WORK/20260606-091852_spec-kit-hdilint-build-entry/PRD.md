---
task: spec-kit idea to spec/plan/tasks for HDILINT build
slug: 20260606-091852_spec-kit-hdilint-build-entry
effort: extended
phase: complete
progress: 22/22
mode: interactive
started: 2026-06-06T03:48:52Z
updated: 2026-06-06T03:57:00Z
---

## Context

**Task 8 of the HDILINT live-slice plan** (Phase 2 entry): turn Fitcheck's idea into a spec-driven build contract — `spec.md` (WHAT/WHY) → `plan.md` (HOW/stack) → `tasks.md` (numbered build steps) — using **spec-kit**, then verify the bridge by resolving each task to a skill-cluster via `scripts/resolve-task.mjs`. This is the *build-entry medium*: spec-kit emits tasks with no skill binding; resolve-task is the resolver that maps each to a cluster + dispatch orchestrator. No founder gate here (the deploy gate is Task 9); no live provider deps.

**Why spec-kit for real (not emulated):** the `specify` CLI is installed (`~/.local/bin/specify`, `uvx` present) and `resolve-task.mjs` was *purpose-built to parse spec-kit's tasks.md grammar* (`- [ ] T### [P] [US#] desc + paths`, `## Phase N` → waves). HDILINT is its own git repo, so the spec-kit scaffold + spec/plan/tasks live there (honoring the separate-repo rule).

**Inputs:** `HDILINT/brand-spec.json` (validated identity/positioning/voice/persona), `HDILINT/brand-config.yaml` (rich product context: problem, solution, audience, competitors, landing_page sections, pricing), `HDILINT/wiki/` (brandmint output), `HDILINT/reference/`, and the GTM/sales folder. The build scope (slice plan): **the Shopify virtual-try-on widget + the marketing landing page** (+ the AI render engine behind the widget).

**Cluster targets (from `skill-index.json`, 40 clusters):** `design`, `frontend-web`, `creative-frontend`, `cloudflare` (Pages/Worker), `growth-content`/`growth-seo` (landing copy/SEO), `backend-architecture`/`python-backend` (render API), `media-gen` [deferred → activate] (the AI try-on render), `quality-eval` (ship-battery). Tasks must carry distinctive tokens + file paths so they resolve (not "unresolved").

**Layout:** spec-kit native — `HDILINT/specs/001-fitcheck-vto/{spec,plan,tasks}.md`. Verify: `node scripts/resolve-task.mjs HDILINT/specs/001-fitcheck-vto/tasks.md HDILINT/specs/001-fitcheck-vto/plan.md --json`.

### Risks
- **`specify init --here` on a non-empty repo:** may prompt or refuse. Mitigation: run non-interactively (`--here --integration claude --offline --ignore-agent-tools`); HDILINT is already a git repo so it won't reinit; if it still fights the existing tree, fall back to scaffolding `.specify/` from bundled templates manually.
- **init pollutes HDILINT's `.claude/`:** the claude integration writes slash commands into HDILINT. Acceptable (HDILINT's own repo), but confirm it doesn't clobber existing files (ISC-3/A2). Check `git status` in HDILINT after init.
- **Tasks resolve to the wrong/no cluster:** "Shopify" isn't a cluster; generic verbs collapse onto the biggest cluster. Mitigation: write task descriptions with distinctive tokens (render/image → media-gen, landing/page/web → frontend-web, animation/webgl → creative-frontend, cloudflare/worker → cloudflare) + real file paths; verify with resolve-task and iterate until unresolved=0.
- **media-gen is deferred:** the render-engine task will resolve to a deferred cluster → resolve-task flags "activate" (expected, not a failure) — assert it (ISC-21), don't treat as unresolved.
- **plan.md stack not read:** resolve-task only reads `Language|Framework|Stack|...` lines from plan.md (and doesn't fold them into scoring). Mitigation: put explicit stack lines in plan.md so the field is populated, but rely on per-task tokens for resolution.
- **Over-spec / drift:** spec-kit templates invite exhaustive detail. Mitigation: scope strictly to "VTO widget + landing page (+ render)"; resolve `[NEEDS CLARIFICATION]` from brand-config; surface only genuine founder questions.

## Decisions

- **HDILINT ⊂ Obsidian vault repo (not standalone).** `HDILINT/.git` does not exist; `git rev-parse --show-toplevel` from HDILINT → `/Volumes/madara/2026/twc-vault` (the vault), which has unrelated churn. Skill-clusters is the only standalone code repo.
- **Author spec-kit-format directly; do NOT run the full installer.** `specify init --here` is interactive on a non-empty dir AND would merge `.specify/`, `.claude/`, `scripts/`, `memory/` into the user's vault. The deliverable that's actually verified is a tasks.md that `resolve-task.mjs` parses — and its grammar is fully known. So I author spec/plan/tasks in spec-kit format (less invasive, identical verifiable outcome). Faithful to intent (spec-driven build entry + bridge to clusters), not to the literal installer.
- **Commit deferred to the user.** The vault is the user's personal notes repo with unrelated staged changes; per "commit only when asked," I write + verify the artifacts and prepare a scoped commit (`HDILINT/specs/` only) but leave it for the user to run.

## Criteria

**spec-kit-format build contract** *(revised in BUILD — see Decisions: HDILINT ⊂ vault repo)*
- [x] ISC-1: feature dir `HDILINT/specs/001-fitcheck-vto/` created with spec.md, plan.md, tasks.md
- [x] ISC-2: artifacts follow spec-kit's template structure (spec: scenarios+requirements · plan: stack+structure · tasks: phased numbered grammar)
- [x] ISC-3: authoring leaves HDILINT's existing files intact (vault status: no M/D lines on brand-spec.json, brand-config.yaml, wiki/)

**spec.md — the WHAT / WHY**
- [x] ISC-4: `spec.md` exists describing the Fitcheck VTO widget + landing page feature
- [x] ISC-5: spec.md covers the shopper try-on user flow (upload/select → render → see fit)
- [x] ISC-6: spec.md functional requirements include BOTH the Shopify widget and the landing page
- [x] ISC-7: spec.md is grounded in the brand-spec (positioning, persona) — not generic boilerplate
- [x] ISC-8: no silent ambiguity — clarifications resolved from brand-config; 2 genuine items explicitly `[FOUNDER]`-gated

**plan.md — the HOW**
- [x] ISC-9: `plan.md` exists with the technical stack for widget + landing + render
- [x] ISC-10: plan.md names the stack on explicit Language/Framework/Stack lines (resolve-task reads these)
- [x] ISC-11: plan.md is consistent with the provisioning checklist (Cloudflare Pages/Worker, NIM render)

**tasks.md — the build-entry (spec-kit grammar)**
- [x] ISC-12: tasks.md follows the `- [ ] T### [P] description + paths` grammar (resolve-task parsed all 20)
- [x] ISC-13: tasks.md has `## Phase N` headers (5 phases)
- [x] ISC-14: tasks cover landing page + Shopify widget + render API + ship/quality
- [x] ISC-15: each task carries distinctive tokens + a file path (0 unresolved after iterate)
- [x] ISC-16: tasks.md has 20 tasks (≥ 12 — a real breakdown)

**verify — the spec-kit → clusters bridge**
- [x] ISC-17: `resolve-task.mjs <tasks.md> <plan.md> --json` runs clean (exit 0)
- [x] ISC-18: every resolved cluster is REAL (9 organs; 0 phantoms)
- [x] ISC-19: unresolved=NONE, low-confidence=NONE (after rewording 5 mis-resolved tasks)
- [x] ISC-20: resolved clusters include the expected organs (frontend-web ✓ design ✓ media-gen render ✓)
- [x] ISC-21: media-gen (deferred) correctly flagged "activate"

**commit**
- [x] ISC-22: spec/plan/tasks written + verified; vault commit prepared + DEFERRED to user (HDILINT is entirely untracked in the personal vault — not auto-committed)

**Anti-criteria**
- [x] ISC-A1: no HDILINT spec-kit artifacts in skill-clusters (spec lives in HDILINT/, outside skill-clusters .git)
- [x] ISC-A2: HDILINT's brand-spec.json / brand-config.yaml / wiki not modified or deleted (no M/D lines)
- [x] ISC-A3: no secret values printed

## Verification

| Evidence | Result |
|---|---|
| `ls HDILINT/specs/001-fitcheck-vto/` | spec.md, plan.md, tasks.md ✓ |
| phase headers / task count | **5 phases, 20 tasks** (grammar parsed by resolve-task) |
| `resolve-task.mjs tasks.md plan.md --json` | **0 unresolved · 0 low-conf · 0 phantoms**; 9 real organs (design, frontend-web, creative-frontend, media-gen, python-backend, growth-content, growth-seo, cloudflare, quality-eval); media-gen→activate; modality local |
| iterate loop | 5 tasks mis-resolved on first pass (T005→ai-agents-meta, T007/T008/T009→business-content/expo, T014→ai-agents-meta) → reworded to lead with discipline → all corrected |
| reviewer subagent (swap for elements-of-style) | found lead-capture gap (FR-011, no task), WebGL gold-plating off the flat aesthetic, shared-token path, T004/T010 scoping → all fixed (added T018/T019/T020, de-gold-plated T008, quantified render SLA, reconciled enterprise flag) |
| vault `git status -- HDILINT` | `?? HDILINT/` only — no M/D on existing files; HDILINT untracked → commit deferred |
| skill-clusters `git status` | only the PRD work-dir; zero HDILINT product artifacts ✓ |

**Capability invocation check:** executing-plans (BUILD) ✓ · verification-before-completion (VERIFY) ✓ · elements-of-style UNAVAILABLE → honestly swapped to a general-purpose reviewer subagent (Task tool, writer/reviewer pattern) whose findings materially hardened the contract ✓. No phantom capabilities.
