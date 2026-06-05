---
name: conductor-orchestrator
description: "Run a spec-driven build through the closed conductor loop — shape → plan → execute → verify → improve → review → ship — dispatching each task to the right skill-cluster and closing the feedback loop. USE WHEN executing a spec-kit feature/tasks.md, orchestrating multi-step build work that needs review + verification, or running the conducty loop. Pairs with conductor-core (the integration contract)."
cluster: conductor
version: 1.0.0
origin: "skill-clusters (original) — integrates conducty (MIT), spec-kit, PAI"
---

# Conductor Orchestrator

The single entry for **closed-loop, spec-driven build work**. It runs conducty's conductor cycle,
but with the one organ conducty lacks: each task is dispatched to the **right skill-cluster** via
the resolver, and deferred clusters are activated on demand. Read `conductor-core` for the full
integration contract; this routes the loop.

## The loop (conducty cycle) → spokes

| Phase | Spoke | What |
|---|---|---|
| **Shape** | `conducty-shape` | appetite, no-go zones — fed by the spec-kit `spec.md` (the *what/why*). |
| **Plan** | `conducty-plan` | acceptance criteria, verification, reviewLevel — fed by `plan.md` (the *how/stack*). |
| **Trace** | `conducty-execute` (tracer) | run ONE tracer task per group alone; fail → revise the plan, not the prompt. |
| **Execute** | `conducty-execute` + **resolver** | dispatch each `tasks.md` task to its cluster (see below). |
| **Verify** | `conducty-verify`, `conducty-checkpoint` | Iron Law: no advancement without independent evidence per task. |
| **Debug** | `conducty-debug` | classify failure **plan > prompt > code**; 3 strikes on one task → STOP/escalate. |
| **Improve** | `conducty-improve` | Toyota-Kata; append to **Failure Patterns** → next Plan reads it. |
| **Review/Ship** | `conducty-code-review`, `conducty-ship` | 5-lens review + ship battery. conducty's battery is *advisory*; run `scripts/ship-battery.mjs` to make it **fail-closed** — non-zero exit on any required gate (structural/secrets/lint/typecheck/tests) → do not ship, escalate. |
| State | `conducty-obsidian`, `conducty-vault-graph`, `conducty-bootstrap` | durable loop memory in the vault. |

## Execute — the integration (THIS is the new organ)

conducty's Execute dispatches to `general-purpose`. Instead, **resolve each task to a cluster** and
load that cluster's orchestrator into the subagent:

1. **Resolve the dispatch plan:**
   `node ~/.agents/skill-clusters/scripts/resolve-task.mjs <tasks.md> <plan.md> --json`
   → per task: `{cluster, dispatch: <cluster>-orchestrator, tier, activate?, spokes[], confidence}`.
2. **Classifier proposes, resolver validates** (the chosen triage): for each task, propose the
   cluster/skill from the task intent, then trust the resolver's validation — it rejects phantom
   clusters (only real ones in `skill-index.json`), flags **low-confidence/unresolved → escalate to human**,
   and marks **deferred clusters to activate**.
3. **Activate deferred clusters** the wave touches: `node ~/.agents/skill-clusters/scripts/tier.mjs --activate <cluster> --apply`.
4. **Dispatch** a `conducty-execute` subagent whose loaded skill is the resolved `<cluster>-orchestrator`
   (the hub then routes to the spoke on demand). Respect `[P]` for parallel waves; tracer-first per group.
5. **Gate** via PAI hooks (`SkillClusterResolver` denies non-enumerated skills; fail-closed `exit(2)` gates;
   commit-on-criterion). The orchestrator never writes the verdict — it synthesizes the subagents' status.

## Standard flow

spec-kit `/specify → /plan → /tasks` → **conductor-orchestrator**: shape→plan from the spec →
trace → (resolve) execute per cluster → verify/checkpoint → debug (leverage points) → improve
(Failure Patterns) → code-review → ship → **close**: write outcomes to the vault graph so the next
cycle is sharper.

## Guardrails

See `conductor-core`. In short: tracer before multiplying; independent verification per task (no
self-attested "done"); leverage-point debug (fix at plan level, not code, when 2+ tasks fail);
3-strike circuit breaker; never auto-merge (ship is advisory until PAI gates pass); resolve to
**real** clusters only (phantom-proof); escalate low-confidence tasks to a human.

## Loading spokes on demand

This cluster's spokes (the `conducty-*` loop skills) are not separately enumerated — only this
orchestrator and `conductor-core` are. Load a spoke on demand from
`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`.
