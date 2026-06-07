#!/usr/bin/env node
// brandmint-reroll.mjs — the AUTO-REROLL CLI: mint on-brand renders, regenerating the off-brand ones.
//
//   node taste/scripts/brandmint-reroll.mjs <brand-spec.json> <outDir> \
//        [--threshold 0.12] [--max-attempts 2] [--metric coverage|accentPresence] [--skill-dir <path>]
//
// brandmint.mjs renders each planned image ONCE. brandmint-reroll closes the quality loop: it plans
// the same images (planImageArtifacts), then for each one GENERATES → SCORES → and if the render is
// off-brand REGENERATES up to --max-attempts, keeping the best-scoring attempt. It does NOT
// re-implement the loop — it composes lib/reroll.mjs's pure `rerollImages`, wiring the REAL I/O:
//   • generateImage  — makeGptImage (spawnSync bash gen.sh; image gen via the user's ChatGPT sub)
//   • scoreImage     — read the PNG (fs) → decodePng → scorePalette against the spec's palette
//   • scoreOf        — pick the --metric field (coverage = on-palette fraction; accentPresence = the
//                      primary colour's fraction)
//
// Zero dependencies: node: builtins only. File reads / PNG decode / process spawning live behind
// main(); importing this module is side-effect-free (only a direct invocation runs main()).

import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import child_process from 'node:child_process';
import { planImageArtifacts } from './brandmint.mjs';
import { makeGptImage } from './lib/gpt-image.mjs';
import { decodePng } from './lib/png-decode.mjs';
import { scorePalette } from './lib/kit-qa.mjs';
import { rerollImages } from './lib/reroll.mjs';

// Where the gpt-image-2 skill lives by default — mirrors brandmint.mjs / brandmint-multi.mjs so all
// the CLIs resolve gen.sh the same way. Derived from $HOME for portability; override with --skill-dir.
const DEFAULT_SKILL_DIR = path.join(os.homedir(), '.agents', 'skills-archive', 'gpt-image-2');

// The metrics scorePalette exposes that make sense to gate on (a render's on-brand-ness).
const METRICS = new Set(['coverage', 'accentPresence']);

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────────
// Parses the spec + outDir + flags, wires the REAL adapters, runs rerollImages, and prints a per-image
// line (attempts · bestScore · on/off-brand). Exits 2 on any usage or parse error.
function main() {
  const args = process.argv.slice(2);
  const positional = [];
  let threshold = 0.12;
  let maxAttempts = 2;
  let metric = 'coverage';
  let skillDir = DEFAULT_SKILL_DIR;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--threshold') threshold = parseFloat(args[++i]);
    else if (args[i] === '--max-attempts') maxAttempts = parseInt(args[++i], 10);
    else if (args[i] === '--metric') metric = args[++i];
    else if (args[i] === '--skill-dir') skillDir = args[++i];
    else positional.push(args[i]);
  }

  const [specPath, outDir] = positional;
  if (!specPath || !outDir) {
    console.error('usage: node taste/scripts/brandmint-reroll.mjs <brand-spec.json> <outDir> [--threshold 0.12] [--max-attempts 2] [--metric coverage|accentPresence] [--skill-dir <path>]');
    process.exit(2);
  }
  if (!METRICS.has(metric)) {
    console.error(`✖ unknown --metric "${metric}" (expected one of: ${[...METRICS].join(', ')})`);
    process.exit(2);
  }
  if (!Number.isFinite(threshold)) {
    console.error('✖ --threshold must be a number');
    process.exit(2);
  }
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    console.error('✖ --max-attempts must be an integer >= 1');
    process.exit(2);
  }

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (e) {
    console.error(`✖ cannot read/parse brand-spec ${specPath}: ${e.message}`);
    process.exit(2);
  }

  // Ensure the render directory exists, and bind each descriptor's output under outDir.
  fs.mkdirSync(`${outDir}/images`, { recursive: true });
  const descriptors = planImageArtifacts(spec).map((d) => ({ ...d, out: `${outDir}/${d.file}` }));

  // REAL generateImage: spawnSync bash gen.sh (image gen via the user's ChatGPT sub).
  const { generateImage } = makeGptImage({
    skillDir,
    runner: (argv) => child_process.spawnSync('bash', argv, { stdio: 'inherit' }),
  });

  // REAL scoreImage: read the rendered PNG → decode to RGB → score against the brand palette.
  const palette = spec.visual_tokens?.palette || [];
  const scoreImage = (out) => {
    const { pixels } = decodePng(fs.readFileSync(out));
    return scorePalette(pixels, palette);
  };

  const log = (m) => console.log(m);

  console.log(`\n  brandmint-reroll — ${spec.identity?.name || spec.brand}`);
  console.log(`  threshold ${threshold} · max-attempts ${maxAttempts} · metric ${metric}`);
  console.log(`  ${'-'.repeat(48)}`);

  const results = rerollImages({
    descriptors,
    generateImage,
    scoreImage,
    scoreOf: (s) => s[metric],
    threshold,
    maxAttempts,
    log,
  });

  console.log(`  ${'-'.repeat(48)}`);
  for (const r of results) {
    const score = r.bestScore === -Infinity ? 'n/a' : r.bestScore.toFixed(3);
    console.log(`  image:  ${r.file} — ${r.attempts} attempt(s) · best ${score} · ${r.onBrand ? 'on-brand' : 'OFF-BRAND'}`);
  }
  console.log(`  → ${outDir}\n`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
