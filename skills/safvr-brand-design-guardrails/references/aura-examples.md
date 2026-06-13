# AURA Examples — Good vs Bad

Use this as a fast adjudication guide during implementation/review.

## 1) Phase naming and order

### ✅ Good
- DETECT → ACT → IMPROVE → PREVENT
- Labels are explicit and operational.

### ❌ Bad
- "Discover → Resolve → Optimize → Future"
- Reordered phases or renamed phases without approval.

---

## 2) Label quality

### ✅ Good labels
- "Hazard detected"
- "Owner assigned"
- "Procedure updated"
- "Risk trend cooling"

### ❌ Bad labels
- "NODE-447 stream online"
- "Telemetry packet accepted"
- "AI confidence hyperstate"

Rule: labels must be meaningful to EHS and plant operations, not synthetic telemetry noise.

---

## 3) Color behavior

### ✅ Good
- SAFVR blue (`#0b63ff`) is the dominant structural accent.
- Teal/amber used sparingly for signal states (active/urgent).

### ❌ Bad
- Teal/amber dominating the full diagram.
- Additional novelty colors (purple/neon) introduced for flair.

---

## 4) CTA and shape language around AURA

### ✅ Good
- Rectangular CTA blocks with concise action language.
- Sharp card/callout geometry matching SAFVR system.

### ❌ Bad
- Pill buttons and rounded bubble cards around core AURA flow.
- Decorative sticker-like icon chips.

---

## 5) Motion behavior

### ✅ Good
- One-time line draw and state transition emphasis.
- Subtle active-state highlight with restrained timing.
- Reduced-motion fallback preserves full narrative statically.

### ❌ Bad
- Infinite pulse/glow loops.
- Racing particles/streams.
- Constant oscillation that obscures meaning.

---

## 6) Mobile readability (390px target)

### ✅ Good
- All phase labels remain readable.
- Phase meaning preserved even in stacked layout.
- If image text is too small, labels are rendered in HTML.

### ❌ Bad
- Tiny unreadable text embedded in images.
- Icon-only phases with ambiguous meaning.
- Hidden callouts that remove decision context.

---

## 7) Evidence realism

### ✅ Good
- States reflect plausible workflow moments (owner, SLA, intervention, trend outcome).
- Product proof feels operational and auditable.

### ❌ Bad
- Fake badges/certification stamps.
- Random metrics unrelated to AURA loop.
- Visuals that look like generic AI marketing art.

---

## Quick verdict rubric

If 2 or more "Bad" signals appear, treat as off-brand and refactor before ship.
