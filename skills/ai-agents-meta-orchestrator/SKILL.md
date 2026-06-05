---
name: ai-agents-meta-orchestrator
description: "Route an AI-agent engineering task to the right skill among 14 meta specialists — planning a multi-session build, decomposing a plan into an agent chain, orchestrating a squad, running an autonomous loop, auditing/debugging the agent stack, optimizing prompts, and controlling token/cost budget. USE WHEN a user is designing, building, operating, or hardening an LLM-agent system but hasn't named the specific concern."
cluster: ai-agents-meta
version: 1.0.0
---

# AI Agents Meta Orchestrator

The single entry skill for *building agents that build* — the meta layer above any one
agent app. It locates the task on the **lifecycle × concern** map (plan → compose →
orchestrate → loop → audit → economize → evolve) and delegates to one of 14 specialist
spokes. The cross-cutting decision every spoke turns on — **eval-first execution with a
default-deny autonomy boundary** — lives in `ai-agents-meta-core`; read it before wiring an
autonomous loop, granting tools, or routing by model cost.

## Cluster map (intent → spoke)

**Foundation & discipline**
- `agentic-engineering` — the core practice: eval-first execution, decomposition, cost-aware model routing.
- `search-first` — research-before-coding; find existing tools/libs/patterns before writing custom agent code.

**Plan & compose**
- `blueprint` — turn a one-line objective into a multi-session construction plan; each step has a cold-start brief, dependency graph, and adversarial review gate.
- `plan-orchestrate` — read a plan, decompose into steps, and emit ready-to-paste per-step agent chains for an orchestrator command.

**Architect the runtime**
- `agentic-os` — build a persistent multi-agent OS on Claude Code: kernel, specialist agents, slash commands, file-based memory, scheduled automation, no external DB.
- `dynamic-workflow-mode` — design task-local harnesses, eval gates, and reusable skill extraction for adaptive agent runs.

**Orchestrate & loop**
- `team-agent-orchestration` — run squads with work items, ownership, agent Kanban, merge gates, and control-pane handoffs.
- `continuous-agent-loop` — patterns for continuous autonomous loops with quality gates, evals, and recovery controls.

**Audit & debug**
- `agent-architecture-audit` — full-stack 12-layer diagnostic; finds wrapper regression, memory pollution, tool-discipline failures, hidden repair loops.
- `agent-introspection-debugging` — structured self-debugging: capture → diagnose → contained recovery → introspection report.

**Prompt & economics**
- `prompt-optimizer` — analyze a draft prompt, match it to available components, emit a paste-ready optimized prompt (advisory only).
- `cost-aware-llm-pipeline` — model routing by task complexity, budget tracking, retry logic, prompt caching.
- `token-budget-advisor` — give the user an informed choice about response depth/token spend before answering.

**Evolve**
- `continuous-learning-v2` — observe sessions via hooks, mint atomic instincts with confidence scoring, evolve them into skills/commands/agents (project-scoped).

## Routing rules by intent

1. **"Help me plan / scope a big agent project"** → `blueprint`; if a plan already exists and needs an execution chain → `plan-orchestrate`.
2. **"Should I build this myself?"** → `search-first` first, always, before any custom-code spoke.
3. **"Stand up the agent system / kernel / memory"** → `agentic-os`; for a one-off adaptive run instead of a standing OS → `dynamic-workflow-mode`.
4. **"Coordinate several agents"** → `team-agent-orchestration`; if it should run unattended with gates → `continuous-agent-loop`.
5. **"It's misbehaving / regressed / loops forever"** → `agent-architecture-audit` to localize the layer, then `agent-introspection-debugging` to recover.
6. **"It's too expensive / too slow / too verbose"** → `cost-aware-llm-pipeline` (API spend), `token-budget-advisor` (per-answer depth), `prompt-optimizer` (wasteful prompts).
7. **"Make it learn from itself"** → `continuous-learning-v2`.
8. **"Build/run the eval harness or benchmark the agent itself"** → that *tooling* lives in the `quality-eval` cluster (`agent-eval`, `eval-harness`, `verification-loop`, `benchmark`, `production-audit`); this cluster owns eval-first *discipline*, not the harness.
9. **Unsure / cross-cutting** → pull the model from `ai-agents-meta-core`, then route.

## Standard flow

1. Locate the task: which lifecycle stage (plan → compose → architect → orchestrate → audit → economize → evolve) and which concern.
2. If it touches **autonomy, tool grants, eval gates, or model/cost routing**, pull the model from `ai-agents-meta-core` first — these are interlocking, not independent.
3. Delegate to the spoke(s). Multi-step asks fan out in lifecycle order (e.g. "build and ship a multi-agent feature" → `search-first` → `blueprint` → `plan-orchestrate` → `team-agent-orchestration` → `agent-architecture-audit`).
4. Return: chosen spoke(s), the autonomy/eval/cost changes implied, and the next action.

## Guardrails

See `ai-agents-meta-core`. In short: **eval-first** — no autonomous step ships without a gate
that can fail it; **default-deny autonomy** — grant the narrowest tool/permission/loop budget
that works and state every widening; **research before building** (`search-first`) so you don't
hand-roll what already exists; route by **task complexity, not habit** to control cost; and keep
a human decision point at every handoff. The value of this cluster is a *governable* agent
system — don't let a loop run unbounded or a prompt balloon silently.

## Loading spokes on demand

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as skills — only this orchestrator and its `*-core` are enumerated. When you route to a spoke named above, **load it on demand** by reading its file:

`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`  (or `skills/<spoke-name>/SKILL.md` inside the skill-clusters repo).
