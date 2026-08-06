# Website delivery — system wiring (not the plan)

This document is **meta**: how Temperance / skill-clusters *surface* the operator plan.
It is intentionally separate from `website-delivery-workflow.html` (the plan itself).

Agents should **not** paste this file into customer-facing docs or README generation.

## Separation of concerns

| Artifact | Audience | Contents |
|---|---|---|
| `docs/website-delivery-workflow.html` | Operator + agent during build | Stages 0–8, composition, CLIs, control, ship |
| `workflows/registry.json` | Machines (hooks) | Triggers, stage→skill map, pointers |
| `workflows/templates/website-delivery.PLAN.md` | Project root seed | Checkboxes for SessionEnd next-step |
| `hooks/WorkflowSuggest.hook.ts` | Runtime | Short context inject on matching prompts |
| **This file** | Maintainers | How pickup works; improvement rules |

## Pickup channels

1. **Proactive (UserPromptSubmit)** — `WorkflowSuggest.hook.ts` matches prompt/cwd → injects compact `workflow-suggest` lines (no essay).
2. **Reactive (Skill)** — `SkillClusterResolver.hook.ts` when a spoke name is invoked.
3. **Plan-driven (SessionEnd)** — `NextStepOrchestrator.hook.ts` if project has `PLAN.md` / `ISA.md`.
4. **Orchestrated** — swarm-architect / conductor for multi-wave execution.

Policy: **inform-and-suggest only**. Never auto-spend creative CLIs.

## Improvement rules (anti-seepage)

When editing these artifacts:

1. **HTML plan** must stay second-person / imperative operator language. No “what I understand,” no session notes, no hook implementation details.
2. **Hook inject** must stay ≤ ~12 short lines, machine-oriented keys (`workflow-id`, `workflow-first`, `workflow-doc`). No multi-paragraph policy lectures.
3. **GitHub archaeology / project examples** belong in a pattern appendix or not at all—not in the spine.
4. **System wiring** (Temperance, OmniRoute ports, hook filenames) lives here or in CONDUCTOR-INTEGRATION—not in the operator plan.

## GrokFilm (visual cortex · film layer)

| Piece | Path |
|---|---|
| Public index | https://grokfilm.app/#index |
| Local corpus | `taste/corpus/grokfilm/techniques.json` (300) |
| Skill | `skills/grokfilm/` (design active-spoke) |
| CLI | `npm run grokfilm -- prompt "noir lobby" --limit 3` |
| Refresh | `npm run grokfilm:refresh` |

Flow: brand tokens → `grokfilm` technique stack (1–3) → render CLI (Higgsfield / Grok Imagine / gpt-image-2 / scroll-world).

## Skill search (skill-clusters + skills.sh)

| Channel | Command | Purpose |
|---|---|---|
| **Local (installed map)** | `npm run search -- "gsap scroll"` or `node scripts/search-skills.mjs <q>` | Search `skill-index.json` — phantom-proof, tier-aware |
| **Validate workflow** | `npm run workflow:validate` | Ensure registry `skills[]` all exist in index |
| **Stage resolve** | `node scripts/search-skills.mjs --stage motion --workflow website-delivery` | Hubs + spokes + missing for one stage |
| **Public (skills.sh)** | `npx skills find "landing page scroll"` | Ecosystem discovery when local miss |
| **Install public** | `npx skills add owner/repo@skill -g -y` then import into skill-clusters | Only after quality check (find-skills skill) |

Registry rules:

- `skills[]` — **must** resolve in skill-index (CI via `workflow:validate`)
- `agents_skills[]` — live under `~/.agents/skills` (Higgsfield, Meshy, GSAP agents copies)
- `search_query` — fuels local search enrichment + public `npx skills find` pointers

## Suggested next improvements

| Priority | Change | Why |
|---|---|---|
| P0 | Keep plan/system split (done) | Stops meta seeping into operator surface |
| P0 | skill-index-backed registry + search-skills (done) | No phantom stage skills |
| P1 | Compact hook payload with hubs (done) | Dispatch-ready, low noise |
| P1 | Stage-aware suggest from PLAN.md checkboxes | Higher signal than full spine every time |
| P2 | SessionStart ambient once-per-cwd | Suggest when opening a landing repo silently |
| P2 | Codex/OpenCode enrich adapter parity | Same registry on all Temperance surfaces |
| P2 | Import top agents CLIs (higgsfield, Meshy) into media-gen cluster | Full index coverage for assets stage |
| P3 | `resolve-task.mjs` website keyword boost from registry | Conductor waves bind design/creative-frontend correctly |
| P3 | Pattern gallery page (optional) | Real repos as *examples*, not in the spine |

## Verify

```bash
# Hook stays quiet on greetings
echo '{"prompt":"hi","cwd":"/tmp"}' | bun ~/.claude/hooks/WorkflowSuggest.hook.ts | wc -c
# Hook fires on landing intent
echo '{"prompt":"build a brand landing page","cwd":"/tmp"}' | bun ~/.claude/hooks/WorkflowSuggest.hook.ts
```
