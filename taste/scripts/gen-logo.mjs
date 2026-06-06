#!/usr/bin/env node
// gen-logo.mjs — the generic brandmint logo / visual-identity capability.
//
//   node taste/scripts/gen-logo.mjs <brand-spec.json> <out-dir>
//
// Turns a CANONICAL brand-spec (the validated contract emitted by brandmint — schema at
// taste/schemas/brand-spec.schema.json) into a clean SVG logo system, DETERMINISTICALLY: no AI,
// no network, no spend. The generic counterpart to Fitcheck's bespoke hand-built checkmark logo
// (fitcheck-landing/assets/*) — same lockup proportions (mark left, wordmark right, weight 800,
// tight tracking, trailing accent dot), but for ANY name/palette, with a MONOGRAM mark (name[0])
// instead of a per-brand bespoke glyph.
//
// genLogo() is the PURE core (brand-spec in → {markSvg, logoSvg, logoDarkSvg} strings out): no I/O,
// no network, no mutation of its input — so it's unit-testable. The file write lives behind main().

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

// The exact system bold-sans stack the hand-built Fitcheck lockup uses — zero web fonts, renders
// everywhere (rsvg/Chromium/Safari) without a network fetch.
const FONT = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const NEAR_WHITE = '#F7F7FB';      // wordmark color on the dark lockup (matches assets/logo-dark.svg)
const FALLBACK_ACCENT = '#FF6B35'; // used only when a spec ships no palette[0]
const FALLBACK_DARK = '#1A1A2E';   // used only when a spec ships no palette[1]

// XML-escape any text that lands in SVG markup (brand names can carry & < > " ').
function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

// Pull the brand primitives out of a (possibly under-specified) spec, with safe fallbacks.
// palette[0] = accent, palette[1] = dark — the convention the conductor + this generator share.
function brandTokens(spec = {}) {
  const name = String((spec.identity && spec.identity.name) || spec.brand || 'Brand');
  const palette = (spec.visual_tokens && spec.visual_tokens.palette) || [];
  const accent = palette[0] || FALLBACK_ACCENT;
  const dark = palette[1] || FALLBACK_DARK;
  // first VISIBLE char (spread handles surrogate-pair emoji), uppercased for the monogram
  const initial = ([...name][0] || 'B').toUpperCase();
  return { name, accent, dark, initial };
}

// The rounded-square monogram inner markup (favicon-friendly): dark square + accent initial, centered.
function markInner(accent, dark, initial) {
  return (
    `<rect width="64" height="64" rx="14" fill="${dark}"/>` +
    `<text x="32" y="33" font-family="${FONT}" font-size="38" font-weight="800"` +
    ` text-anchor="middle" dominant-baseline="central" fill="${accent}">${esc(initial)}</text>`
  );
}

// The dark-lockup mark: an outlined (accent-stroke) rounded square + accent initial, so it reads on a
// dark hero/header without a solid block.
function markDarkInner(accent, initial) {
  return (
    `<rect x="2" y="2" width="60" height="60" rx="13" fill="none" stroke="${accent}" stroke-width="3"/>` +
    `<text x="32" y="33" font-family="${FONT}" font-size="36" font-weight="800"` +
    ` text-anchor="middle" dominant-baseline="central" fill="${accent}">${esc(initial)}</text>`
  );
}

// The wordmark: bold sans name in `fill`, with a trailing accent `.` dot (the Fitcheck signature).
function wordmark(name, x, fill, accent) {
  return (
    `<text x="${x}" y="43.5" font-family="${FONT}" font-size="38" font-weight="800"` +
    ` letter-spacing="-1.2" fill="${fill}">${esc(name)}<tspan fill="${accent}">.</tspan></text>`
  );
}

const svgOpen = (w, h, label) =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}"` +
  ` role="img" aria-label="${esc(label)}">`;

// ── genLogo (PURE) ─────────────────────────────────────────────────────────────────────────────
// brand-spec → { markSvg, logoSvg, logoDarkSvg }. No I/O, no network, no mutation of `spec`.
export function genLogo(spec) {
  const { name, accent, dark, initial } = brandTokens(spec);

  // mark: 64×64 favicon-friendly monogram
  const markSvg = `${svgOpen(64, 64, name)}${markInner(accent, dark, initial)}</svg>`;

  // lockup width scales with name length so long names don't clip (≈300 for "Fitcheck")
  const wordX = 80;
  const width = wordX + [...name].length * 22 + 18;

  // logo (light bg): dark monogram square + dark wordmark + accent dot
  const logoSvg =
    `${svgOpen(width, 64, name)}${markInner(accent, dark, initial)}` +
    `${wordmark(name, wordX, dark, accent)}</svg>`;

  // logo (dark bg): accent outlined monogram + near-white wordmark + accent dot
  const logoDarkSvg =
    `${svgOpen(width, 64, name)}${markDarkInner(accent, initial)}` +
    `${wordmark(name, wordX, NEAR_WHITE, accent)}</svg>`;

  return { markSvg, logoSvg, logoDarkSvg };
}

// ── CLI ────────────────────────────────────────────────────────────────────────────────────────
function main() {
  const [specPath, outDir] = process.argv.slice(2);
  if (!specPath || !outDir) {
    console.error('usage: gen-logo.mjs <brand-spec.json> <out-dir>');
    process.exit(2);
  }
  if (!fs.existsSync(specPath)) {
    console.error(`  brand-spec not found: ${specPath}`);
    process.exit(2);
  }
  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (e) {
    console.error(`  brand-spec is not valid JSON (${specPath}): ${e.message}`);
    process.exit(2);
  }

  const { markSvg, logoSvg, logoDarkSvg } = genLogo(spec);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'mark.svg'), markSvg);
  fs.writeFileSync(path.join(outDir, 'logo.svg'), logoSvg);
  fs.writeFileSync(path.join(outDir, 'logo-dark.svg'), logoDarkSvg);

  const name = (spec.identity && spec.identity.name) || spec.brand || 'Brand';
  console.log(`  ✓ ${name}: wrote mark.svg, logo.svg, logo-dark.svg → ${outDir}`);
}

// Run the CLI only when invoked directly — importing the module (e.g. from tests) is side-effect-free.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
