<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=1,2,7&height=180&text=php-laravel&fontSize=42&fontAlignY=38&desc=route%20a%20Laravel%20task%20to%20a%20specialist&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-5-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-ECC-0ea5e9?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for Laravel work. It places a build → test → verify → ship task on the lifecycle and delegates to one of five specialists — architecture (controller → service → action → Eloquent), TDD with Pest/PHPUnit, the pre-PR/pre-deploy verification gate, security hardening, and Composer package discovery — with the cross-cutting layering, validation, and response-envelope conventions living in `php-laravel-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([php-laravel-orchestrator]):::hub --> c([php-laravel-core]):::hub
  o --> s1([laravel-patterns])
  o --> s2([laravel-tdd])
  o --> s3([laravel-verification])
  o --> s4([laravel-security])
  o --> s5([laravel-plugin-discovery])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `php-laravel-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `php-laravel-core` | 📐 hub · shared reference | ✅ enumerated |
| `laravel-patterns` | spoke | ⤵ on-demand |
| `laravel-tdd` | spoke | ⤵ on-demand |
| `laravel-verification` | spoke | ⤵ on-demand |
| `laravel-security` | spoke | ⤵ on-demand |
| `laravel-plugin-discovery` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate php-laravel --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@php-laravel-orchestrator -g -y
```

## Attribution

Primary source: **ECC** (`affaan-m/ECC`, MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
