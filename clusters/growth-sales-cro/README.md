<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=10,18,22&height=180&text=growth-sales-cro&fontSize=42&fontAlignY=38&desc=Lift%20conversions%2C%20grow%20revenue%2C%20close%20deals&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-24-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> The single entry point for moving a number — conversions, activation, revenue, retention, or closed deals. It places a task on the **funnel stage × lever** map and routes to one of 24 specialists, with the shared funnel and the **baseline → hypothesis → test → decide** measurement loop kept in `growth-sales-cro-core`.

## Hub-and-spoke

```mermaid
graph LR
  o([growth-sales-cro-orchestrator]):::hub --> c([growth-sales-cro-core]):::hub
  o --> s1([analytics-tracking])
  o --> s2([ab-test-setup])
  o --> s3([page-cro])
  o --> s4([form-cro])
  o --> s5([signup-flow-cro])
  o --> s6([onboarding-cro])
  o --> s7([paywall-upgrade-cro])
  o --> s8([pricing-strategy])
  o --> s9([paid-ads])
  o --> s10([churn-prevention])
  classDef hub fill:#8b5cf6,color:#fff;
```

_…and 14 more in the table below._

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `growth-sales-cro-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `growth-sales-cro-core` | 📐 hub · shared reference | ✅ enumerated |
| `analytics-tracking` | spoke | ⤵ on-demand |
| `ab-test-setup` | spoke | ⤵ on-demand |
| `page-cro` | spoke | ⤵ on-demand |
| `form-cro` | spoke | ⤵ on-demand |
| `popup-cro` | spoke | ⤵ on-demand |
| `signup-flow-cro` | spoke | ⤵ on-demand |
| `onboarding-cro` | spoke | ⤵ on-demand |
| `paywall-upgrade-cro` | spoke | ⤵ on-demand |
| `pricing-strategy` | spoke | ⤵ on-demand |
| `paid-ads` | spoke | ⤵ on-demand |
| `churn-prevention` | spoke | ⤵ on-demand |
| `referral-program` | spoke | ⤵ on-demand |
| `revops` | spoke | ⤵ on-demand |
| `sales` | spoke | ⤵ on-demand |
| `sales-enablement` | spoke | ⤵ on-demand |
| `pitchdeck-skill` | spoke | ⤵ on-demand |
| `lead-research-assistant` | spoke | ⤵ on-demand |
| `customer-research` | spoke | ⤵ on-demand |
| `company-research` | spoke | ⤵ on-demand |
| `competitor-alternatives` | spoke | ⤵ on-demand |
| `competitor-teardown` | spoke | ⤵ on-demand |
| `app-store-optimization` | spoke | ⤵ on-demand |
| `app-store-screenshots` | spoke | ⤵ on-demand |
| `aso-appstore-screenshots` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate growth-sales-cro --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@growth-sales-cro-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT). See [NOTICE](../../NOTICE).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
