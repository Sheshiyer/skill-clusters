<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=JVM&fontSize=56&fontAlignY=38&desc=16%20specialists%2C%20one%20router%20%E2%80%94%20Kotlin%20%C2%B7%20Java%20%C2%B7%20Spring%20Boot%20%C2%B7%20Quarkus&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-18-f59e0b?style=flat)](../../skills.sh.json)
[![Kotlin](https://img.shields.io/badge/Kotlin-7F52FF?style=flat&logo=kotlin&logoColor=white)](https://kotlinlang.org)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.x-6DB33F?style=flat&logo=springboot&logoColor=white)](https://spring.io/projects/spring-boot)
[![Quarkus](https://img.shields.io/badge/Quarkus-3.x%20LTS-4695EB?style=flat&logo=quarkus&logoColor=white)](https://quarkus.io)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**16 Kotlin & Java specialists behind a single router.**
Building, testing, securing, or shipping a JVM service? The orchestrator places your task on
the **language × framework × concern** map and routes; `jvm-core` holds the stack-decision
model and the lifecycle they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

18 skills: `jvm-orchestrator` (router) + `jvm-core` (shared model) + 16 specialists across
Kotlin, Java, Spring Boot, Quarkus, JPA, and Compose Multiplatform. The cluster's job is to
make a broad, multi-framework skill set *navigable* — the orchestrator knows which spoke to
reach for given your language and framework, and the core keeps the decisions (Kotlin vs Java,
Spring Boot vs Quarkus vs Ktor, JPA vs Exposed) and the patterns → TDD → security →
verification lifecycle consistent.

```mermaid
graph TD
    O["jvm-orchestrator<br/>(hub · language × framework × concern router)"]
    O --> K["Kotlin<br/>language & ecosystem"]
    O --> J["Java<br/>conventions"]
    O --> SB["Spring Boot<br/>stack"]
    O --> QK["Quarkus<br/>stack"]
    O --> DU["Persistence<br/>& UI"]

    K --> k1["kotlin-patterns"]
    K --> k2["kotlin-coroutines-flows"]
    K --> k3["kotlin-exposed-patterns"]
    K --> k4["kotlin-ktor-patterns"]
    K --> k5["kotlin-testing"]
    J --> j1["java-coding-standards"]
    SB --> s1["springboot-patterns"]
    SB --> s2["springboot-tdd"]
    SB --> s3["springboot-security"]
    SB --> s4["springboot-verification"]
    QK --> q1["quarkus-patterns"]
    QK --> q2["quarkus-tdd"]
    QK --> q3["quarkus-security"]
    QK --> q4["quarkus-verification"]
    DU --> d1["jpa-patterns"]
    DU --> d2["compose-multiplatform-patterns"]

    K -. references .-> C["jvm-core<br/>(language × framework decision<br/>· tooling matrix · patterns→TDD→security→verification)"]
    J -. references .-> C
    SB -. references .-> C
    QK -. references .-> C
    DU -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `jvm-orchestrator`, `jvm-core` |
| **Kotlin language & ecosystem** | `kotlin-patterns`, `kotlin-coroutines-flows`, `kotlin-exposed-patterns`, `kotlin-ktor-patterns`, `kotlin-testing` |
| **Java language** | `java-coding-standards` |
| **Spring Boot stack** | `springboot-patterns`, `springboot-tdd`, `springboot-security`, `springboot-verification` |
| **Quarkus stack** | `quarkus-patterns`, `quarkus-tdd`, `quarkus-security`, `quarkus-verification` |
| **Persistence & UI** | `jpa-patterns`, `compose-multiplatform-patterns` |

## The model that ties it together

Every JVM service starts with two choices that cascade into which spokes apply:

```
Language (Kotlin · Java) ──┐
                           ├──> Framework (Spring Boot · Quarkus · Ktor) ──> patterns → TDD → security → verification
Persistence (JPA · Exposed)┘
```

One language + one framework + one persistence layer **per service** — crossing streams is the
main failure mode. Full decision matrix and lifecycle in
[`jvm-core`](../../skills/jvm-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@jvm-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@springboot-patterns -g -y  # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
