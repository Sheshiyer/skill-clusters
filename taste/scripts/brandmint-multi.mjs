#!/usr/bin/env node
// brandmint-multi.mjs — the multi-brand FAN-OUT: one brands.json in → N brand-kits out.
//
//   node taste/scripts/brandmint-multi.mjs <brands.json> <outRoot> [--no-images] [--skill-dir <path>]
//
// brandmint.mjs mints ONE kit per spec. brandmint-multi loops the same flow across a roster of
// brands, writing each kit under <outRoot>/<name> and an <outRoot>/index.json that enumerates the
// roster (brand, version, outDir). It does NOT re-implement the flow — it composes runBrandKit, so a
// single brand and N brands render byte-identically.
//
// One pure core + one injected-I/O orchestrator, in the wing's house style (brandmint.mjs):
//   runMultiBrand({brands, runKit}) -> manifests[]   PURE fan-out: runKit({spec,outDir}) is INJECTED,
//                                                     so tests pass a fake (records calls) and the CLI
//                                                     passes a real one wrapping runBrandKit. For each
//                                                     brand it calls runKit once, in order, and
//                                                     collects the returned manifest.
//
// Zero dependencies: node: builtins only. File reads / process spawning live behind main().

import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import child_process from 'node:child_process';
import { runBrandKit } from './brandmint.mjs';
import { makeGptImage } from './lib/gpt-image.mjs';

// Where the gpt-image-2 skill lives by default — mirrors brandmint.mjs so both CLIs resolve gen.sh
// the same way. Derived from $HOME for portability; override with --skill-dir.
const DEFAULT_SKILL_DIR = path.join(os.homedir(), '.agents', 'skills-archive', 'gpt-image-2');

// ── PURE: fan the flow out across the roster ─────────────────────────────────────────────────────
// brands = [ {name?, spec, outDir}, … ]. runKit = ({spec,outDir}) -> manifest (injected: the CLI
// wraps runBrandKit, tests pass a recorder). For each brand we call runKit exactly once and push the
// manifest it returns, preserving roster order. Returns the manifests array. No I/O of its own — the
// only thing that touches disk/codex is whatever runKit closes over.
export function runMultiBrand({ brands, runKit }) {
  const manifests = [];
  for (const brand of brands) {
    manifests.push(runKit({ spec: brand.spec, outDir: brand.outDir }));
  }
  return manifests;
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────────
// Reads brands.json (an array of {name, specPath, outDir?}), builds a REAL runKit that calls
// runBrandKit with real fs writes + the real gpt-image adapter, fans out, then writes the roster
// index. Importing the module (e.g. from tests) is side-effect-free — only a direct invocation runs
// main(), so runMultiBrand stays a pure unit.
function main() {
  const args = process.argv.slice(2);
  const positional = [];
  let skillDir = DEFAULT_SKILL_DIR;
  let noImages = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--no-images') noImages = true;
    else if (args[i] === '--skill-dir') skillDir = args[++i];
    else positional.push(args[i]);
  }
  const [brandsPath, outRoot] = positional;
  if (!brandsPath || !outRoot) {
    console.error('usage: node taste/scripts/brandmint-multi.mjs <brands.json> <outRoot> [--no-images] [--skill-dir <path>]');
    process.exit(2);
  }

  let roster;
  try {
    roster = JSON.parse(fs.readFileSync(brandsPath, 'utf8'));
    if (!Array.isArray(roster)) throw new Error('brands.json must be an array of {name, specPath, outDir?}');
  } catch (e) {
    console.error(`✖ cannot read/parse brands roster ${brandsPath}: ${e.message}`);
    process.exit(2);
  }

  // Real I/O, bound once and shared by every kit run: fs writes, recursive mkdir, console log, and the
  // real gpt-image adapter (spawnSync bash gen.sh). images is gated by --no-images.
  const { generateImage } = makeGptImage({
    skillDir,
    runner: (argv) => child_process.spawnSync('bash', argv, { stdio: 'inherit' }),
  });
  const writeFile = (p, c) => fs.writeFileSync(p, c);
  const mkdir = (p) => fs.mkdirSync(p, { recursive: true });
  const log = (m) => console.log(m);

  // A real runKit: parse each entry's spec, derive its outDir, and mint the kit. outDir precedence is
  // explicit entry.outDir → <outRoot>/<name> → <outRoot>/<spec identity.name|brand>.
  const runKit = ({ spec, outDir }) => runBrandKit({ spec, outDir, generateImage, writeFile, mkdir, log, images: !noImages });

  // Turn each roster entry into a {name, spec, outDir} brand by reading its specPath off disk, then
  // fan out. Parse errors on any spec abort with exit 2 (same contract as brandmint.mjs).
  const brands = [];
  for (const entry of roster) {
    let spec;
    try {
      spec = JSON.parse(fs.readFileSync(entry.specPath, 'utf8'));
    } catch (e) {
      console.error(`✖ cannot read/parse brand-spec ${entry.specPath}: ${e.message}`);
      process.exit(2);
    }
    const name = entry.name || spec.identity?.name || spec.brand;
    const outDir = entry.outDir || path.join(outRoot, String(name));
    brands.push({ name, spec, outDir });
  }

  const manifests = runMultiBrand({ brands, runKit });

  // The roster index: a compact, machine-readable list of what was minted, written at the outRoot.
  const index = manifests.map((m) => ({ brand: m.brand, version: m.version, outDir: m.outDir }));
  mkdir(outRoot);
  writeFile(path.join(outRoot, 'index.json'), JSON.stringify(index, null, 2));

  console.log(`\n  brandmint-multi — ${manifests.length} brand${manifests.length === 1 ? '' : 's'}`);
  console.log(`  ${'-'.repeat(48)}`);
  for (const m of index) console.log(`  • ${m.brand} @ ${String(m.version).trim()} → ${m.outDir}`);
  console.log(`  → ${path.join(outRoot, 'index.json')}\n`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
