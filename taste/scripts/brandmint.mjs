#!/usr/bin/env node
// brandmint.mjs — the brandmint FLOW orchestrator: one brand-spec in → a full brand-kit out.
//
//   node taste/scripts/brandmint.mjs <brand-spec.json> <outDir> [--no-images] [--skill-dir <path>]
//
// brandmint composes the wing's DETERMINISTIC generators — genLogo (visual), genVoiceGuide (verbal),
// genPositioning (messaging), versionOf (content-address) — into the text half of a kit, then plans
// the on-brand prompts for the GENERATIVE half (gpt-image-2 via lib/gpt-image.mjs) and renders them.
// The deterministic core never spends; the generative half runs through the user's ChatGPT sub.
//
// Three pure cores + one injected-I/O orchestrator, in the wing's house style (gen-logo.mjs):
//   buildTextArtifacts(spec) -> { filename: contents }   PURE: the 5 text files' string contents.
//   planImageArtifacts(spec) -> [ {name,file,prompt,refs} ]   PURE: derives on-brand image prompts.
//   runBrandKit({…}) -> manifest   writes the kit + renders images via injected writeFile/generateImage.
//
// Zero dependencies: node: builtins only. File writes / process spawning live behind main().

import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import child_process from 'node:child_process';
import { genLogo } from './gen-logo.mjs';
import { genVoiceGuide } from './gen-voice.mjs';
import { genPositioning } from './gen-positioning.mjs';
import { versionOf } from './brand-version.mjs';
import { makeGptImage } from './lib/gpt-image.mjs';
import { rerollImages } from './lib/reroll.mjs';
import { decodePng } from './lib/png-decode.mjs';
import { scorePalette } from './lib/kit-qa.mjs';

// Where the gpt-image-2 skill lives by default (its scripts/gen.sh is the codex bridge). Derived from
// $HOME so it's portable across users/CI; override with --skill-dir for a non-standard install.
const DEFAULT_SKILL_DIR = path.join(os.homedir(), '.agents', 'skills-archive', 'gpt-image-2');

// ── PURE: the text half of the kit ───────────────────────────────────────────────────────────────
// Five files, all string contents. brand-spec.json is a plain pretty-print so it round-trips the
// canonical spec exactly (downstream re-parses it). logo.svg is the full lockup string — genLogo
// returns { markSvg, logoSvg, logoDarkSvg }, so we pull .logoSvg. version.txt is the bare content
// hash. Does not mutate `spec`.
export function buildTextArtifacts(spec) {
  return {
    'brand-spec.json': JSON.stringify(spec, null, 2),
    'logo.svg': genLogo(spec).logoSvg,
    'voice.md': genVoiceGuide(spec),
    'positioning.md': genPositioning(spec),
    'version.txt': versionOf(spec),
  };
}

// ── PURE: plan the generative half ───────────────────────────────────────────────────────────────
// Exactly two text-to-image descriptors (refs:[] — the gpt-image-2 skill's guidance is to stay
// text-only when references are ambiguous): a flat brand-board (wordmark + palette + type + imagery)
// and a single polished logo/wordmark concept. Tokens are pulled defensively so an under-specified
// spec still yields sensible prompts. The literal prompt text is the contract: each names the brand,
// the board carries every palette hex, the logo names the wordmark.
export function planImageArtifacts(spec) {
  const name = spec.identity?.name || spec.brand;
  const tagline = spec.identity?.tagline || '';
  const category = spec.positioning?.category || 'brand';
  const palette = spec.visual_tokens?.palette || [];
  const heading = spec.visual_tokens?.type?.heading || 'bold sans-serif';
  const body = spec.visual_tokens?.type?.body || 'clean sans-serif';
  const imagery = spec.visual_tokens?.imagery || 'bold, authentic';

  return [
    {
      name: 'brand-board',
      file: 'images/brand-board.png',
      refs: [],
      prompt:
        `A clean, modern brand identity board for "${name}" — ${tagline}. Show: the brand name "${name}" as a bold sans-serif wordmark; a color palette strip with these exact swatches labelled with their hex codes ${palette.join(', ')}; a type specimen (${heading} headings, ${body} body); and a few small imagery swatches in the style of ${imagery}. Flat, professional, organised on a light background with generous whitespace. No device mockups, no people — just the identity system, like an Awwwards-grade brand guidelines page.`,
    },
    {
      name: 'logo-concept',
      file: 'images/logo-concept.png',
      refs: [],
      prompt:
        `A single polished logo / wordmark concept for "${name}", a ${category}. Bold sans-serif logotype, confident and minimal, with an optional simple geometric mark. Primary brand colour ${palette[0] || '#FF6B35'} on a ${palette[1] || '#1A1A2E'} dark background, plus a light-background variant beside it. Vector-clean, high contrast, centred, generous negative space. No tagline, no UI, no photography — just the logo/wordmark, like a logo presentation tile.`,
    },
  ];
}

