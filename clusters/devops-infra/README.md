<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=2,12,20&height=220&text=DevOps%20%26%20Infra&fontSize=50&fontAlignY=38&desc=13%20specialists%2C%20one%20router%20%E2%80%94%20diagnose%20%E2%86%92%20change%20%E2%86%92%20verify%20%E2%86%92%20rollback&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-15-f59e0b?style=flat)](../../skills.sh.json)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat&logo=docker&logoColor=white)](https://docs.docker.com/compose/)
[![WireGuard](https://img.shields.io/badge/WireGuard-VPN-88171A?style=flat&logo=wireguard&logoColor=white)](https://www.wireguard.com)
[![Cisco](https://img.shields.io/badge/Cisco-IOS%2FIOS--XE-1BA0D7?style=flat&logo=cisco&logoColor=white)](https://www.cisco.com)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**13 infrastructure specialists behind a single router.**
Provisioning containers, diagnosing a flapping link, segmenting a home network, or verifying a
deploy? The orchestrator places your task on the **layer × operation** map and routes;
`devops-infra-core` holds the read-only-by-default safety boundary they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=2,12,20&height=2" width="100%" />

## What it is

15 skills: `devops-infra-orchestrator` (router) + `devops-infra-core` (shared model) + 13
specialists spanning containers, self-hosting, dev environments, enterprise network devices, and
homelab networking. The cluster makes a broad skill set *navigable* — the orchestrator knows
which specialist to reach for, and the core keeps the one interlocking rule (diagnose read-only
→ change in a window → verify → rollback) consistent across every spoke, from a Cisco router to a
`docker compose up` to a WireGuard tunnel.

```mermaid
graph TD
    O["devops-infra-orchestrator<br/>(hub · layer × operation router)"]
    O --> CT["Containers & deploy<br/>(docker · uncloud · canary-watch)"]
    O --> ENV["Dev environments<br/>(flox)"]
    O --> NET["Enterprise network<br/>(cisco · netmiko · bgp · config · interface)"]
    O --> HL["Homelab network<br/>(setup · vlan · pihole · wireguard)"]
    CT -. references .-> C["devops-infra-core<br/>(read-only default · change-class taxonomy<br/>· change window · rollback · verify)"]
    ENV -. references .-> C
    NET -. references .-> C
    HL -. references .-> C

    style O fill:#1d4ed8,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by layer

| Layer | Spokes |
|---|---|
| **Router / model** | `devops-infra-orchestrator`, `devops-infra-core` |
| **Containers & deploy** | `docker-patterns`, `uncloud`, `canary-watch` |
| **Dev environments** | `flox-environments` |
| **Enterprise network devices** | `cisco-ios-patterns`, `netmiko-ssh-automation`, `network-bgp-diagnostics`, `network-config-validation`, `network-interface-health` |
| **Homelab networking** | `homelab-network-setup`, `homelab-vlan-segmentation`, `homelab-pihole-dns`, `homelab-wireguard-vpn` |

## The model that ties it together

Every spoke turns on **one decision** — is this action read-only, or does it change state?

```
DIAGNOSE (read-only) ──> PLAN change + rollback ──> CHANGE WINDOW ──> VERIFY ──> rollback if regressed
```

The default path on any device, cluster, or deploy is read-only evidence collection; a mutation
— a config line, a firewall/VLAN rule, a `uc` deploy, a port opened — is gated behind a window
with a rollback and out-of-band access secured first. Full model and the change-class taxonomy in
[`devops-infra-core`](../../skills/devops-infra-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@devops-infra-orchestrator -g -y   # entry point
npx skills add Sheshiyer/skill-clusters@homelab-vlan-segmentation -g -y   # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
