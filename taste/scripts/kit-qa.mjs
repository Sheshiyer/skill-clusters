#!/usr/bin/env node
// kit-qa.mjs (CLI) — score how on-brand a rendered PNG is against a brand palette.
//
//   node taste/scripts/kit-qa.mjs <image.png> [--spec <brand-spec.json>] [hex...]
//
// Reads a PNG off disk, decodes it to raw RGB (png-decode.mjs), derives the brand palette from EITHER
// a --spec brand-spec.json (its visual_tokens.palette) OR trailing hex args on the command line, scores
// the pixels (kit-qa lib's scorePalette), and prints a JSON report to stdout:
//
//   { "image": "...", "coverage": 0.97, "accentPresence": 0.42, "perColor": { "#FF6B35": 0.42, ... } }
//
// This is the raster QA gate for the taste pipeline: deterministic, zero-dependency (node: builtins
// only), no AI, no network, no spend — the same philosophy as gen-logo.mjs. Usage/parse errors exit 2.
//
// The pure scoring + decoding live in the lib files; this file is only I/O + arg-wiring, and it runs
// solely when invoked directly (the isMain guard), so importing it has no side effects.

import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

import { decodePng } from './lib/png-decode.mjs';
import { scorePalette, hexToRgb } from './lib/kit-qa.mjs';

// Parse argv into { image, specPath, hexes }. A token is treated as a hex color when it looks like
// one (#RRGGBB or RRGGBB); --spec consumes the next token as a path.
function parseArgs(argv) {
  let image = null;
  let specPath = null;
  const hexes = [];
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--spec') {
      specPath = argv[++i] ?? null;
      if (!specPath) throw new Error('--spec requires a path argument');
    } else if (/^#?[0-9a-fA-F]{6}$/.test(a)) {
      hexes.push(a);
    } else if (!image) {
      image = a;
    } else {
      throw new Error(`unexpected argument: ${a}`);
    }
  }
  if (!image) throw new Error('missing <image.png>');
  return { image, specPath, hexes };
}

// Derive the palette: --spec's visual_tokens.palette takes precedence; else the trailing hex args.
function derivePalette({ specPath, hexes }) {
  if (specPath) {
    if (!fs.existsSync(specPath)) throw new Error(`brand-spec not found: ${specPath}`);
    let spec;
    try {
      spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
    } catch (e) {
      throw new Error(`brand-spec is not valid JSON (${specPath}): ${e.message}`);
    }
    const palette = spec?.visual_tokens?.palette;
    if (!Array.isArray(palette) || palette.length === 0) {
      throw new Error(`brand-spec has no visual_tokens.palette: ${specPath}`);
    }
    // Keep only hex-shaped entries (palettes may carry named/token colors the raster scorer can't use).
    const hex = palette.filter((c) => /^#?[0-9a-fA-F]{6}$/.test(String(c)));
    if (hex.length === 0) throw new Error(`brand-spec palette has no hex colors: ${specPath}`);
    return hex;
  }
  if (hexes.length > 0) return hexes;
  throw new Error('no palette: pass --spec <brand-spec.json> or trailing hex colors');
}

function main() {
  let args;
  let palette;
  try {
    args = parseArgs(process.argv.slice(2));
    palette = derivePalette(args);
  } catch (e) {
    console.error(`usage: kit-qa.mjs <image.png> [--spec <brand-spec.json>] [hex...]`);
    console.error(`  ${e.message}`);
    process.exit(2);
  }

  let pixels, width, height, channels;
  try {
    const buf = fs.readFileSync(args.image);
    ({ pixels, width, height, channels } = decodePng(buf));
  } catch (e) {
    console.error(`  failed to read/decode PNG (${args.image}): ${e.message}`);
    process.exit(2);
  }

  // hexToRgb is imported so the CLI fails fast on a malformed palette color before scoring.
  for (const c of palette) hexToRgb(c);

  const { coverage, accentPresence, perColor, sampled } = scorePalette(pixels, palette);
  const report = {
    image: args.image,
    width,
    height,
    channels,
    sampled,
    coverage,
    accentPresence,
    perColor,
  };
  console.log(JSON.stringify(report, null, 2));
}

// Run the CLI only when invoked directly — importing this module is side-effect-free.
const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
