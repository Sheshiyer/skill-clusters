<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,30&height=220&text=git-pr-ops&fontSize=52&fontAlignY=38&desc=One%20router%20for%20the%20GitHub%20PR%20pipeline%20%E2%80%94%20review%20%E2%86%92%20prepare%20%E2%86%92%20merge&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-8-f59e0b?style=flat)](../../skills.sh.json)
[![GitHub CLI](https://img.shields.io/badge/gh-CLI%20%2B%20REST-181717?style=flat&logo=github&logoColor=white)](https://cli.github.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**The GitHub delivery cluster — a gated review → prepare → merge pipeline behind a single router.**
Reviewing, preparing, merging, or shipping work through PRs and issues? The orchestrator places your
task on the pipeline and routes; `git-pr-ops-core` holds the artifact handoff and safety rules they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=0,2,30&height=2" width="100%" />

## What it is

8 skills: `git-pr-ops-orchestrator` (router) + `git-pr-ops-core` (shared model) + 6 specialists.
The cluster's job is to make GitHub PR/issue work *deterministic and safe* — the orchestrator knows
which spoke to reach for, and the core keeps the interlocking pipeline concepts (the `.local/`
artifact handoff, head-SHA pinning, force-with-lease push, head-pinned squash merge) consistent so no
spoke contradicts another.

```mermaid
graph TD
    O["git-pr-ops-orchestrator<br/>(hub · pipeline router)"]
    O --> REV["review-pr<br/>(read-only · review.json)"]
    O --> PREP["prepare-pr<br/>(resolve findings · push)"]
    O --> MRG["merge-pr<br/>(squash · head-SHA pinned)"]
    O --> GH["github<br/>(gh CLI · gh api)"]
    O --> ISS["gh-issues<br/>(issues → PRs · parallel)"]
    O --> NW["github-next-wave-orchestrator<br/>(status · next wave)"]

    REV -- "review.json" --> PREP
    PREP -- "prep.env" --> MRG

    REV -. references .-> C["git-pr-ops-core<br/>(.local handoff · head-SHA pin<br/>· force-with-lease · severity contract)"]
    PREP -. references .-> C
    MRG -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by lane

| Lane | Spokes |
|---|---|
| **Router / model** | `git-pr-ops-orchestrator`, `git-pr-ops-core` |
| **PR pipeline** | `review-pr`, `prepare-pr`, `merge-pr` |
| **Direct query** | `github` |
| **Issues → PRs (autonomous)** | `gh-issues` |
| **Status & planning** | `github-next-wave-orchestrator` |

## The model that ties it together

Work moves through **three gated stages**, each producing an artifact the next consumes:

```
review-pr ──review.json──> prepare-pr ──prep.env──> merge-pr ──> MERGED
 (read-only)               (resolve + push)         (squash + pin)
```

Review is read-only; prepare resolves every BLOCKER/IMPORTANT finding and pushes **only** to the PR
head with `--force-with-lease`; merge is **head-SHA pinned**, required-check gated, and ends in
`MERGED` — never `--auto`, never a push to `main`. Full model in
[`git-pr-ops-core`](../../skills/git-pr-ops-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@git-pr-ops-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@merge-pr -g -y                     # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