// The reroll-detail suffix for an image artifact — "· N attempt(s) · best X[ <mark>]" — or '' for the
// single-generation path (no bestScore). Shared by the README and the CLI summary so the format lives
// in one place; the on-brand marker differs per surface (README prose vs CLI tick).
function rerollSuffix(a, onBrandMark) {
  if (a.bestScore === undefined) return '';
  const best = a.bestScore === -Infinity ? 'n/a' : Number(a.bestScore).toFixed(3);
  return ` · ${a.attempts} attempt(s) · best ${best}${a.onBrand ? onBrandMark : ''}`;
}

// ── README index for the kit ─────────────────────────────────────────────────────────────────────
// A small human-readable manifest: brand name, version, the text files, and each image's render
// status (rendered / gated when generation was skipped or failed). PURE string builder.
function buildReadme({ brand, version, textArtifacts, imageArtifacts }) {
  const L = [];
  L.push(`# ${brand} — brand kit`);
  L.push('');
  L.push(`Version \`${String(version).trim()}\` — a deterministic content hash of the brand-spec.`);
  L.push('');
  L.push('## Text artifacts');
  for (const f of textArtifacts) L.push(`- \`${f}\``);
  L.push('');
  L.push('## Image artifacts');
  if (imageArtifacts.length === 0) {
    L.push('- _(image generation skipped)_');
  } else {
    for (const a of imageArtifacts) {
      const status = a.ok ? '✓ rendered' : `gated (code ${a.code ?? 'n/a'})`;
      L.push(`- \`${a.file}\` — ${a.name} — ${status}${rerollSuffix(a, ' · on-brand')}`);
    }
  }
  L.push('');
  return L.join('\n');
}

// ── runBrandKit: write the kit + render the images ───────────────────────────────────────────────
// I/O is injected (writeFile/mkdir/log/generateImage) so the whole flow is unit-testable with no disk
// or codex. Writes every text artifact, then (unless images:false) renders each planned image via the
// injected generateImage, recording its result. version is a pure function of spec → two runs of the
// same spec yield the same version (idempotent). Returns a manifest enumerating everything produced.
export function runBrandKit({ spec, outDir, generateImage, writeFile, mkdir = () => {}, log = () => {}, images = true, reroll = null }) {
  mkdir(outDir);
  mkdir(`${outDir}/images`);

  const text = buildTextArtifacts(spec);
  const textArtifacts = Object.keys(text);
  for (const [filename, content] of Object.entries(text)) {
    writeFile(`${outDir}/${filename}`, content);
    log(`  ✓ ${filename}`);
  }

  let imageArtifacts = [];
  if (images) {
    const descriptors = planImageArtifacts(spec).map((d) => ({ ...d, out: `${outDir}/${d.file}` }));
    if (reroll) {
      // self-correcting path: generate → score → regenerate any off-brand render, keep the best
      // (lib/reroll.mjs). `reroll` = { scoreImage, scoreOf, threshold, maxAttempts }. Each result
      // carries { attempts, bestScore, onBrand } on top of { name, file, out, ok }.
      imageArtifacts = rerollImages({
        descriptors,
        generateImage,
        scoreImage: reroll.scoreImage,
        scoreOf: reroll.scoreOf,
        threshold: reroll.threshold,
        maxAttempts: reroll.maxAttempts,
        log,
      });
    } else {
      // default path: one generation per descriptor (unchanged single-gen behavior)
      for (const d of descriptors) {
        const res = generateImage({ prompt: d.prompt, out: d.out, refs: d.refs });
        imageArtifacts.push({ name: d.name, file: d.file, out: d.out, ok: res?.ok ?? false, code: res?.code });
        log(`  ${res?.ok ? '✓' : '✗'} ${d.file}`);
      }
    }
  }

  const brand = spec.identity?.name || spec.brand;
  const version = text['version.txt']; // reuse the hash buildTextArtifacts already computed — no double-hash
  const readme = buildReadme({ brand, version, textArtifacts, imageArtifacts });
  writeFile(`${outDir}/README.md`, readme);

  return { brand, version, outDir, textArtifacts, imageArtifacts, readme: 'README.md' };
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────────

// parseArgs — the CLI option parser, extracted so the defaults are unit-testable. Headline contract:
// reroll is ON BY DEFAULT (the flow self-corrects every render); --no-reroll opts out. PURE: argv in →
// options out, no I/O. The library runBrandKit stays reroll=null by default (it can't self-score
// without an injected scorer) — the default lives at the CLI layer, where the real scorer exists.
export function parseArgs(argv) {
  const positional = [];
  let skillDir = DEFAULT_SKILL_DIR;
  let images = true;
  let reroll = true; // self-correct by default — opt out with --no-reroll
  let threshold = 0.12, maxAttempts = 2, metric = 'coverage';
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--no-images') images = false;
    else if (a === '--no-reroll') reroll = false;
    else if (a === '--reroll') reroll = true;
    else if (a === '--skill-dir') skillDir = argv[++i];
    else if (a === '--threshold') threshold = Number(argv[++i]);
    else if (a === '--max-attempts') maxAttempts = Number(argv[++i]);
    else if (a === '--metric') metric = argv[++i];
    else positional.push(a);
  }
  const [specPath, outDir] = positional;
  return { specPath, outDir, skillDir, images, reroll, threshold, maxAttempts, metric };
}

