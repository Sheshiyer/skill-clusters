# Conductor Integration — closing the loop across PAI · spec-kit · conducty · skill-clusters

The skill-clusters system is **one wing** of a closed-loop agentic engine. This doc is the
integration contract: who owns what, the seams between them, and the phased build.

## The four organs (researched, grounded in the real repos)

| Organ | Repo | Owns | Key mechanism |
|---|---|---|---|
| **Triage + gates** | PAI (`~/.claude`, v4.0.3) | *when* / *how much* / *enforce* | `CLAUDE.md` mode (MINIMAL/NATIVE/ALGORITHM) + Algorithm v3.7.0; hooks enforce (deny / `exit 2` / inject). **No `capabilities.md` yet → cluster/skill triage is the gap.** |
| **Spec (structure of *what*)** | spec-kit (installed) | the work | `/specify→/plan→/tasks`. `tasks.md` = machine-parseable queue (`- [ ] T## [P] [US#] desc + path`). **Emits no skill binding.** |
| **Conductor (the loop)** | conducty (to install) | *orchestrate + close* | Shape→Plan→Trace→Execute→Verify→Improve→Review→Ship; tracer-first; 3-strike circuit-breaker; leverage-point debug (plan>prompt>code); **Failure Patterns → next Plan**; vault + 12-tool MCP for durable state. **Dispatches to `general-purpose` — no cluster routing.** |
| **Capability wing (resolve)** | **skill-clusters (this repo)** | *which cluster / which skill* | `skill-index.json` (skill→cluster/tier/status) + `SkillClusterResolver` hook + hub orchestrators. **The resolver none of the other three has.** |

## The canonical loop (decided)

**conducty conducts**; PAI triages + enforces fail-closed gates *around* it; spec-kit fronts it
(Shape/Plan); skill-clusters resolves capability per task.

```mermaid
graph LR
  R[request] --> T["PAI triage hook<br/>MODE/TIER + (new) CLUSTER/SKILL line"]
  T --> S["spec-kit<br/>spec → plan → tasks.md (queue)"]
  S --> RES["skill-clusters resolver<br/>classifier proposes → resolve-task.mjs validates<br/>(real cluster? deferred→activate? real spoke?)"]
  RES --> C["conducty Execute<br/>tracer-first → dispatch subagent loaded w/ <cluster>-orchestrator"]
  C --> G["PAI gates (fail-closed)<br/>SkillClusterResolver/SkillGuard deny · exit2 · commit-on-criterion"]
  G --> V["conducty Verify → checkpoint gate → code-review → ship battery"]
  V --> L["close: Failure Patterns → next Plan + PAI WorkCompletionLearning → vault graph"]
  L -.sharper next cycle.-> T
```

## The seams (the integration contracts)

1. **PAI triage → spec-kit.** PAI mode = ALGORITHM + a build intent ⇒ route to the spec-kit/conducty path. (Today: manual. Phase 3 adds a classifier line `CLUSTER: <x> | SKILL: <y>`.)
2. **spec-kit → resolver.** `tasks.md` checkbox grammar is the queue (90% machine-parseable: id, `[P]`, `[US#]`, paths, `[x]`). `plan.md` Technical Context is the routing stack. **No skill field — by design.**
3. **resolver → conducty (THE missing organ — built).** `scripts/resolve-task.mjs <tasks.md> [plan.md]` → per-task `{cluster, dispatch: <cluster>-orchestrator, tier, activate?, spokes[], confidence}` + `touched`, `activate`, `unresolved`. **v1.5 = deterministic keyword scoring — IDF · sqrt-damped cluster mass · explicit handle-match · unique tokens (5/5 on the mixed smoke, up from 1/5). Next = classifier proposes cluster/skill, resolve-task VALIDATES** (phantom-proof against the index; deferred→activate; low-confidence→human escalation — mirrors PAI's Capability-Name audit).
4. **conducty Execute → dispatch.** Replace conducty's hard-coded `subagent_type: general-purpose` with the resolved `<cluster>-orchestrator` (loaded into the subagent); the hub routes to the spoke (on-demand from the pointer). Deferred clusters are `tier.mjs --activate`-ed first.
5. **PAI gates enforce conducty's instructions.** conducty *instructs* verification; PAI hooks *enforce* it: `SkillClusterResolver` already denies non-enumerated skills with resolution guidance; add a `commit-on-criterion` (PostToolUse on `[ ]→[x]`) and flip fail-open `exit(0)` → fail-closed `exit(2)` for true gates.
6. **close the loop.** conducty's `Failure Patterns → next Plan` + MCP `record_checkpoint/record_improvement/create_ship_report` is the durable close; pair with PAI `WorkCompletionLearning`. The skill-clusters `skills-health` + (future) runtime-health feed cluster quality back.

## Build phases

- **✅ Phase 0 — resolver tracer.** `scripts/resolve-task.mjs` built + proven on real snow-gloves `tasks.md`. Emits dispatch plans, flags deferred-to-activate + unresolved. *(Phase 0 honest result: keyword v1 was noisy. Phase 2 hardened it to v1.5 — see below — solidifying the keyword floor; the classifier still owns genuinely ambiguous stack-vs-domain.)*
- **✅ Phase 1 — vendor conducty** as the `conductor` cluster (MIT). 19 `conducty-*` loop skills as on-demand spokes + authored `conductor-orchestrator`/`conductor-core` (the integration glue). Only the 2 hubs enumerate at startup; debloat invariant holds. Health PASS 0/0. *(Vendored, not installer-run, to avoid bloating `~/.claude` + editing CLAUDE.md.)*
- **✅ Phase 2 — wire Execute → resolver.** `conducty-execute` patched with a **Resolve before dispatch** step: calls `resolve-task.mjs`, loads the resolved `<cluster>-orchestrator` into the subagent (curation item 1.5), `tier.mjs --activate`s deferred clusters per wave, and fails closed via the `SkillClusterResolver` hook. Resolver scoring hardened **v1→v1.5** (IDF · sqrt-dampen cluster mass · explicit handle-match · unique tokens): **5/5 on a mixed RN/Rust/Flutter/Remotion/Supabase smoke** (was 1/5 — all collapsed to `frontend-web`), with `mobile-flutter` correctly flagged deferred→activate.
- **✅ Phase 3 — the classifier line.** `resolve-task.mjs --propose <file.json|id=cluster,...>` built. The classifier is the **conductor LLM itself** (no new PAI hook, no `~/.claude` bloat): it proposes a cluster/skill per task; the resolver **VALIDATES** against the index — accepts real proposals (overriding the keyword guess, `source:classifier` / `◇!` / `overrode`), and **rejects phantoms** (`phantoms` + `badSkills`, keeping the keyword result) exactly like PAI's Capability-Name audit. Smoke-passed every path: agree · override · phantom-reject · bad-skill. The existing `SkillClusterResolver` PAI hook stays as runtime enforcement.
- **Phase 4 — fail-closed gates.** `commit-on-criterion` hook; flip gate hooks to `exit(2)`; the ship battery (lint/typecheck/tests/secrets/vuln) as enforced, not advisory.
- **Phase 5 — close the feedback.** conducty Failure-Patterns + MCP state ↔ PAI learning ↔ skill-cluster health; the vault graph is the shared memory the next cycle reads.

## Decisions on file
Canonical conductor = **conducty**. Triage = **classifier proposes + resolver validates**. Deliverable
= **full working integration** (built tracer-first across the phases above).
