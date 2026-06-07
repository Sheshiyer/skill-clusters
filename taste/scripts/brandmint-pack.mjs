#!/usr/bin/env node
// brandmint-pack.mjs — the asset-pack manifest: a kit directory in → a content-addressed pack.json.
//
//   node taste/scripts/brandmint-pack.mjs <kitDir>
//
// A brand-kit (from brandmint.mjs) is a folder of text + image artifacts. brandmint-pack walks it and
// emits pack.json — one entry per file with its byte length + sha256, plus aggregate count and
// totalBytes — so a kit can be verified, diffed, or shipped as a sealed bundle. When the kit carries a
// version.txt and a brand-spec.json, the pack is stamped with that brand + version too.
//
// One pure core + one injected-I/O orchestrator, in the wing's house style (brandmint.mjs):
//   packKit({files, readBytes, sha256}) -> {count, totalBytes, files:[{path,bytes,sha256}]}
//                                          PURE: readBytes(path)->bytes and sha256(bytes)->hex are
//                                          INJECTED, so tests pass fakes and nothing touches disk or
//                                          node:crypto. For each relative path it records the byte
//                                          length + hash, then aggregates count + totalBytes.
//
// Zero dependencies: node: builtins only. Directory walk / hashing live behind main().

import { pathToFileURL } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

// ── PURE: build the pack manifest ────────────────────────────────────────────────────────────────
// files = array of relative paths. readBytes(path) -> Buffer/Uint8Array (its .length is the byte
// count). sha256(bytes) -> hex string. For each path we read once, hash once, and record
// {path,bytes,sha256}, preserving input order; count + totalBytes aggregate the set. No I/O of its
// own — readBytes/sha256 carry it.
export function packKit({ files, readBytes, sha256 }) {
  const entries = [];
  let totalBytes = 0;
  for (const p of files) {
    const bytes = readBytes(p);
    const len = bytes.length;
    totalBytes += len;
    entries.push({ path: p, bytes: len, sha256: sha256(bytes) });
  }
  return { count: entries.length, totalBytes, files: entries };
}

// ── walk a directory tree → sorted relative file paths ───────────────────────────────────────────
// Depth-first recursive enumeration of every file under root (directories descended, files emitted),
// returned as root-relative POSIX-ish paths and sorted for a stable manifest. An existing pack.json at
// the root is excluded so re-packing a kit is idempotent (the pack never lists itself).
function walkFiles(root, dir = root, out = []) {
  for (const name of fs.readdirSync(dir).sort()) {
    const abs = path.join(dir, name);
    const rel = path.relative(root, abs);
    if (fs.statSync(abs).isDirectory()) walkFiles(root, abs, out);
    else if (rel !== 'pack.json') out.push(rel);
  }
  return out;
}

// ── CLI ──────────────────────────────────────────────────────────────────────────────────────────
// Walks kitDir, hashes every file with node:crypto sha256, stamps brand/version when the kit carries
// them, and writes pack.json. Importing the module (e.g. from tests) is side-effect-free — only a
// direct invocation runs main(), so packKit stays a pure unit.
function main() {
  const [kitDir] = process.argv.slice(2);
  if (!kitDir) {
    console.error('usage: node taste/scripts/brandmint-pack.mjs <kitDir>');
    process.exit(2);
  }
  if (!fs.existsSync(kitDir) || !fs.statSync(kitDir).isDirectory()) {
    console.error(`✖ not a directory: ${kitDir}`);
    process.exit(2);
  }

  // Real I/O: read bytes off disk, hash with node:crypto. readBytes returns a Buffer so packKit's
  // bytes.length is the true byte count.
  const readBytes = (rel) => fs.readFileSync(path.join(kitDir, rel));
  const sha256 = (bytes) => crypto.createHash('sha256').update(bytes).digest('hex');

  const files = walkFiles(kitDir);
  const manifest = packKit({ files, readBytes, sha256 });

  // Stamp brand + version when the kit advertises them: version.txt is the bare content hash,
  // brand-spec.json carries identity.name (falling back to .brand). Both are optional.
  const versionPath = path.join(kitDir, 'version.txt');
  if (fs.existsSync(versionPath)) manifest.version = fs.readFileSync(versionPath, 'utf8').trim();
  const specPath = path.join(kitDir, 'brand-spec.json');
  if (fs.existsSync(specPath)) {
    try {
      const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));
      manifest.brand = spec.identity?.name || spec.brand;
    } catch { /* a malformed spec just means no brand stamp — the file still lists in files[] */ }
  }

  fs.writeFileSync(path.join(kitDir, 'pack.json'), JSON.stringify(manifest, null, 2));

  const stamp = manifest.brand ? `${manifest.brand}${manifest.version ? ` @ ${manifest.version}` : ''} — ` : '';
  console.log(`brandmint-pack: ${stamp}${manifest.count} files, ${manifest.totalBytes} bytes → ${path.join(kitDir, 'pack.json')}`);
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
