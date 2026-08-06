---
name: selemene-report
description: "Generate Selemene narrative witness readings (and route deterministic reports). Uses the current rich contract: language, relationship_context, subject roles, L0-L5, Folio header, and witness-pipeline. Guided Q&A flow for agents (Claude / OpenCode / Codex). USE WHEN user wants a Selemene witness reading, report, or /selemene-report."
origin: project
cluster: selemene
version: 2.1.0
---

# Selemene Report — Guided Flow (Agent Friendly)

This skill walks you through producing a **narrative witness reading** using the current engine surfaces (as of July 2026).

It is deliberately written as a **sequence of questions → structured answers** so coding agents (Claude, OpenCode, Codex) can execute one step at a time without losing context.

**Primary surface today:** `packages/witness-pipeline` → `IntegratedReadingOrchestrator`

---

## Overall Flow (do these in order)

1. Choose report surface
2. Collect subjects (one by one)
3. Collect relationship context (if multi-subject)
4. Choose language + consciousness level
5. Choose mode + report_level
6. Assemble the `ReportGenerationRequest` (or OrchestratorInput)
7. Run / invoke
8. Post-process (Folio header, source-pack, NotebookLM if needed)

---

## Step 1: Choose Surface

**Question for agent:**

Is this a **narrative witness reading** (rich, multi-subject, relationship-aware, language-aware) or a **deterministic Rust report**?

**Your answer (copy this box and fill):**

```
SURFACE: witness | deterministic
```

- `witness` → continue with this skill (current engine)
- `deterministic` → route to `@selemene/bridge` or `selemene-core` deterministic path

---

## Step 2: Collect Subjects (Repeat for each)

**Question:**

Provide one subject at a time.

**INPUT BOX — Subject (repeat this block):**

```json
{
  "role": "___",                    // e.g. "mother", "son", "business-partner", "primary"
  "name": "___",
  "birth_date": "YYYY-MM-DD",
  "birth_time": "HH:MM",            // optional but recommended
  "birth_time_confidence": "exact" | "approximate" | "unknown",
  "birth_location_query": "___",
  "normalized_location": {
    "display_name": "___",
    "latitude": 0.0,
    "longitude": 0.0,
    "timezone": "___",
    "provider": "manual" | "nominatim" | ...,
    "confidence": "exact" | "selected" | ...
  },
  "relationship_label": "___"       // optional free-text qualifier
}
```

**Agent instruction:** Output one filled block per subject. Do not combine yet.

---

## Step 3: Relationship Context (only if 2+ subjects)

**Question:**

Is there an explicit relationship between the subjects?

**INPUT BOX — Relationship Context:**

```json
{
  "type": "family" | "friends" | "business-partners" | "unmarried-partners" | "married-partners" | "custom",
  "mapping_goal": "___",                    // e.g. "understand lineage transmission patterns without outcome prediction"
  "sensitivity_level": "low" | "medium" | "high"
}
```

**Agent instruction:** If solo, output exactly:

```json
{ "relationship_context": null }
```

---

## Step 4: Language + Consciousness Level

**INPUT BOX:**

```json
{
  "language": "en" | "hi" | "es" | "...",     // default "en"
  "consciousness_level": 0-5
}
```

**Note:** Language is injected into prompts, metadata, and NotebookLM shapers.

---

## Step 5: Report Level + Mode

**INPUT BOX:**

```json
{
  "report_level": "L0" | "L1" | "L2" | "L3" | "L4" | "L5",
  "report_mode": "integrated-reading" | "mother-son-lineage" | "business-partners" | "family-penta" | "unmarried-partners" | "married-partners" | "birth-blueprint" | "..."
}
```

**Current known good modes** (see `packages/witness-pipeline/modes/`):
- `birth-blueprint`
- `integrated-reading` / `integrated-reading-l4`
- `mother-son-lineage`
- `business-partners`
- `family-penta`
- `unmarried-partners`
- `married-partners`

---

## Step 6: Assemble the Ready Object

After collecting the above, the agent must output **exactly one** of the following two objects.

### Option A — Full ReportGenerationRequest (preferred for most callers)

```json
{
  "report_level": "L2",
  "report_mode": "synastry",
  "subjects": [ /* from Step 2 */ ],
  "relationship_context": { /* from Step 3 or null */ },
  "language": "en",
  "output": {
    "format": "markdown",
    "include_rubric": true,
    "include_pattern_extraction": true
  }
}
```

### Option B — Direct OrchestratorInput (for internal / test use)

```json
{
  "subjectNames": ["Aarav", "Vikram"],
  "subjectRoles": [
    { "role": "mother", "name": "Aarav" },
    { "role": "son", "name": "Vikram" }
  ],
  "relationshipContext": { /* ... */ },
  "language": "en",
  "consciousnessLevel": 2,
  "engineResultsBySubject": [ /* ... */ ]
}
```

**Agent must output the filled JSON inside a code block labeled:**

```
### FINAL ASSEMBLED REQUEST
```json
...
```
```

---

## Step 7: Run the Reading

**For witness-pipeline (current recommended path):**

Use the local orchestrator (or call the Rust `/api/v1/assets/generate` endpoint with the above shape).

After execution, you will receive an `OrchestratorOutput` containing at minimum:

- `relationship_header` (when relationship_context was supplied)
- `assembled` (full reading — header is prepended)
- `passes[]`
- `patterns[]`

**Verification checklist (agent must confirm):**
- [ ] `relationship_header` appears at the very top of `assembled` when relationship was provided
- [ ] No romantic/predictive language when type is family or business-partners
- [ ] `language` is visible in system prompt / metadata if it was supplied

---

## Step 8: Post-Processing Options (choose one or more)

**A. Folio B-surface header** (already in `assembled` for witness readings)

**B. Source pack**
- Use `createSourcePack(...)` from `packages/witness-pipeline/src/assets/factory.ts`

**C. NotebookLM slides prompt**
- Route to `selemene-notebooklm` skill with the `OrchestratorOutput`

---

## Non-Prescriptive Guardrails (never skip)

- Always include: "Facts only. No prediction. No diagnosis."
- Respect `relationship_context.type` in guardrails
- `relationship_header` must be used verbatim when present
- Never promise outcomes

---

## Quick Solo Path Example (agent can copy-paste)

```json
{
  "report_level": "L1",
  "report_mode": "birth-blueprint",
  "subjects": [{ "role": "primary", "name": "Test", "birth_date": "1990-01-01", "birth_time_confidence": "exact", "birth_location_query": "Bengaluru" }],
  "relationship_context": null,
  "language": "en",
  "output": { "format": "markdown", "include_rubric": true, "include_pattern_extraction": false }
}
```

---

This flow is designed so a coding agent can ask the user (or another agent) one section at a time, collect the boxes, then emit the final assembled object.

Use `selemene-core` for the taxonomy and tone rules before starting this flow.
