---
name: quality-eval-orchestrator
description: "Route a quality/testing/evaluation task to the right skill among 12 specialists — eval-driven development, head-to-head agent benchmarking, TDD, the verification gate, E2E (web + Windows desktop), AI-regression and browser QA, error-handling design, performance baselines, write-time linting, and production-readiness audits. USE WHEN a user wants to test, verify, evaluate, benchmark, or harden code or an agent but hasn't named the specific gate."
cluster: quality-eval
version: 1.0.0
---

# Quality-Eval Orchestrator

The single entry skill for proving software (and the agents that write it) actually
works. It places the task on the **gate-stage × subject** map and delegates to one of
12 specialist spokes. The cross-cutting model every spoke shares — the four quality
gates (write → commit → CI → ship), what "evidence" means at each, and how `pass@k`
separates a flaky pass from a real one — lives in `quality-eval-core`; read it before
deciding what counts as "done" or wiring a measurement loop.

## Cluster map (spoke → role)

- `eval-harness` — formal eval-driven development: pass/fail criteria + `pass@k` reliability for Claude Code task completion.
- `agent-eval` — head-to-head comparison of coding agents (Claude Code, Aider, Codex…) by pass rate, cost, time, consistency.
- `tdd-workflow` — red→green→refactor discipline with 80%+ coverage (unit + integration + E2E) on new features, bugfixes, refactors.
- `verification-loop` — the commit-time gate: a structured "is this actually finished?" check before a PR.
- `e2e-testing` — Playwright patterns: Page Object Model, config, CI/CD, artifacts, flaky-test strategies (web apps).
- `windows-desktop-e2e` — native desktop E2E via pywinauto + Windows UIA (WPF, WinForms, Win32/MFC, Qt).
- `ai-regression-testing` — regression patterns for AI-written code: sandbox/mock-mode API tests, blind-spot catching where one model both writes and reviews.
- `browser-qa` — automated visual + interaction verification of a deployed/preview UI.
- `error-handling` — robust error design across TS/Python/Go: typed errors, boundaries, retries, circuit breakers, user-facing messages.
- `benchmark` — performance baselines + regression detection before/after a PR; stack-alternative comparison.
- `plankton-code-quality` — write-time gate: auto-format, lint, and Claude-powered fixes on every file edit via hooks.
- `production-audit` — release-time gate: local-evidence production-readiness audit ("what breaks in prod?") with no third-party data sharing.

## Routing rules by intent

**Define what "done" means / measure reliability**
- "How do I know the agent succeeded?" / pass@k → `eval-harness`  *(model in `quality-eval-core`)*
- "Which coding agent/model is best for this repo?" → `agent-eval`

**Write code correctly (test-first)**
- New feature / bugfix / refactor → `tdd-workflow`
- Designing error types, retries, circuit breakers → `error-handling`

**Verify a change is finished**
- Final "is it really done?" before a PR → `verification-loop`
- Catch regressions in AI-modified backend/API → `ai-regression-testing`

**Test behavior end-to-end**
- Web app flows → `e2e-testing`
- Native Windows desktop app → `windows-desktop-e2e`
- Visual / interaction check on a deployed UI → `browser-qa`

**Performance**
- Baselines, before/after PR, "it feels slow" → `benchmark`

**Guard quality continuously / before shipping**
- Format + lint on every edit → `plankton-code-quality`
- "Is it ready to ship / what breaks in prod?" → `production-audit`

## Sibling clusters

- **Language/stack-native tests** — for a specific language or stack, defer to that cluster's `*-testing` spoke: `python-testing` (`python-backend`), `rust-testing` (`rust`), `react-testing` (`frontend-web`), `golang-testing` / `cpp-testing` / `perl-testing` (`systems-languages`), `kotlin-testing` (`jvm`), `swift-protocol-di-testing` (`native-ios`), `testing-tauri-apps` (`tauri`). This cluster owns the language-agnostic discipline (TDD, the eval harness, the four gates) — not per-stack test syntax or framework idioms.

## Standard flow

1. Locate the task: which **gate stage** (write-time → test → verify → benchmark → ship) and which **subject** (code, a web/desktop UI, or an agent).
2. If it touches **what counts as done, pass@k, or a measurement loop**, pull the model from `quality-eval-core` first — gates and evidence are shared, not per-spoke.
3. Delegate to the spoke(s). Multi-step asks fan out in gate order (e.g. "ship this feature safely" → `tdd-workflow` → `e2e-testing` → `verification-loop` → `production-audit`).
4. Return: chosen spoke(s), the gate stage, what evidence will prove the outcome, and the next action.

## Guardrails

See `quality-eval-core`. In short: **evidence over assertion** — never report a pass
without the command output that proves it; a single green run is not a pass (use `pass@k`
for anything non-deterministic or agent-driven). Don't let the thing being tested also
silently grade itself (the AI write-and-review blind spot), and don't let a gate be
satisfied by loosening its own config — flag config tampering. Pick the cheapest gate
that catches the failure class: a write-time lint shouldn't be doing a production audit's
job, and vice versa.

## Loading spokes on demand

To keep CLI startup context lean, this cluster's spokes are **not** separately registered as skills — only this orchestrator and its `*-core` are enumerated. When you route to a spoke named above, **load it on demand** by reading its file:

`~/.agents/skill-clusters/skills/<spoke-name>/SKILL.md`  (or `skills/<spoke-name>/SKILL.md` inside the skill-clusters repo).
