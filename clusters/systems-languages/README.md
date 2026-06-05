<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=15,16,30&height=180&text=systems-languages&fontSize=42&fontAlignY=38&desc=Go%20C%2B%2B%20Perl%20specialist%20router&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-7-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-ECC-0ea5e9?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a systems-language task to the right specialist among Go, C++, and Perl by locating it on the **language × concern** map, then walks the shared **write → prove → harden** lifecycle: pick the language, apply its idiomatic conventions, drive it test-first, and (for Perl) harden against untrusted input.

## Hub-and-spoke

```mermaid
graph LR
  o([systems-languages-orchestrator]):::hub --> c([systems-languages-core]):::hub
  o --> s1([golang-patterns])
  o --> s2([golang-testing])
  o --> s3([cpp-coding-standards])
  o --> s4([cpp-testing])
  o --> s5([perl-patterns])
  o --> s6([perl-testing])
  o --> s7([perl-security])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `systems-languages-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `systems-languages-core` | 📐 hub · shared reference | ✅ enumerated |
| `golang-patterns` | spoke | ⤵ on-demand |
| `golang-testing` | spoke | ⤵ on-demand |
| `cpp-coding-standards` | spoke | ⤵ on-demand |
| `cpp-testing` | spoke | ⤵ on-demand |
| `perl-patterns` | spoke | ⤵ on-demand |
| `perl-testing` | spoke | ⤵ on-demand |
| `perl-security` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate systems-languages --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@systems-languages-orchestrator -g -y
```

## Attribution

Spokes adapted from [affaan-m/ECC](../../NOTICE) (MIT). See [NOTICE](../../NOTICE) for full attribution.

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
