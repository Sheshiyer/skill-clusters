# Selemene Agent Quick Reference (2026-07)

**Goal:** Give Claude / OpenCode / Codex the exact shapes and flow to produce narrative witness readings + NotebookLM artifacts using current engine surfaces.

---

## 1. Three Key JSON Shapes

### A. ReportGenerationRequest (recommended for callers)
```json
{
  "report_level": "L2",
  "report_mode": "synastry",
  "subjects": [
    {
      "role": "mother",
      "name": "Aarav",
      "birth_date": "1970-01-01",
      "birth_time": "10:30",
      "birth_time_confidence": "exact",
      "birth_location_query": "Bengaluru, India",
      "normalized_location": {
        "display_name": "Bengaluru, Karnataka, India",
        "latitude": 12.9716,
        "longitude": 77.5946,
        "timezone": "Asia/Kolkata",
        "provider": "manual",
        "confidence": "manual"
      }
    }
  ],
  "relationship_context": {
    "type": "family",
    "mapping_goal": "understand lineage transmission patterns without outcome prediction",
    "sensitivity_level": "high"
  },
  "language": "en",
  "output": {
    "format": "markdown",
    "include_rubric": true,
    "include_pattern_extraction": true
  }
}
```

### B. OrchestratorInput (internal / direct)
```json
{
  "subjectNames": ["Aarav", "Vikram"],
  "subjectRoles": [
    { "role": "mother", "name": "Aarav" },
    { "role": "son", "name": "Vikram" }
  ],
  "relationshipContext": { "type": "family", "mapping_goal": "...", "sensitivity_level": "high" },
  "language": "en",
  "consciousnessLevel": 2,
  "engineResultsBySubject": [ /* array of engine results per subject */ ]
}
```

### C. OrchestratorOutput (what you receive)
```json
{
  "mode": "mother-son-lineage",
  "subject_names": ["Aarav", "Vikram"],
  "register": "l1_l3",
  "relationship_header": "Mother-Son Lineage Mapping — non-predictive pattern witness",
  "passes": [ { "id": "...", "title": "...", "output": "...", "rubric": {...} } ],
  "assembled": "full reading text (header is prepended)",
  "patterns": [],
  "retrieved_patterns": []
}
```

---

## 2. Relationship Taxonomy (use exactly)

**Types:** `family`, `friends`, `business-partners`, `unmarried-partners`, `married-partners`, `custom`

**Header form (must appear at top of assembled when present):**
```
# Mother-Son Lineage Mapping — non-predictive pattern witness

Subjects: Aarav (mother), Vikram (son)
Mapping goal: ...
Sensitivity: high
```

---

## 3. Language

- First-class field.
- Default: `"en"`
- Injected into prompts, metadata, retrieval, source-pack, and NotebookLM prompts.

---

## 4. Quick Flow (for agents)

Use `selemene-report` skill → collect boxes one by one:

1. Surface (witness vs deterministic)
2. Subjects (repeat block)
3. Relationship context (or null for solo)
4. language + consciousness_level
5. report_level + report_mode
6. Emit **### FINAL ASSEMBLED REQUEST**
7. Run → get OrchestratorOutput
8. (Optional) Hand to `selemene-notebooklm` for slides prompt

---

## 5. NotebookLM First Artifact (selemene-notebooklm)

Input: `OrchestratorOutput` + language + optional bridgeMandates

Output: Ready-to-paste slides prompt that always starts with:

```
Language: ...
Mode: ...
Register: ...

## Relationship / Framing (MANDATORY — copy verbatim)
<exact relationship_header>
Facts only. No prediction. No diagnosis...
```

---

## 6. Non-Prescriptive Rules (always enforce)

- "Facts only. No prediction. No diagnosis."
- Use `relationship_header` verbatim
- Respect relationship type in guardrails (family/business stricter)
- Never promise outcomes

---

## 7. Files to Read Before Using

- `selemene-core` (taxonomy + current contract)
- `selemene-report` (guided Q&A flow)
- `selemene-notebooklm` (slides prompt shaper)

---

**Copy the three shapes above into your context.**  
Then follow the question-by-question flow in `selemene-report`.
