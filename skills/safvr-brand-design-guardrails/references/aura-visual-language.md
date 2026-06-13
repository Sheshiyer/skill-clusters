# AURA Visual Language — SAFVR-Specific Guardrails

Use this reference when building or reviewing any AURA-related section, diagram, ribbon, timeline, or proof UI.

## Core model

AURA is always represented as a closed-loop operational system:

1. **DETECT**
2. **ACT**
3. **IMPROVE**
4. **PREVENT**

Do not reorder or rename these phases unless explicitly requested.

---

## Visual semantics by phase

### DETECT
- visual cues: acquisition, sensor capture, alert signal
- allowed labels: "Hazard detected", "Signal verified", "Incident logged"
- avoid: abstract AI jargon with no operational meaning

### ACT
- visual cues: assignment, intervention, SLA, ownership
- allowed labels: "Owner assigned", "Action in progress", "SLA started"
- avoid: generic "automation running" without actor/accountability

### IMPROVE
- visual cues: training, adaptation, closed-loop learning
- allowed labels: "Micro-training sent", "Procedure updated", "Pattern learned"
- avoid: fake model-score spam and vanity telemetry

### PREVENT
- visual cues: trend cooling, risk contour, proactive control
- allowed labels: "Risk trend cooling", "Zone stabilized", "Preventive control active"
- avoid: endless progress bars with no outcome state

---

## Color behavior for AURA visuals

### Primary system color
- SAFVR blue (`#0b63ff`) remains dominant for structure and interfaces.

### Supplemental signal colors
- Deep teal = active intelligence boundaries / system confidence
- Burnt amber = urgent intervention / escalation states

Guardrails:
- keep teal+amber accents constrained (never overwhelm blueprint base)
- amber should represent urgency, not default decoration
- avoid introducing extra novelty colors into AURA diagrams

---

## AURA ribbon pattern guidance

When rendering a "safety ribbon" or routed flow:
- directionality must be explicit and readable
- each phase transition should be legible at a glance
- labels must be human-readable and operational
- signal states should represent real workflow moments (owner, action, evidence, outcome)

Do not use:
- fake IDs/noise text
- decorative loops without state meaning
- infinite decorative progress animations

---

## Motion guardrails (AURA-specific)

- draw/transition lines once with purpose
- subtle emphasis beats are allowed for active phase
- no constant pulsing/glowing/racing effects
- reduced-motion mode must preserve full comprehension statically

---

## Responsive and readability constraints

- AURA labels must remain readable at 390px target viewport
- if image text becomes unreadable, move labels to HTML overlay text
- phase markers should not collapse into ambiguous icon-only states on mobile

---

## AURA review checklist

- [ ] All 4 phases present in canonical order
- [ ] Labels are operational and human-readable
- [ ] Color semantics are controlled and purposeful
- [ ] No fake telemetry/decorative data noise
- [ ] Motion is informative, not ornamental
- [ ] Mobile view preserves phase comprehension
