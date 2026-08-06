---
name: selemene-core
description: "Shared reference for the Selemene cluster: the two report surfaces (deterministic Rust reports vs. narrative witness-pipeline readings), the current rich intake contract (language, relationship_context, subject roles), Folio B-surface header, retrieval filters, non-prescriptive witnessing tone, and L0-L5 modes. USE WHEN deciding which Selemene surface to invoke or when routing between deterministic reports and narrative witness readings."
origin: project
cluster: selemene
version: 2.0.0
---

# Selemene Core (Updated 2026-07)

Cross-cutting rules and current contract for every Selemene skill.

## Two Report Surfaces

### 1. Deterministic reports (Rust)
- Location: `crates/noesis-vedic-api`
- Reached via: `@selemene/bridge` CLI or direct `POST /api/v1/workflows/{workflow_id}/execute`
- Workflows: `birth-blueprint`, `daily-practice`, `decision-support`, `self-inquiry`, `creative-expression`, `full-spectrum`

### 2. Narrative witness readings (witness-pipeline)
- Location: `packages/witness-pipeline/src/orchestrator/integrated.ts`
- Class: `IntegratedReadingOrchestrator`
- Primary entry for rich multi-subject, relationship-aware, language-aware readings.

## Current Rich Contract (as of 2026-07)

### ReportGenerationRequest (intake)
```ts
interface ReportGenerationRequest {
  report_level: 'L0' | 'L1' | 'L2' | 'L3' | 'L4' | 'L5';
  report_mode: string;
  subjects: ReportSubjectInput[];           // at least 1, usually 2-5
  relationship_context?: {
    type: 'family' | 'friends' | 'business-partners' | 'unmarried-partners' | 'married-partners' | 'custom';
    mapping_goal: string;
    sensitivity_level: 'low' | 'medium' | 'high';
  };
  language?: string;                        // default 'en'. Injected into prompts + metadata
  output: {
    format: 'markdown' | 'docx' | 'pdf' | 'source-pack';
    include_rubric: boolean;
    include_pattern_extraction: boolean;
  };
}
```

### OrchestratorInput (what the pipeline actually runs)
```ts
interface OrchestratorInput {
  subjectNames: string[];
  engineResultsBySubject: SelemeneEngineOutput[][];
  consciousnessLevel: number;               // 0-5 → register l1_l3 or l4_l5
  subjectRoles?: Array<{ role: string; label?: string; name: string }>;
  relationshipContext?: { type: string; mapping_goal: string; sensitivity_level: 'low'|'medium'|'high' };
  language?: string;                        // default 'en'
}
```

### OrchestratorOutput (what you get back)
```ts
interface OrchestratorOutput {
  mode: string;
  subject_names: string[];
  register: 'l1_l3' | 'l4_l5';
  relationship_header?: string;             // e.g. "Mother-Son Lineage Mapping — non-predictive pattern witness"
  passes: Array<{ id: string; title: string; output: string; rubric }>;
  assembled: string;                        // full reading (header prepended when present)
  patterns: ExtractedPattern[];
  retrieved_patterns?: RetrievedPattern[];
}
```

## Canonical Taxonomy (non-presumptive)

**Relationship Types**
- `family`, `friends`, `business-partners`, `unmarried-partners`, `married-partners`, `custom`

**Subject Roles** (examples)
- `primary`, `mother`, `father`, `son`, `daughter`, `child`, `sibling`, ...
- `business-partner`, `partner`, `colleague`, ...
- `friend`, `mentor`, ...

Never default two subjects to romantic framing. Always use explicit roles + `relationship_context.type`.

## Folio B-Surface Header Contract

When `relationshipContext` is present, the pipeline (and `renderFolioRelationshipHeader`) produces:

```
# {Role-Pair} {TypeLabel} — non-predictive pattern witness

Subjects: Name1 (role), Name2 (role, label)
Mapping goal: ...
Sensitivity: ...
```

This header **must** appear at the top of long-form Folio output, before any engine data.

Voice (per SYSTEM.md): parchment canvas, ink-bronze body, ink-iron headings.

## Language

- First-class optional field.
- Default: `'en'`.
- Propagated to: system prompts (`{{language}}`), pattern metadata, retrieval filters, source-pack, and NotebookLM shapers.

## Retrieval Filters (current)

```ts
interface RetrievalFilters {
  mode?: string;
  report_level?: string;
  language?: string;
  relationship_type?: string;   // added
  // ...
}
```

## Non-Prescriptive Tone (mandatory)

- All output is a mirror, not advice.
- "Facts only. No prediction. No diagnosis."
- Relationship guardrails are enforced in the rubric for family / business / partner types.
- Never promise outcomes, investments, health, or life events.

## Mode Documents

Modes live in `packages/witness-pipeline/modes/` (examples):
- `birth-blueprint.md`
- `integrated-reading.md` / `integrated-reading-l4.md`
- `mother-son-lineage.md`
- `business-partners.md`
- `family-penta.md`
- `unmarried-partners.md`
- `married-partners.md`

Every mode declares `report_level`, `relationship_types`, `roles`, `svg_topology`, `pass_plan`, and `bridge_mandates`.

## Quick Reference for Agents

When you see a request involving Selemene/Noesis:
1. Read this file first (`selemene-core`).
2. Decide deterministic (Rust) vs narrative witness (witness-pipeline).
3. For narrative: collect the full `ReportGenerationRequest` shape above (subjects + relationship_context + language + level).
4. After running, expect `relationship_header` (when applicable) and `assembled` starting with it.
5. For NotebookLM follow-up → use `selemene-notebooklm`.

All generated prompts and summaries remain non-prescriptive mirrors.
