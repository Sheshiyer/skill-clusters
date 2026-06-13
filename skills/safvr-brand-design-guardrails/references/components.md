# SAFVR Brand Components — Canonical Patterns

Use these patterns as first choice. Extend them before inventing new variants.

## 1) Section shell (default)

```html
<section class="bg-white py-20 md:py-28">
  <div class="mx-auto w-full max-w-[94rem] px-5 md:px-8 lg:px-10">
    <!-- section content -->
  </div>
</section>
```

## 2) Headline stack

```html
<p class="font-display text-[0.68rem] uppercase tracking-[0.18em] text-blueprint-blue">01 · Detect</p>
<h2 class="balanced-text font-display text-3xl md:text-5xl text-blueprint-ink">Adaptive Safety Engine</h2>
<p class="mt-4 max-w-[65ch] font-body text-base md:text-lg leading-relaxed text-blueprint-body">
  Operational copy that remains readable and evidence-focused.
</p>
```

## 3) SAFVR floating nav shell

```html
<nav class="fixed inset-x-0 top-4 z-50 mx-auto w-[min(calc(100%-2rem),82rem)] border border-blueprint-faint bg-white/90 shadow-blueprint backdrop-blur-xl">
  <!-- sharp slab only -->
</nav>
```

Rules:
- no full-width edge-to-edge nav
- no rounded pill nav

## 4) Primary CTA (rectangular, operational)

```html
<a class="inline-flex h-12 md:h-[52px] items-center gap-2 border border-blueprint-blue bg-blueprint-blue px-5 font-display text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-[#0759e7] active:translate-y-px">
  Book a call <span aria-hidden>→</span>
</a>
```

Rules:
- no `rounded-full`
- no nested shell wrappers
- no circular icon bubble for default CTA

## 5) Secondary CTA (command style)

```html
<a class="inline-flex items-center gap-2 border-b border-blueprint-ink/40 pb-1 font-display text-sm text-blueprint-ink transition hover:text-blueprint-blue">
  Explore platform
</a>
```

## 6) Blueprint card / proof block

```html
<article class="border border-blueprint-line/60 bg-white p-6 shadow-blueprint">
  <h3 class="font-display text-xl text-blueprint-ink">Workflow Orchestration</h3>
  <p class="mt-2 font-body text-sm leading-relaxed text-blueprint-body">Owner, SLA, and audit evidence shown with clear hierarchy.</p>
</article>
```

## 7) Hero safety callout (glass pattern)

```html
<aside class="border border-dotted border-blueprint-line/70 bg-white/30 p-5 backdrop-blur-lg shadow-[0_18px_46px_rgba(28,88,180,0.055)]">
  <p class="font-display text-[0.68rem] uppercase tracking-[0.18em] text-blueprint-blue">Safety Lock</p>
  <p class="mt-2 font-body text-sm text-blueprint-body">Owner assigned · Risk pattern cooling</p>
</aside>
```

Use only where it overlays a real illustration/product layer.

## 8) AURA phase strip (conceptual pattern)

Phases must remain explicit and human-readable:
- DETECT
- ACT
- IMPROVE
- PREVENT

Allowed labels: operational language (e.g., “Owner assigned”, “Escalation triggered”, “Risk trend cooling”).

Do not use fake telemetry IDs/noise strings.

### Minimal AURA phase rail

```html
<ol class="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
  <li class="border border-blueprint-line bg-white p-4">
    <p class="font-display text-[0.68rem] tracking-[0.18em] uppercase text-blueprint-blue">Detect</p>
    <p class="mt-2 font-body text-sm text-blueprint-body">Hazard detected</p>
  </li>
  <li class="border border-blueprint-line bg-white p-4">
    <p class="font-display text-[0.68rem] tracking-[0.18em] uppercase text-blueprint-blue">Act</p>
    <p class="mt-2 font-body text-sm text-blueprint-body">Owner assigned</p>
  </li>
  <li class="border border-blueprint-line bg-white p-4">
    <p class="font-display text-[0.68rem] tracking-[0.18em] uppercase text-blueprint-blue">Improve</p>
    <p class="mt-2 font-body text-sm text-blueprint-body">Procedure updated</p>
  </li>
  <li class="border border-blueprint-line bg-white p-4">
    <p class="font-display text-[0.68rem] tracking-[0.18em] uppercase text-blueprint-blue">Prevent</p>
    <p class="mt-2 font-body text-sm text-blueprint-body">Risk trend cooling</p>
  </li>
</ol>
```

For advanced ribbon/flow variants, also read `references/aura-visual-language.md`.

## 9) Pattern utility usage

Approved utilities from `globals.css`:
- `.blueprint-grid`
- `.pattern-dots-*`
- `.pattern-lines-grid`
- `.pattern-diagonal`
- `.pattern-crosshatch`

Rule: use as subtle texture only; never overpower text/readability.

## 10) Mobile behavior baseline

- below `md`: asymmetric layouts collapse to one column
- callouts remain visible and legible
- touch targets minimum 44x44 (48x48 for primary actions)
- avoid negative margin overlaps on mobile

## Banned variants

- pill CTA/button defaults
- heavy rounded-card systems as section baseline
- stock-photo safety hero blocks
- neon/cyber gradients and glow-heavy motifs
- decorative node/particle visuals as product proof
