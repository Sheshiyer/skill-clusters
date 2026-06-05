<div align="center">
<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=0,2,8&height=180&text=documents&fontSize=42&fontAlignY=38&desc=route%20document%20tasks%20to%20specialists&descAlignY=58&fontColor=ffffff" width="100%" />
</div>

<div align="center">

[![tier](https://img.shields.io/badge/tier-deferred-64748b?style=plastic)](../../profiles.json)
[![spokes](https://img.shields.io/badge/spokes-10-22c55e?style=plastic)](#skills)
[![source](https://img.shields.io/badge/source-authored-22c55e?style=plastic)](../../NOTICE)
[![install](https://img.shields.io/badge/install-skills.sh-000?style=plastic)](https://skills.sh/)

</div>

> Routes a document task to the right specialist — office formats (DOCX/PDF/PPTX/XLSX), docs sites, changelogs, OCR extraction, natural-language PDF edits, NotebookLM, and diagram authoring. Every task first turns on one decision held in `documents-core`: keep the **editable source** (round-trippable, structure preserved) or produce a **rendered artifact** (pixel-fidelity output you can't edit back) — and that call locks which spoke can touch the file next.

## Hub-and-spoke

```mermaid
graph LR
  o([documents-orchestrator]):::hub --> c([documents-core]):::hub
  o --> s1([documents])
  o --> s2([mintlify])
  o --> s3([changelog-generator])
  o --> s4([deepread-ocr])
  o --> s5([nano-pdf])
  o --> s6([notebooklm])
  o --> s7([drawio-diagrams-enhanced])
  o --> s8([mermaid-to-gif])
  o --> s9([readme])
  o --> s10([screenshots])
  classDef hub fill:#8b5cf6,color:#fff;
```

## Skills

| Skill | Role | Loaded at startup |
|---|---|---|
| `documents-orchestrator` | 🧭 hub · router | ✅ enumerated |
| `documents-core` | 📐 hub · shared reference | ✅ enumerated |
| `documents` | spoke | ⤵ on-demand |
| `mintlify` | spoke | ⤵ on-demand |
| `changelog-generator` | spoke | ⤵ on-demand |
| `deepread-ocr` | spoke | ⤵ on-demand |
| `nano-pdf` | spoke | ⤵ on-demand |
| `notebooklm` | spoke | ⤵ on-demand |
| `drawio-diagrams-enhanced` | spoke | ⤵ on-demand |
| `mermaid-to-gif` | spoke | ⤵ on-demand |
| `readme` | spoke | ⤵ on-demand |
| `screenshots` | spoke | ⤵ on-demand |

## Tier & loading

Off by default — 0 startup cost. Activate with `node scripts/tier.mjs --activate documents --apply`.

## Install

```bash
npx skills add Sheshiyer/skill-clusters@documents-orchestrator -g -y
```

## Attribution

Authored for skill-clusters (MIT) — see [NOTICE](../../NOTICE). + mixed: the `readme` and `screenshots` spokes originate from antigravity-awesome-skills (MIT).

---
<sub>Part of <a href="../../README.md">skill-clusters</a> — the conductor closed-loop system · <a href="../../docs/CONDUCTOR-INTEGRATION.md">how it's wired</a></sub>
