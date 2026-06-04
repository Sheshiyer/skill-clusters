---
name: security-orchestrator
description: "Route a security task to the right skill among six specialists — defensive code review, offensive/bounty vulnerability hunting, agent-config (.claude) auditing, source-asset & embedded-dependency scanning, a pre-action fact-forcing gate, and destructive-operation safety locks. USE WHEN a user wants to secure, audit, harden, or attack a codebase or an agent setup but hasn't named the specific concern."
cluster: security
version: 1.0.0
---

# Security Orchestrator

The single entry skill for security work. It locates the task on the **posture ×
surface** map — *defend vs attack* against *code, agent-config, or live runtime* — and
delegates to one of six specialist spokes. The cross-cutting idea every spoke shares — the
**trust boundary**: where untrusted, attacker-controlled input or action reaches a privileged
sink, and the default-deny posture that contains it — lives in `security-core`; read it
before triaging a finding or deciding whether something is exploitable.

## Cluster map (spoke → role)

- **`security-review`** — Defensive code review. The build-time checklist: secrets management, authn/authz, input handling, API endpoints, payments, transport, plus a cloud-infrastructure-security companion. Use when *writing or reviewing* code that touches a sensitive surface.
- **`security-bounty-hunter`** — Offensive discovery. Hunts remotely reachable, user-controlled, *exploitable* vulnerabilities (SSRF, auth bypass, RCE, SQLi, path traversal) and discards noisy local-only findings. Use when the question is "does this actually pay / is this reportable?".
- **`security-scan`** — Agent-config audit. Scans a `.claude/` setup (CLAUDE.md, settings.json, MCP servers, hooks, agent defs) for injection, over-permissive allowlists, and supply-chain risk via the `ecc-agentshield` tool. Use when securing the *agent harness itself*.
- **`repo-scan`** — Source-asset audit. Classifies every file as project / third-party / artifact, detects embedded (vendored) libraries and their versions, and emits four-level verdicts. Use to find outdated bundled OpenSSL/FFmpeg/etc. and unowned attack surface across a polyglot repo.
- **`gateguard`** — Pre-action fact-forcing gate. A PreToolUse hook that blocks the first Edit/Write/Bash and demands concrete investigation (importers, data schema, the user's instruction) before allowing it. Use to stop blind, guessed changes in an autonomous loop.
- **`safety-guard`** — Destructive-operation lock. Intercepts `rm -rf`, force-push, `DROP TABLE`, etc., and freezes writes to a chosen directory. Use to contain blast radius when an agent runs full-auto or on production.

## Routing rules by intent

**Defend — code (build time)**
- "Review this for security" / adding auth, input handling, secrets, payments → `security-review`
- Cloud/IaC posture (IAM, buckets, network) → `security-review` (cloud-infrastructure-security companion)

**Attack — code (find real bugs)**
- "Find exploitable vulns" / prep a Huntr/HackerOne report / triage exploitability → `security-bounty-hunter`

**Audit — what's already there**
- Audit the *agent/Claude Code config* → `security-scan`
- Audit the *source tree* (ownership, vendored deps, dead weight) → `repo-scan`

**Contain — live agent runtime**
- Force investigation before edits (quality + safety) → `gateguard`
- Block destructive commands / freeze the writable area → `safety-guard`

If the ask is broad ("make this secure"), default to `security-review` for the code path and
offer `security-scan` for the agent config — they cover the two most common surfaces.

## Sibling clusters (framework-native security)

This cluster owns **cross-cutting** security — review, scan, bounty — across any stack. When the
concern is bound to a specific framework or domain, hand off to that cluster's own security spoke:

- Python/Django → `django-security` (cluster `python-backend`)
- PHP/Laravel → `laravel-security` (cluster `php-laravel`)
- JVM (Spring Boot / Quarkus) → `springboot-security` / `quarkus-security` (cluster `jvm`)
- On-chain / smart contracts → cluster `blockchain-web3` (e.g. `defi-amm-security`)
- Desktop (Electron) → `electron-security` (cluster `electron`)

Use those for in-framework hardening; route back here for stack-agnostic code review, config/asset scanning, or exploitability triage.

## Standard flow

1. Place the task on **posture × surface**: are we *defending or attacking*, and is the surface *code, agent-config, or runtime*?
2. If it involves judging a finding (reachable? user-controlled? meaningful sink?), pull the **trust-boundary model** from `security-core` first — exploitability is a property of the path, not the pattern.
3. Delegate to the spoke(s). Multi-surface asks fan out: e.g. "harden this agent project" → `security-scan` (config) + `security-review` (code) + `safety-guard` (runtime lock).
4. Return: chosen spoke(s), the surface/posture, the severity or verdict implied, and the next action.

## Guardrails

See `security-core`. In short: **default-deny** — grant the narrowest permission/scope that
works and treat any widening as a security change. **Exploitability over theory** — rank by
"can attacker-controlled input reach a meaningful sink?", not by lint pattern count; drop
local-only and out-of-scope noise. **Contain before you trust** — in autonomous runs keep
`safety-guard`/`gateguard` on. **Never weaken a control silently** — disabling a gate, widening
an allowlist, or adding a host is a stated decision, never a quiet one.
