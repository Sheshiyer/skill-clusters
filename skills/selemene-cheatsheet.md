# Selemene Agent Cheat Sheet (Minimal)

Copy the 3 shapes. Follow the 8 steps. Stop at any box and answer it.

---

## 3 Shapes

**1. ReportGenerationRequest**
```json
{
  "report_level": "L2",
  "report_mode": "synastry",
  "subjects": [
    { "role": "___", "name": "___", "birth_date": "YYYY-MM-DD", "birth_time": "HH:MM",
      "birth_time_confidence": "exact", "birth_location_query": "___",
      "normalized_location": { "display_name": "___", "latitude": 0, "longitude": 0, "timezone": "___", "provider": "manual", "confidence": "manual" } }
  ],
  "relationship_context": { "type": "family|business-partners|unmarried-partners|...", "mapping_goal": "___", "sensitivity_level": "high" },
  "language": "en",
  "output": { "format": "markdown", "include_rubric": true, "include_pattern_extraction": true }
}
```

**2. OrchestratorInput**
```json
{
  "subjectNames": ["A", "B"],
  "subjectRoles": [{ "role": "mother", "name": "A" }, { "role": "son", "name": "B" }],
  "relationshipContext": { "type": "family", "mapping_goal": "...", "sensitivity_level": "high" },
  "language": "en",
  "consciousnessLevel": 2,
  "engineResultsBySubject": [ /* ... */ ]
}
```

**3. OrchestratorOutput**
```json
{
  "mode": "mother-son-lineage",
  "subject_names": ["A", "B"],
  "register": "l1_l3",
  "relationship_header": "Mother-Son Lineage Mapping — non-predictive pattern witness",
  "passes": [{ "id": "...", "title": "...", "output": "...", "rubric": {...} }],
  "assembled": "full reading (header prepended)",
  "patterns": []
}
```

---

## 8-Step Flow

1. **Surface**  
   `witness | deterministic`

2. **Subjects** (repeat)  
   Fill one subject block per person (role + name + birth + location).

3. **Relationship**  
   ```json
   { "type": "...", "mapping_goal": "...", "sensitivity_level": "high" }
   ```
   Solo → `null`

4. **Language + Level**  
   `language: "en"`, `consciousness_level: 2`

5. **Mode + Level**  
   `report_level: "L2"`, `report_mode: "mother-son-lineage"`

6. **Assemble**  
   Emit:
   ```
   ### FINAL ASSEMBLED REQUEST
   ```json
   { full object }
   ```

7. **Run**  
   Get `OrchestratorOutput`.  
   Verify: `relationship_header` is at top of `assembled` when present. No predictions.

8. **Post-process**  
   - Source pack → `createSourcePack`  
   - NotebookLM → hand `OrchestratorOutput` to `selemene-notebooklm`

---

**Guardrails (always)**
- "Facts only. No prediction. No diagnosis."
- Use `relationship_header` verbatim.
- Respect relationship type in guardrails.

That's it. Answer one box at a time.
