---
name: conductor-core
description: "Shared reference for the conductor cluster: the closed-loop integration contract across PAI (triage+gates), spec-kit (specs), conducty (the loop), and skill-clusters (the capability resolver). USE WHEN wiring or reasoning about the spec→resolve→orchestrate→enforce→review→close loop, or deciding which organ owns a step."
cluster: conductor
version: 1.0.0
origin: "skill-clusters (original)"
---

# Conductor Core

The closed-loop engine has **four organs**; this cluster is the conductor + the seams. The one
fact everything turns on: **conducty conducts the loop; PAI triages + enforces gates around it;
spec-kit fronts it; skill-clusters resolves which capability runs each task.**

## 1. The four organs

| Organ | Owns | Mechanism |
|---|---|---|
| **PAI** (`~/.claude`) | triage (when/how-much) + fail-closed gates | Algorithm mode/tier; hooks deny / `exit 2` / inject / commit-on-criterion |
| **spec-kit** | the spec (structure of *what*) | `/specify→/plan→/tasks`; `tasks.md` = the machine-parseable queue |
| **conducty** | the loop (orchestrate + close) | Shape→…→Ship; tracer-first; circuit-breaker; **Failure Patterns → next Plan** |
| **skill-clusters** | which cluster / which skill (resolve) | `skill-index.json` + `resolve-task.mjs` + hub orchestrators |

## 2. The seams (contracts)

1. **spec-kit → resolver:** `tasks.md` checkbox grammar (`- [ ] T## [P] [US#] desc + path`) is the queue; `plan.md` Technical Context is the routing stack. **No skill field — by design.**
2. **resolver (the new organ):** `resolve-task.mjs <tasks.md> [plan.md] --json` → per task `{cluster, dispatch: <cluster>-orchestrator, tier, activate?, spokes[], confidence}`. **Classifier proposes the cluster/skill; the resolver validates** against `skill-index.json` (phantom-proof), flags low-confidence → human, marks deferred → `tier.mjs --activate`.
3. **conducty Execute → dispatch:** load the resolved `<cluster>-orchestrator` into the subagent (replaces conducty's `general-purpose`); the hub routes the spoke on demand.
4. **PAI gates enforce conducty's instructions:** `SkillClusterResolver` denies non-enumerated skills; flip fail-open `exit(0)` → fail-closed `exit(2)` for real gates; commit-on-criterion on `[ ]→[x]`.
5. **close the loop:** conducty Failure-Patterns + MCP `record_checkpoint/record_improvement/create_ship_report` + PAI `WorkCompletionLearning` + skill-cluster health → the vault graph the next cycle reads.

## 3. The conductor cycle (calibrated rigor)

Shape (appetite) → Plan (acceptance + verification + reviewLevel) → **Trace** (one tracer task
alone; fail → revise the *plan*) → Execute (resolved per cluster) → Verify (independent evidence
per task — Iron Law) → Debug (leverage points: **plan > prompt > code**; 3 strikes → STOP) →
Improve (Toyota-Kata; Failure Patterns) → Review (5-lens) → Ship (6-gate battery; advisory until
PAI gates pass; **never auto-merge**).

## 4. Triage doctrine (from PAI)

A classifier proposes; the system **obeys the validated line** and **rejects phantoms** (a
cluster/skill not in `skill-index.json` is a hard error, like PAI's Capability-Name audit). Effort
tiers and capability floors map onto conducty's `reviewLevel` (verify-only / spec-review / full-review).

## 5. Guardrails

- One canonical conductor (conducty); the others contribute organs — don't run three loops.
- Resolve to **real** clusters only; escalate low-confidence/unresolved tasks to a human.
- Independent verification per task; no self-attested "done"; tracer before multiplying.
- Gates are fail-**closed** for correctness/security/secrets; ship never auto-merges.
- Durable state lives in the vault graph — "history that doesn't change behavior is just a log."
