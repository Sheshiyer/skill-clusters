# HDILINT Live-Slice Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Take HDILINT (a Kimi virtual-try-on plugin) from idea → canonical brand-spec → on-brand build → live launch + cold-outbound, fully founder-gated, proving the whole tapestry end-to-end.

**Architecture:** Federated organs (brandmint · taste · conductor+clusters · explee · PostHog) wired by snow-gloves, run **local-first** in the agent harness; cloud only for the NIM Worker. Phase 0 builds the shared safety infra (router · idempotency · governor · brand-spec) that every later phase depends on; Phases 1–5 run the venture through the organs with a founder gate at each irreversible step (spend · outbound · publish/deploy · brand).

**Tech Stack:** zero-dep Node `.mjs` (skill-clusters convention) · NVIDIA NIM (embed/vision/chat) + Claude + gpt-image-2/arcplume via the router · Cloudflare Worker + KV (`taste-nim`) · explee/AutoGTM + Composio · PostHog · spec-kit (`/specify→/plan→/tasks`).

**Conventions:** TDD where there's logic (router, governor, idempotency, validator); each task ends in a commit; every irreversible action carries an idempotency key and waits behind its gate. Verify before claiming done (@superpowers:verification-before-completion).

---

## Phase 0 — Shared safety infra (unblocks + protects everything)

### Task 1: Model router + `chat()` lane (best-of-breed, per-task fallback)

**Files:**
- Create: `taste/scripts/lib/router.mjs`
- Modify: `taste/scripts/lib/nim.mjs` (add `chat()`)
- Test: `taste/scripts/lib/router.test.mjs`

**Step 1 — failing test:** assert `route('creative-text')` returns `{provider:'claude', model:..., fallback:[...]}`, `route('embed')` returns NIM, `route('image')` returns gpt-image-2, and an unknown task throws.
**Step 2 — run:** `node --test taste/scripts/lib/router.test.mjs` → FAIL.
**Step 3 — implement:** `router.mjs` exports `route(task)` reading a `ROUTES` table:
```
creative-text → {claude} fallback [nim:llama-3.3-70b]
structured-json → {nim:llama-3.3-70b} fallback [claude]
code → {claude} fallback [nim]
outreach → {claude} fallback [nim]
image → {gpt-image-2} fallback [fal] ; video → {arcplume} fallback [fal-video]
embed → {nim:nv-embedqa} ; vision → {nim:llama-vision}
```
and `generate(task, payload)` that picks `route(task)`, calls the provider, fails over on error. Add `nim.chat(messages, {model})` (POST `/chat/completions`, same pool/Worker path as `vlmAnnotate`).
**Step 4 — run:** tests PASS.
**Step 5 — commit:** `feat(taste): model router + nim.chat() — best-of-breed per task with fallbacks`.

### Task 2: Budget + rate governor (metered in the router)

**Files:** Modify `taste/scripts/lib/router.mjs` · Test `taste/scripts/lib/governor.test.mjs` · Create `taste/scripts/lib/governor.mjs`

**Step 1 — failing test:** a governor with cap=100 warns at ≥80 spent, throws `BudgetPaused` at ≥100; rate-limit blocks the N+1th call in a window.
**Step 2 — FAIL.** **Step 3 — implement:** `governor.mjs` tracks per-venture spend (a JSON/KV counter), `charge(venture, costEstimate)` → warn (emit to Hermes stub) / throw at cap; a token-bucket rate limit. Wire `generate()` to `charge()` before each call. **Step 4 — PASS.**
**Step 5 — commit:** `feat(taste): per-venture budget+rate governor (soft-warn → hard-pause)`.

### Task 3: Idempotency ledger (KV) at the action boundary

**Files:** Create `taste/scripts/lib/idempotency.mjs` · Test `taste/scripts/lib/idempotency.test.mjs`

**Step 1 — failing test:** `once(key, fn)` runs `fn` the first time, returns the cached result + does NOT run `fn` the second time (same key); distinct keys both run.
**Step 2 — FAIL.** **Step 3 — implement:** `once(key, fn)` — key = sha256 of action content; check a durable store (local JSONL for slice-1, KV in prod) before firing, record result after. Export `actionKey(type, payload)`. **Step 4 — PASS.**
**Step 5 — commit:** `feat(taste): idempotency ledger — irreversible actions fire exactly once`.

### Task 4: Provider fallback config + session-failure detection

**Files:** Modify `taste/scripts/lib/router.mjs` · Test `taste/scripts/lib/router.test.mjs`

**Step 1 — failing test:** when the primary provider throws (simulating an expired gpt-image-2 session), `generate('image')` auto-engages the fallback and succeeds; logs the failover.
**Step 2 — FAIL.** **Step 3 — implement:** wrap each provider call in try → on error, walk the `fallback[]` chain; mark a provider "session-degraded" + emit a Hermes alert. **Step 4 — PASS.**
**Step 5 — commit:** `feat(taste): hybrid provider fallback — session primary, API-key backup auto-engages`.

### Task 5: Canonical `brand-spec.json` schema + validator

**Files:** Create `taste/schemas/brand-spec.schema.json` · Create `taste/scripts/validate-brand-spec.mjs` · Test `taste/scripts/validate-brand-spec.test.mjs`

