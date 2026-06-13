# SAFVR Prompting, Research Loop, and QA Harness

## Activation lexicon (keyword-aware)

Activate this skill if prompt includes SAFVR + any of:
- design DNA, brand, blueprint, visual identity
- polish, cleanup, consistency, refinement, premium
- tokens, typography, spacing rhythm, CTA style
- audit, off-brand, guardrails, QA, regression

If request is SAFVR UI and ambiguous, activate by default.

---

## Three-pass refinement protocol (default)

### Pass 1 — Brand alignment pass
Goal: ensure proposal is faithful to SAFVR DNA.

Actions:
1. Load gates: `AGENTS.md`, `Docs/design-dna.json`, `tailwind.config.ts`, `src/app/globals.css`, affected files.
2. Produce **Brand Snapshot**:
   - token set
   - typography mapping
   - shape language
   - mobile constraints
3. Identify immediate off-brand drift.

### Pass 2 — Component consistency pass
Goal: normalize implementation into canonical patterns.

Actions:
1. Map each touched UI block to pattern family (nav/CTA/card/callout/section).
2. Reduce one-off classes, colors, and font overrides.
3. Enforce consistent responsive behavior.

### Pass 3 — Deterministic QA pass
Goal: prove no regressions and produce audit notes.

Actions:
1. Run consistency command harness.
2. Fix failures.
3. Return concise pass/fail report with exceptions.

---

## Consistency command harness

### 1) Raw hex drift scan
```bash
rg -n "#[0-9a-fA-F]{3,8}" src --glob "*.{ts,tsx,css}"
```

### 2) Font override drift
```bash
rg -n "font-family|font-\[" src --glob "*.{ts,tsx,css}"
```

### 3) Pill CTA detection
```bash
rg -n "rounded-full|rounded-\[9999px\]" src --glob "*.{ts,tsx}"
```

### 4) Hardcoded Calendly detection
```bash
rg -n "calendly\.com/safvr" src --glob "*.{ts,tsx}" -g '!src/lib/links.ts'
```

### 5) Constant usage coverage
```bash
rg -n "CALENDLY_URL|CONTACT_EMAIL" src --glob "*.{ts,tsx}"
```

### 6) Pattern utility overuse sanity check
```bash
rg -n "pattern-|blueprint-grid" src --glob "*.{ts,tsx,css}"
```

### 7) AURA phase presence/order checks (when applicable)
```bash
rg -n "DETECT|ACT|IMPROVE|PREVENT|Detect|Act|Improve|Prevent" src --glob "*.{ts,tsx,md}"
```

### 8) Fake telemetry/noise text check (heuristic)
```bash
rg -n "INC-[0-9]{3,}|SYS-[0-9]{3,}|NODE-[0-9]{3,}|telemetry|stream|particle" src --glob "*.{ts,tsx,md}" 
```

For any ambiguous AURA decision, compare output against `references/aura-examples.md` before finalizing.

---

## Review questions (must be answered)

1. Is the result unmistakably SAFVR?
2. Did we preserve blueprints tokens over ad-hoc colors?
3. Are Archivo/Figtree roles still clean?
4. Are nav + CTA shapes still sharp and operational?
5. Is mobile (390px target) still legible and stable?
6. Did maintainability improve (not degrade)?
7. If this includes AURA visuals, are phase semantics and labels operationally meaningful?

---

## Pre-ship definition of done

- [ ] No avoidable raw hex additions where tokens exist
- [ ] No hardcoded Calendly link outside `src/lib/links.ts`
- [ ] No new rounded-pill primary CTA pattern
- [ ] Typography hierarchy remains display/body aligned
- [ ] Core callouts/proof content remain visible on mobile
- [ ] Motion respects reduced-motion behavior
- [ ] Final QA summary includes findings + rationale for exceptions

---

## Suggested response format for tasks

1. **Brand Snapshot**
2. **Pass 1 Findings**
3. **Pass 2 Normalization Changes**
4. **Pass 3 QA Results**
5. **Exceptions / Follow-ups**
