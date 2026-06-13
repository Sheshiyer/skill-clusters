# SAFVR Tailwind + Global Hooks (Implementation Guide)

## Source files and responsibilities

1. `tailwind.config.ts`
   - canonical blueprint color tokens
   - font aliases (`font-display`, `font-body`)
   - shared elevation (`shadow-blueprint`)

2. `src/app/globals.css`
   - root CSS variables
   - global page background behavior
   - texture utilities (`blueprint-grid`, `pattern-*`)
   - reduced-motion safety behavior

3. `src/lib/links.ts`
   - CTA/contact constants used across components

---

## Current canonical Tailwind extension

```ts
extend: {
  colors: {
    blueprint: {
      ink: "#081735",
      body: "#24365f",
      muted: "#5d73a0",
      line: "#9ec0ff",
      faint: "#dbe8ff",
      blue: "#0b63ff",
      soft: "#f7faff"
    }
  },
  fontFamily: {
    display: ["var(--font-display)", "system-ui", "sans-serif"],
    body: ["var(--font-body)", "system-ui", "sans-serif"]
  },
  boxShadow: {
    blueprint: "0 18px 60px rgba(28, 88, 180, 0.08)"
  }
}
```

Prefer adding to this namespace instead of creating parallel color families.

---

## Safe extension policy

### Additive changes (preferred)
- add new token keys under `colors.blueprint.*`
- add new shadow or spacing utilities only when reused 2+ times
- keep naming semantic (purpose-based), not decorative

### Risky changes (require explicit note)
- renaming existing token keys
- replacing `font-display`/`font-body` mappings
- changing global surface/background gradients
- altering reduced-motion global behavior

Document rationale for any risky change in task summary.

---

## Recommended implementation hooks

### Token-first in components
Use:
- `text-blueprint-ink`
- `text-blueprint-body`
- `border-blueprint-line`
- `bg-blueprint-soft`

Avoid raw inline hex unless intentionally defining a new token candidate.

### Pattern restraint
Pattern classes (`pattern-*`, `blueprint-grid`) should be applied as subtle overlays, not whole-page dominant backgrounds.

### Motion safety
Keep motion in component-local client modules; do not bypass reduced-motion fallback in globals.

---

## Link integrity rule

All booking/contact links should resolve through:
- `CALENDLY_URL`
- `CONTACT_EMAIL`

Never hardcode external CTA URLs in components.

---

## Minimal token addition example

```ts
// tailwind.config.ts
colors: {
  blueprint: {
    // existing...
    mist: "#eef4ff" // new subtle panel background
  }
}
```

Then apply as `bg-blueprint-mist` where needed.
