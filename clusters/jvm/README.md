<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=20,24,27&height=180&text=jvm&fontSize=42&fontAlignY=38&desc=Route%20a%20JVM%20task%20to%20the%20right%20skill&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-16-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for Kotlin/Java work on the JVM: it locates a task on the **language × framework × concern** map and delegates to one of 16 specialist spokes — Kotlin (patterns, coroutines, Exposed, Ktor, testing), Java standards, the Spring Boot and Quarkus stacks (patterns → TDD → security → verification), JPA/Hibernate, and Compose Multiplatform. The cross-cutting stack/persistence/lifecycle model lives in `jvm-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([jvm-orchestrator]):::hub --> c([jvm-core]):::hub
  o --> s1([kotlin-patterns])
  o --> s2([kotlin-coroutines-flows])
  o --> s3([kotlin-exposed-patterns])
  o --> s4([kotlin-ktor-patterns])
  o --> s5([kotlin-testing])
  o --> s6([java-coding-standards])
  o --> s7([springboot-patterns])
  o --> s8([springboot-tdd])
  o --> s9([quarkus-patterns])
  o --> s10([jpa-patterns])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 7 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `jvm-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `jvm-core` | 📐 hub · shared reference | ✅ enumerated |
| `kotlin-patterns` | spoke | ⤵ on-demand |
| `kotlin-coroutines-flows` | spoke | ⤵ on-demand |
| `kotlin-exposed-patterns` | spoke | ⤵ on-demand |
| `kotlin-ktor-patterns` | spoke | ⤵ on-demand |
| `kotlin-testing` | spoke | ⤵ on-demand |
| `java-coding-standards` | spoke | ⤵ on-demand |
| `springboot-patterns` | spoke | ⤵ on-demand |
| `springboot-tdd` | spoke | ⤵ on-demand |
| `springboot-verification` | spoke | ⤵ on-demand |
| `springboot-security` | spoke | ⤵ on-demand |
| `quarkus-patterns` | spoke | ⤵ on-demand |
| `quarkus-tdd` | spoke | ⤵ on-demand |
| `quarkus-verification` | spoke | ⤵ on-demand |
| `quarkus-security` | spoke | ⤵ on-demand |
| `jpa-patterns` | spoke | ⤵ on-demand |
| `compose-multiplatform-patterns` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate jvm --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@jvm-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
