<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,13,14&height=180&text=devops-infra&fontSize=42&fontAlignY=38&desc=provision%20diagnose%20segment%20ship%20infra&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-active-8b5cf6?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-22-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry skill for infrastructure work. It locates a task on the **layer × operation** map — containers & compose, self-hosting clusters, post-deploy canary checks, reproducible dev environments, enterprise network-device diagnostics, and homelab networking — and delegates to one specialist spoke, with the read-only-by-default / change-window-for-mutations safety boundary (defined in `devops-infra-core`) shared across all of them.

## Hub-and-spoke

```mermaid
graph LR
  o([devops-infra-orchestrator]):::hub --> c([devops-infra-core]):::hub
  o --> s1([docker-patterns])
  o --> s2([uncloud])
  o --> s3([canary-watch])
  o --> s4([flox-environments])
  o --> s5([cisco-ios-patterns])
  o --> s6([netmiko-ssh-automation])
  o --> s7([network-bgp-diagnostics])
  o --> s8([homelab-vlan-segmentation])
  o --> s9([homelab-pihole-dns])
  o --> s10([homelab-wireguard-vpn])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 12 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `devops-infra-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `devops-infra-core` | 📐 hub · shared reference | ✅ enumerated |
| `aws-serverless` | spoke | ⤵ on-demand |
| `azure-functions` | spoke | ⤵ on-demand |
| `canary-watch` | spoke | ⤵ on-demand |
| `cisco-ios-patterns` | spoke | ⤵ on-demand |
| `devcontainer-setup` | spoke | ⤵ on-demand |
| `docker-patterns` | spoke | ⤵ on-demand |
| `flox-environments` | spoke | ⤵ on-demand |
| `gcp-cloud-run` | spoke | ⤵ on-demand |
| `healthcheck` | spoke | ⤵ on-demand |
| `homelab-network-setup` | spoke | ⤵ on-demand |
| `homelab-pihole-dns` | spoke | ⤵ on-demand |
| `homelab-vlan-segmentation` | spoke | ⤵ on-demand |
| `homelab-wireguard-vpn` | spoke | ⤵ on-demand |
| `inngest` | spoke | ⤵ on-demand |
| `netmiko-ssh-automation` | spoke | ⤵ on-demand |
| `network-bgp-diagnostics` | spoke | ⤵ on-demand |
| `network-config-validation` | spoke | ⤵ on-demand |
| `network-interface-health` | spoke | ⤵ on-demand |
| `terraform-skill` | spoke | ⤵ on-demand |
| `uncloud` | spoke | ⤵ on-demand |
| `upstash-qstash` | spoke | ⤵ on-demand |
| `voice-ai-development` | spoke | ⤵ on-demand |

## Tier & loading

Enumerated at CLI startup (orchestrator + core); spokes load on demand from `~/.agents/skill-clusters/skills/<name>/SKILL.md`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@devops-infra-orchestrator -g -y
```

## Attribution

Primarily authored for skill-clusters (MIT) + mixed — includes spokes from antigravity-awesome-skills (MIT) and affaan-m/ECC (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
