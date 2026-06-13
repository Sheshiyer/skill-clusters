# SAFVR Design System — Full Token & Brand Reference

Ground truth sources:
- `Docs/design-dna.json` (v4.0.0)
- `AGENTS.md`
- `tailwind.config.ts`
- `src/app/globals.css`

## 1) SAFVR brand philosophy (must preserve)

**Light blueprint intelligence for industrial safety**:
- precise
- calm
- protective
- operational

Visual character:
- white canvas
- navy editorial typography
- SAFVR blue technical linework
- sharp floating navigation
- rectangular CTAs
- translucent dotted callouts

---

## 2) Canonical token map

### Tailwind blueprint tokens

| Token | Hex | Usage |
| ---- | ---- | ---- |
| `blueprint-ink` | `#081735` | headings, strong text, key lines |
| `blueprint-body` | `#24365f` | body copy |
| `blueprint-muted` | `#5d73a0` | secondary copy, helper text |
| `blueprint-line` | `#9ec0ff` | borders, separators, connector lines |
| `blueprint-faint` | `#dbe8ff` | faint surfaces, subtle dividers |
| `blueprint-blue` | `#0b63ff` | primary accent + CTA |
| `blueprint-soft` | `#f7faff` | soft section backgrounds |

### CSS variables in globals

```css
:root {
  --surface: #ffffff;
  --surface-soft: #f6f9ff;
  --ink: #081735;
  --body: #24365f;
  --muted: #5d73a0;
  --blue: #0b63ff;
  --line: #9ec0ff;
  --faint: #dbe8ff;
}
```

### Allocation rule (from design DNA)

- **70%**: white / pale blueprint negative space
- **20%**: navy copy + structure lines
- **10%**: SAFVR blue signal/accent

---

## 3) Accent and semantic policy

### Primary accent
- dominant accent: `#0b63ff`
- hover: `#0759e7`
- active: `#064dcc`

### Allowed semantic support
- success: `#16835f`
- warning: `#b87600`
- danger: `#c43d32`
- info: `#0b63ff`

### Prohibited defaults
- no legacy violet accents for new work
- no neon/purple cyber gradients
- no dark-first hero unless explicitly approved

---

## 4) Typography system

- Display/headline: `font-display` (Archivo)
- Body/UI: `font-body` (Figtree)

### Type hierarchy intent
- Headlines: commanding, tight, balanced
- Body: readable, generous leading, ~65ch max
- Labels: uppercase Archivo with thin rule + SAFVR blue

Do not introduce decorative monospace or novelty fonts.

---

## 5) Layout and composition constraints

- Default sections are light, spacious, left-aligned
- Prefer asymmetry + thin rules + negative space
- Avoid repetitive dashboard-card walls unless truly data-dense
- Mobile preserves core visuals/callouts (never hide key safety overlays)

### Hero archetype
- editorial split: copy left, isometric blueprint visual right
- trust rail below
- critical callouts remain visible on mobile

---

## 6) Component-level non-negotiables

### Navigation
- centered floating slab
- sharp edges
- no full-width top bar
- no pill nav
- use real SAFVR logo asset

### CTAs
- rectangular primary actions
- inline Lucide arrow
- no nested CTA shell
- no oversized icon bubbles

### Icons
- Lucide line icons only
- stroke around 1.8
- functional, not decorative

### Cards / callouts
- blueprint glass callouts allowed only when revealing real layer beneath
- thin dotted or faint blueprint borders
- no over-rounded default cards

---

## 7) Motion and behavior rules

- animate transform/opacity only
- keep motion restrained and purposeful
- respect reduced-motion preferences

Forbidden motion patterns:
- floating/bobbing card loops
- racing border dots
- particle systems
- generic node networks
- pulse-heavy glow behavior

---

## 8) Content and asset integrity

- key copy remains HTML text (not rasterized)
- generated art should be logo/text-free when possible; overlay real assets in layout
- no stock-safety-photo visual language for primary proof moments

---

## 9) AURA semantics quick rules

For any AURA visuals:
- keep canonical loop order: DETECT → ACT → IMPROVE → PREVENT
- ensure labels describe real operational states (not decorative jargon)
- avoid fake telemetry/noise overlays
- preserve readability at mobile target widths

Read `references/aura-visual-language.md` for full AURA constraints.

## 10) Quick brand fit test

If unsure, verify:
1. Does this look unmistakably SAFVR?
2. Is SAFVR blue the only dominant accent?
3. Are type roles cleanly split between Archivo/Figtree?
4. Are CTA/nav shapes sharp and operational?
5. Does mobile still preserve core proof/callouts?