// Wires the REAL gpt-image adapter (spawnSync bash gen.sh) and real fs writes. Importing the module
// (e.g. from tests) is side-effect-free — only a direct invocation runs main().
function main() {
  const { specPath, outDir, skillDir, images, reroll, threshold, maxAttempts, metric } = parseArgs(process.argv.slice(2));
  if (!specPath || !outDir) {
    console.error('usage: node taste/scripts/brandmint.mjs <brand-spec.json> <outDir> [--no-images] [--no-reroll] [--skill-dir <path>] [--threshold N] [--max-attempts N] [--metric coverage|accentPresence]');
    process.exit(2);
  }

  let spec;
  try {
    spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
  } catch (e) {
    console.error(`✖ cannot read/parse brand-spec ${specPath}: ${e.message}`);
    process.exit(2);
  }

  const { generateImage } = makeGptImage({
    skillDir,
    runner: (argv) => child_process.spawnSync('bash', argv, { stdio: 'inherit' }),
  });
  const writeFile = (p, c) => fs.writeFileSync(p, c);
  const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
  const log = (m) => console.log(m);

  // --reroll wires the REAL scorer: read the rendered PNG → decodePng → scorePalette vs the spec
  // palette, gate on the chosen metric. Off → the default single-generation path.
  let rerollCfg = null;
  if (reroll && images) {
    const palette = spec.visual_tokens?.palette || [];
    const scoreImage = (out) => scorePalette(decodePng(fs.readFileSync(out)).pixels, palette);
    rerollCfg = { scoreImage, scoreOf: (s) => s[metric], threshold, maxAttempts };
    console.log(`  (reroll on · metric ${metric} · threshold ${threshold} · max ${maxAttempts} attempts — --no-reroll to disable)`);
  }

  const manifest = runBrandKit({ spec, outDir, generateImage, writeFile, mkdir, log, images, reroll: rerollCfg });

  console.log(`\n  brandmint — ${manifest.brand} @ ${manifest.version}`);
  console.log(`  ${'-'.repeat(48)}`);
  console.log(`  text:   ${manifest.textArtifacts.join(', ')}, README.md`);
  if (manifest.imageArtifacts.length === 0) {
    console.log('  images: (skipped)');
  } else {
    for (const a of manifest.imageArtifacts) {
      console.log(`  image:  ${a.file} — ${a.ok ? 'rendered' : `gated (code ${a.code ?? 'n/a'})`}${rerollSuffix(a, ' ✓')}`);
    }
  }
  console.log(`  → ${outDir}\n`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
