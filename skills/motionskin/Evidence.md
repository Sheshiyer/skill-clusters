# _MOTIONSKIN — Real evidence (learning corpus)

Ground-truth worked examples. The skill learns *generate-to-fit* from these — concrete cases, not abstract
rules. Append a new entry after every real brand run; this file is the accumulating evidence base.

## ⭐ Golden: `neural-interface` → `thoughtseed-hero.mp4` (the generate-to-fit bar)

**Template** `neural-interface` (role: hero). Its `hero-bg-video` slot contract, captured two ways:
- **Prose (interface `notes`):** fullscreen 16:9, **scroll-SCRUBBED** — the JS seeks `video.currentTime` to
  scroll progress, with progressive blur `0→55px` + scale `1.03→1.11`. *"Supply a seamless muted loop whose
  whole duration reads well when scrubbed frame-by-frame."*
- **Visual (`references/neural-interface/scroll-000.png`):** a network-mesh **face, centered** on dark; title
  upper-left, "One Network" lower-right, paragraph lower-left, logo + CTA + nav across the top. → **centered
  subject + text-safe dark zones.**

**Brand asset (golden output):**
`…/website/landingpage-ts-2026/dist/video/thoughtseed-hero.mp4` — **1920×1080 (16:9), ~15s**, a **centered
teal cell/orb on near-black** (Thoughtseed = teal accent `#50E3C2` + seed/cell motif). It satisfies the
contract *exactly*: centered subject (survives the crop + blur/scale), dark field where the copy overlays,
continuous morph (reads scrubbed forward/back). Wired into the site via `src/components/VideoBackground.jsx`.

**Lesson — the generate-to-fit brief:**
`slot.notes (prose contract)  +  reference frame (visual contract)  +  brand kit (subject / palette / motif)`
→ keep the composition, swap the subject. `thoughtseed-hero.mp4` is the quality bar.

## Contract types observed (capture pass)
- **Hero bg-video** — `neural-interface` scroll-0: centered subject, fullscreen, text-safe dark zones, scroll-scrub.
- **Product image** — `luxury-botanical` scroll-50: at the orbit's focal point a **1:1 alpha cutout** product
  sits left, title + description right → needs a seamless/transparent cutout, subject centered, negative space
  on the right reserved for the label.
- *(to extend per role: section-bg, header/footer, logo, CTA, nav — each carries its own contract.)*

## v1 reskin renders (codegen proof)
- `luxury-botanical` → Thoughtseed (single-file `tokenize.mjs` path): dark, legible (scrim), brand-voiced copy
  ("ENTER THE SYSTEM", "JOIN A COLLECTIVE…"), structure 1:1.
- `shamoni-landing` `@theme` → Thoughtseed (`reskin-theme.mjs`): teal "Thoughtseed" wordmark, dark, Inter — the clean path.
- assembler: one glass-pill Thoughtseed nav over N bodies (`/` orbit hero + `/manifesto`) — the Philosophy fix generalized.

## Anti-example (what *breaks*)
- `landingpage-ts-2026` Philosophy page: ported a foreign template whole + bypassed the shell
  (`IMMERSIVE_ROUTES`), bringing its own nav/font/palette → incoherent. The fix that defines the model:
  keep the mechanic, mount in the shared Shell, tokenize to brand — don't bypass.
