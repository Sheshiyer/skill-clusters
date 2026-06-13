#!/usr/bin/env node
// prune-archive.mjs — delete archive copies that are already canonicalized in skill-clusters.
//
// Safe default: dry-run. This does NOT remove archive-only skills because skill-index.json still
// resolves those names to ~/.agents/skills-archive/<name> for Read/restore.
//
//   node scripts/prune-archive.mjs          # dry-run
//   node scripts/prune-archive.mjs --apply  # remove canonicalized archive duplicates only

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const ARCHIVE = path.join(os.homedir(), '.agents', 'skills-archive');
const MANIFEST = path.join(ARCHIVE, '.archived.json');
const INDEX = path.join(REPO, 'skill-index.json');
const APPLY = process.argv.includes('--apply');

const archived = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')).archived || [];
const index = JSON.parse(fs.readFileSync(INDEX, 'utf8')).skills || {};

const canonicalized = [];
const archiveOnly = [];
const missing = [];

for (const name of archived) {
  const entry = index[name];
  const archivePath = path.join(ARCHIVE, name);
  if (!fs.existsSync(archivePath)) {
    missing.push(name);
    continue;
  }
  if (entry && entry.status !== 'archived') canonicalized.push(name);
  else archiveOnly.push(name);
}

if (APPLY) {
  for (const name of canonicalized) fs.rmSync(path.join(ARCHIVE, name), { recursive: true, force: true });
  fs.writeFileSync(MANIFEST, JSON.stringify({ archived: archiveOnly }, null, 2) + '\n');
  execFileSync('node', [path.join(__dirname, 'gen-index.mjs')], { stdio: 'inherit' });
}

console.log(`${APPLY ? '' : '[dry-run] '}archive prune:`);
console.log(`  canonicalized duplicates removable: ${canonicalized.length}`);
console.log(`  archive-only retained: ${archiveOnly.length}`);
console.log(`  missing archive entries: ${missing.length}`);
console.log(`  sample removable: ${canonicalized.slice(0, 20).join(', ')}`);
if (archiveOnly.length) console.log(`  sample retained: ${archiveOnly.slice(0, 20).join(', ')}`);
