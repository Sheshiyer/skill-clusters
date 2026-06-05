<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Documents&fontSize=52&fontAlignY=38&desc=8%20specialists%2C%20one%20router%20%E2%80%94%20create%20%E2%86%92%20edit%20%E2%86%92%20extract%20%E2%86%92%20render&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-10-f59e0b?style=flat)](../../skills.sh.json)
[![Tier](https://img.shields.io/badge/tier-deferred-64748b?style=flat)](../../README.md)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Office formats, extraction, publishing, and diagrams behind a single router.**
Creating, editing, extracting from, or rendering a document? The orchestrator places your task on
the **format × intent** map and routes; `documents-core` holds the editable-vs-rendered decision
they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

10 skills: `documents-orchestrator` (router) + `documents-core` (shared model) + 8 specialists.
The cluster's job is to make a sprawl of document tools *navigable* — the orchestrator knows
which spoke to reach for, and the core keeps the one decision that governs every task
(**editable source vs rendered artifact**) consistent so no spoke contradicts another.

```mermaid
graph TD
    O["documents-orchestrator<br/>(hub · format × intent router)"]
    O --> OFF["Office formats<br/>(DOCX · PDF · PPTX · XLSX)"]
    O --> ING["Extract & ingest<br/>(OCR · NotebookLM)"]
    O --> PUB["Publish docs<br/>(Mintlify · changelog)"]
    O --> DIA["Diagrams<br/>(draw.io · Mermaid→GIF)"]

    OFF --> D["documents<br/>(docx · pdf · pptx · xlsx)"]
    OFF --> NP["nano-pdf"]
    ING --> OCR["deepread-ocr"]
    ING --> NB["notebooklm"]
    PUB --> MIN["mintlify"]
    PUB --> CL["changelog-generator"]
    DIA --> DRW["drawio-diagrams-enhanced"]
    DIA --> M2G["mermaid-to-gif"]

    OFF -. references .-> C["documents-core<br/>(editable vs rendered · format→tool matrix<br/>· ingest/publish paths · fidelity rules)"]
    ING -. references .-> C
    DIA -. references .-> C

    style O fill:#b45309,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `documents-orchestrator`, `documents-core` |
| **Office formats** | `documents` (bundles `docx` · `pdf` · `pptx` · `xlsx` + Playwright HTML→PDF report pipeline), `nano-pdf` |
| **Extract & ingest** | `deepread-ocr`, `notebooklm` |
| **Publish docs** | `mintlify`, `changelog-generator` |
| **Diagrams** | `drawio-diagrams-enhanced`, `mermaid-to-gif` |

## The decision that ties it together

Every document is in one of two modes, and the mode is a one-way door:

```
Editable source  ──(render)──>  Rendered artifact
  (OOXML · openpyxl ·              (Playwright PDF · OCR text ·
   .drawio XML · .md)               flattened PDF · GIF)
  round-trippable                   pixel/print fidelity — can't edit back
```

Stay editable as long as the user might edit again; render only at the last step, and never
overwrite the original with its render. Full model in
[`documents-core`](../../skills/documents-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@documents-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@deepread-ocr -g -y               # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
