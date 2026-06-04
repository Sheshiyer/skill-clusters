<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,20&height=240&text=Skill%20Clusters&fontSize=58&fontAlignY=36&desc=Hub-and-spoke%20agent%20skills%2C%20one%20cluster%20per%20stack&descAlignY=56&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](LICENSE)
[![Clusters](https://img.shields.io/badge/clusters-28%20live-8b5cf6?style=flat)](#cluster-index)
[![Skills](https://img.shields.io/badge/skills-317-22c55e?style=flat)](skills.sh.json)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)
[![Stars](https://img.shields.io/github/stars/Sheshiyer/skill-clusters?style=flat&logo=github)](https://github.com/Sheshiyer/skill-clusters/stargazers)

**A monorepo of agent-skill _clusters_ — one hub-and-spoke package per tech stack.**
Each cluster is an `orchestrator` (intent router) + a shared `core` + the existing spokes
for that stack, so an agent can take a fuzzy request ("add a scroll effect", "ship this
Tauri app", "make a promo video") and route it to the right skill automatically.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=2,12,20&height=2" width="100%" />

## Why clusters

Individual skills are powerful but flat — an agent has to already know *which* of 360+ skills
to reach for. A **cluster** adds the missing layer: a router (`*-orchestrator`) that classifies
intent, and a shared reference (`*-core`) that holds the cross-cutting rules so spokes never
duplicate or contradict each other. Pattern proven by
[`explee-skills`](https://github.com/Sheshiyer/explee-skills).

## Cluster index

| Cluster | Domain | Spokes | Strategy | Status |
|---|---|---|---|---|
| [**creative-frontend**](clusters/creative-frontend) | Astro · GSAP · Remotion — web motion + programmatic video | 7 + 2 | organize | ✅ **live (pilot)** |
| [**tauri**](clusters/tauri) | Cross-platform desktop/mobile (Rust + web) | 40 + 2 | organize (flagship) | ✅ **live** |
| [**expo**](clusters/expo) | Expo toolchain (EAS, dev client, Expo Router, modules) | 9 + 2 | organize | ✅ **live** |
| [**react-native**](clusters/react-native) | RN UI, animation, touch, data (toolchain-agnostic) | 4 + 2 | organize | ✅ **live** |
| [**astro**](clusters/astro) | Static-first sites: islands, content, SSR, publishing | 2 + 2 | organize | ✅ **live** |
| [**raycast**](clusters/raycast) | Extensions, AI tools, Store publishing | 2 + 4 | organize + author | ✅ **live** |
| [**native-ios**](clusters/native-ios) | Swift / SwiftUI / concurrency / on-device AI | ECC | extract | ✅ **live** |
| [**rust**](clusters/rust) | Idiomatic patterns + testing | ECC | extract | ✅ **live** |
| [**electron**](clusters/electron) | Main/renderer, IPC, security, packaging, updates | 0 + 6 | author | ✅ **live** |

*"+N" = new orchestrator + core. Full per-cluster breakdown in [`docs/ROADMAP.md`](docs/ROADMAP.md).*

### Extracted from ECC (21 clusters · MIT — see [NOTICE](NOTICE))

Re-clustered from [affaan-m/ECC](https://github.com/affaan-m/ECC)'s 251 flat skills into hub-and-spoke
form (a `<cluster>-orchestrator` + `<cluster>-core` + spokes each), every skill validated through the
[Skills-Health gate](#single-source-of-truth):

[`ai-agents-meta`](clusters/ai-agents-meta) · [`quality-eval`](clusters/quality-eval) · [`frontend-web`](clusters/frontend-web) · [`python-backend`](clusters/python-backend) · [`jvm`](clusters/jvm) · [`php-laravel`](clusters/php-laravel) · [`systems-languages`](clusters/systems-languages) · [`mobile-flutter`](clusters/mobile-flutter) · [`backend-architecture`](clusters/backend-architecture) · [`databases-data`](clusters/databases-data) · [`devops-infra`](clusters/devops-infra) · [`security`](clusters/security) · [`healthcare`](clusters/healthcare) · [`blockchain-web3`](clusters/blockchain-web3) · [`research-knowledge`](clusters/research-knowledge) · [`business-content`](clusters/business-content) · [`social-media`](clusters/social-media) · [`agentic-ops`](clusters/agentic-ops) · [`supply-chain`](clusters/supply-chain) — plus `rust` + `native-ios` above. See [`docs/ECC-EXTRACTION-PLAN.md`](docs/ECC-EXTRACTION-PLAN.md).

## Repository layout

```
skill-clusters/
├── skills.sh.json            # manifest — each "grouping" IS a cluster (skills.sh)
├── skills/                   # FLAT (the resolvable convention, per vercel-labs/agent-skills)
│   ├── creative-frontend-orchestrator/SKILL.md
│   ├── creative-frontend-core/SKILL.md
│   └── …all spokes, flat…
├── clusters/<name>/README.md # per-cluster docs: banner, mermaid, skills table, install
├── scripts/link-agents.sh    # opt-in: symlink ~/.agents/skills → these canonical copies
├── docs/ROADMAP.md           # the 9-cluster build plan
└── README.md                 # you are here
```

Skills live **flat** in `/skills/` (what `npx skills` resolves); cluster identity comes from
naming, the `clusters/<name>/README.md` docs, and the `groupings` in `skills.sh.json`.

## Single source of truth

These files are canonical **here**. Your local runtime (`~/.agents/skills`) points back at them
via symlink, so there's exactly one copy and no drift:

```bash
./scripts/link-agents.sh            # preview (safe)
./scripts/link-agents.sh --apply    # symlink (originals backed up to ~/.agents/skills.backup)
./scripts/link-agents.sh --unlink --apply   # restore
```

## Install (skills.sh)

```bash
npx skills add Sheshiyer/skill-clusters@creative-frontend-orchestrator -g -y
```

## Anatomy of a cluster

Every cluster follows the same shape (so they're predictable to build and use):

1. `<name>-orchestrator` — routes intent to the right spoke; lists the cluster map.
2. `<name>-core` — shared reference: decision rules, conventions, version matrix, guardrails.
3. **spokes** — the stack's existing skills (referenced canonically), plus any authored to fill gaps.
4. `clusters/<name>/README.md` — full-treatment docs (banner, badges, mermaid, table, install).
5. a `groupings` entry in `skills.sh.json`.

## License

[MIT](LICENSE) © 2026 Sheshnarayan Iyer