**Step 1 — failing test:** a complete spec (identity · positioning · voice_tokens · visual_tokens{palette,type,motion,imagery} · persona · taste_seed · assets[]) validates; a spec missing `visual_tokens` fails with a clear path.
**Step 2 — FAIL.** **Step 3 — implement:** draft-07 schema + a zero-dep validator (reuse the `skills-health` frontmatter-parse style). **Step 4 — PASS.**
**Step 5 — commit:** `feat(taste): canonical brand-spec schema + validator (the on-brand contract)`.

---

## Phase 1 — Brand genesis  *(gate: brand + strategic direction)*

### Task 6: Emit HDILINT's canonical brand-spec from brandmint
- **Do:** run brandmint on `HDILINT/brand-config.yaml` (or formalize its existing `wiki/` output) → write `HDILINT/brand-spec.json`; validate with Task-5's validator.
- **Verify:** `node taste/scripts/validate-brand-spec.mjs HDILINT/brand-spec.json` → PASS.
- **🚦 GATE → Hermes:** founder approves the brand identity/positioning before anything builds.
- **Commit:** `feat(hdilint): canonical brand-spec emitted + validated`.

### Task 7: Seed taste prototype + (federated) brand memory
- **Do:** `bootstrap-brand.mjs --brand hdilint --docs HDILINT/ --spec HDILINT/brand-spec.json` → taste prototype; (federated for slice-1 — no noesis).
- **Verify:** `taste-resolve "hero for a virtual try-on plugin" --brand hdilint` returns on-brand exemplars.
- **Commit:** `feat(hdilint): taste prototype seeded from brand-spec`.

## Phase 2 — Build on-brand  *(gate: publish/deploy)*

### Task 8: idea → spec → tasks (the build-entry, live-gating medium)
- **Do:** spec-kit `/specify → /plan → /tasks` for "virtual try-on plugin + landing page" → `HDILINT/tasks.md`.
- **Verify:** `resolve-task.mjs HDILINT/tasks.md HDILINT/plan.md --json` resolves each task to a cluster.
- **Commit:** `feat(hdilint): spec-kit tasks.md for the build`.

### Task 9: Conductor builds the artifact, taste-injected
- **Do:** conductor Execute: per task, `taste-resolve --brand hdilint` → inject brief → dispatch the resolved `<cluster>-orchestrator` → build the plugin + landing page.
- **Verify:** the landing page builds + renders; `ship-battery.mjs --dir <build>` PASS (fail-closed).
- **🚦 GATE → Hermes:** founder approves before deploy.
- **Commit (per artifact):** atomic commits via the conductor.

## Phase 3 — Distribute  *(gates: spend · outbound)*

### Task 10: Prepare the explee campaign (idempotency-keyed)
- **Do:** load HDILINT's GTM leads + outreach templates → explee/AutoGTM campaign; every send wrapped in `once(actionKey('outreach', lead))`.
- **Verify:** dry-run shows N unique sends, 0 duplicates; explee deliverability is explee's (their domains).
- **🚦 GATE → Hermes:** founder approves spend + the outbound batch.

### Task 11: Composio reply-loop
- **Do:** connect the founder inbox (Gmail/Zoho) via Composio → explee conversations + replies retrievable by the agent.
- **Verify:** a test reply appears in the agent's feedback read; routes to the response playbook (drafts are outbound-gated).
- **Commit:** `feat(hdilint): Composio reply-loop wired to the feedback`.

## Phase 4 — Measure + close

### Task 12: PostHog analytics organ
- **Do:** instrument the landing page + the GTM funnel in PostHog → emit revenue/demand/quality signal to the composite north-star.
- **Verify:** events land in PostHog; the north-star policy reads them.
- **Commit:** `feat(analytics): PostHog wired as the sensory organ`.

### Task 13: Close the loop to the founder
- **Do:** `loop-feedback` + `taste-feedback` + the north-star rollup → snow-gloves digest → **Hermes** standup; Sentinel watches drift.
- **Verify:** a digest reaches Hermes with the slice's status + pending gates.

## Phase 5 — Go live  *(all four gates)*

### Task 14: Live rails + approval-deadline policy (live-gating mediums)
- **Do:** provision domain/hosting/DNS/SSL (check domain availability against the brand name); set the approval-deadline policy (each gate carries a TTL + a safe default = "hold, don't fire" if the founder is slow).
- **Verify:** the site deploys to a staging URL; a gate left unanswered holds (never auto-fires).

### Task 15: The live launch
- **Do:** founder approves all four gates via Hermes → publish the site live → explee sends the first outreach batch (idempotency-protected) → PostHog measures.
- **Verify:** site is live + reachable; explee shows the campaign sent; first signals land in PostHog → north-star.
- **Definition of done:** an idea became a branded, built, **live** venture with real outbound running — every irreversible step founder-approved, nothing fired twice, costs governed.

---

## Risk register (from the gap analysis — watched during execution)
- Generation off-brand → Task 5 spec + Task 7 taste injection.
- Double-fire → Task 3 idempotency on every outbound/deploy.
- Cost runaway → Task 2 governor.
- Session provider dies → Task 4 fallback.
- Deliverability → explee's domains (not ours); Composio for the reply loop.
- noesis assumed → consciously federated for slice-1 (Task 7 note).
