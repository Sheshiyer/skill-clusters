# Harness / PAI Handoff Contract

How the **skill-clusters** debloat system hands off to the tool harness, hooks, and the PAI
orchestration — so no skill reference becomes a stale/broken link that errors at runtime.

> **Current state:** 716 indexed · 54 enumerated hubs · 27 active / 13 deferred · 75 archived. The
> `SkillClusterResolver` hook is live; `audit-refs` reports **0 stale refs**. This handoff is the
> runtime-safety layer under the closed loop (see [`CONDUCTOR-INTEGRATION.md`](CONDUCTOR-INTEGRATION.md)).

## The situation

The harness enumerates skills by scanning `~/.agents/skills` + `~/.claude/skills` at startup.
For context debloat, skill-clusters keeps that scanned set **lean**:

| State | In scanned dir? | Enumerated? |
|---|---|---|
| **active-hub** (active cluster's orchestrator/core) | yes (symlink) | ✅ |
| **active-spoke** (active cluster's spoke) | no — in repo only | ❌ on-demand |
| **deferred-\*** (a deferred cluster) | no | ❌ until activated |
| **archived** (bundle / one-off / clustered-away original) | no — in `~/.agents/skills-archive/` | ❌ |
| **Bucket-C** (PAI/personal, process/meta, tooling) + `~/.claude/skills` | yes | ✅ always-on |

So a reference to a non-enumerated skill (`wrangler`, `laravel-tdd`, `weather`) would otherwise
fail with an unhelpful "skill not found."

## The contract — how anything resolves a skill

**Source of truth:** [`skill-index.json`](../skill-index.json), reachable at
`~/.agents/skill-clusters/skill-index.json` via the deployer's pointer. Every skill →
`{cluster, tier, role, status, enumerated, path, activate?, restore?}`.

**Resolution order** (for a harness/hook/agent/PAI that finds a skill name it can't invoke):
1. `active-hub` → already enumerated; invoke directly.
2. `active-spoke` → **invoke its `<cluster>-orchestrator`** (it routes to the spoke), or `Read` its `path` on demand. Do **not** invoke the spoke as a standalone skill.
3. `deferred-*` → run its `activate` (`node scripts/tier.mjs --activate <cluster> --apply`), then invoke the orchestrator.
4. `archived` → `Read` its `path` directly, or run its `restore` (`node scripts/archive-library.mjs --restore --apply`).
5. Not in the index → it's a PAI/`~/.claude/skills`/plugin skill; resolve normally.

## What enforces it

- **`SkillClusterResolver.hook.ts`** (`~/.claude/hooks/`, PreToolUse · matcher `Skill`): when the
  model invokes a non-enumerated cluster skill by name, it returns the resolution guidance above
  instead of a dead error. **Fail-open** — any error/missing-index → silent pass (never blocks a
  legit call, never adds an error). Registered alongside `SkillGuard` in `settings.json`.
- **`scripts/audit-refs.mjs`** (`npm run audit-refs`): scans active `~/.claude` config for
  hardcoded `.agents/skills/<name>` paths pointing at moved skills. Exit 1 if any found. Run it
  after any future archive/tier change. (Currently: **0 stale refs.**)
- **`scripts/gen-index.mjs`** (`npm run index`): regenerates `skill-index.json`. **Auto-run** at
  the end of `tier.mjs --apply` and `archive-library.mjs --apply`, so the map can't drift from
  reality.

## Maintenance invariant

The index is derived from `skills.sh.json` + `profiles.json` + the archive manifest — never
hand-edited. Any change to clusters, tiers, or the archive regenerates it automatically; CI/local
can assert freshness with `npm run index && git diff --exit-code skill-index.json`.

## What is NOT affected (verified)

PAI's `SKILLSYSTEM` + `RebuildSkill` operate on `~/.claude/skills/PAI` (untouched). `SkillGuard`
is string-matching. `gsd-*` agents do tolerant "if the dir exists" checks. The harness re-scans
each session (no cached index to rot). Archiving 228 skills changed **what is enumerated**, not
**what resolves** — and this layer makes the resolution explicit.
