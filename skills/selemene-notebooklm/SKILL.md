---
name: selemene-notebooklm
description: "Turn a Selemene witness-pipeline OrchestratorOutput into a ready-to-paste NotebookLM prompt (slides first). Knows about language, relationship_header, passes, guardrails, and bridge mandates. Guided Q&A flow. USE WHEN user wants to generate NotebookLM slides / audio / video from a Selemene reading."
origin: project
cluster: selemene
version: 1.0.0
---

# Selemene NotebookLM — First Artifact (Slides Prompt)

This skill takes the **output of a witness reading** and produces a clean NotebookLM prompt.

Current first artifact: **structured 8-12 slide prompt**.

It is written as a short sequence of questions so agents can go step-by-step.

---

## Prerequisites (one question)

**Question:**

Do you already have an `OrchestratorOutput` (or the full reading JSON) from `witness-pipeline`?

**INPUT BOX:**

```
YES  → paste the JSON or path below
NO   → first run selemene-report (narrative witness) to get the output
```

---

## Step 1: Provide the OrchestratorOutput (or key fields)

**INPUT BOX — OrchestratorOutput (minimal fields needed):**

```json
{
  "mode": "mother-son-lineage",
  "subject_names": ["Aarav", "Vikram"],
  "register": "l1_l3",
  "relationship_header": "Mother-Son Lineage Mapping — non-predictive pattern witness",
  "passes": [
    { "id": "opening", "title": "Opening", "output": "..." },
    { "id": "lineage", "title": "Lineage Field", "output": "..." }
  ],
  "assembled": "...",
  "patterns": []
}
```

If you only have the reading text, paste the `assembled` + `relationship_header` + `mode`.

---

## Step 2: Language (if not in the output)

**INPUT BOX:**

```
language: en | hi | es | ...
```

Default = `en` if omitted.

---

## Step 3: Optional Bridge Mandates (from mode frontmatter)

**INPUT BOX (optional):**

```
bridgeMandates:
- "Use unmarried-partners language only; never married or romantic-framing assumptions"
- "No investment or outcome guarantees"
```

If you don't have them, just say `none`.

---

## Step 4: Generate the Prompt

After the above, the agent must call the equivalent of:

```ts
import { generateSlidesPrompt } from '@noesis/witness-pipeline';

const prompt = generateSlidesPrompt(orchestratorOutput, {
  language: "...",
  bridgeMandates: ["..."]   // or omit
});
```

**Agent output format:**

```
### NOTEBOOKLM SLIDES PROMPT (copy-paste ready)

<the full prompt text here>
```

---

## What the Generated Prompt Always Contains

- `Language: <lang>`
- `Mode: <mode>`
- `Register: <l1_l3 | l4_l5>`
- `## Relationship / Framing (MANDATORY — copy verbatim)`
  - The exact `relationship_header`
  - "Facts only. No prediction. No diagnosis..."
  - Any `bridgeMandates`
- Structured 8-12 slide outline with pass citations
- Pass count + assembled length (for reference)

---

## Example Output (mother-son, hi)

```
# NotebookLM Slides Prompt

Language: hi
Mode: mother-son-lineage
Register: l1_l3

## Relationship / Framing (MANDATORY — copy verbatim)
Mother-Son Lineage Mapping — non-predictive pattern witness
Facts only. No prediction. No diagnosis. Use only observable patterns and engine data.

## Slide Outline (8-12 slides recommended)
1. Title: Mother-Son Lineage Mapping — non-predictive pattern witness
2. Subjects & Context
3. Opening (cite pass opening)
4. Lineage Field (cite pass lineage)
5. Synthesis (non-predictive)
6. Reflection questions

Source assembled length (chars): ...
Pass count: 2
```

---

## Next Steps After Slides

- Want audio narration script? Say: "generate audio script from the same output"
- Want video storyboard skeleton? Say: "generate video storyboard skeleton"

(This skill will grow to support those as thin follow-up artifacts.)

---

## Guardrails (non-negotiable)

- Never turn the prompt into predictive or diagnostic language
- Always preserve the exact `relationship_header`
- Always include the "Facts only..." sentence
- Respect `language` at the top

---

## Quick Solo Path (no relationship)

Just pass an `OrchestratorOutput` without `relationship_header`. The prompt will use:

```
Solo Reading — non-predictive pattern witness
```

---

This is intentionally small and focused on the **first valuable artifact** (slides prompt) using the surfaces we actually ship today.
