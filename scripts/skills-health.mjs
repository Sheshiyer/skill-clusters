#!/usr/bin/env node
// skills-health.mjs — STRUCTURAL health gate for skill-clusters (the drift firewall).
//
// Validates, with ZERO dependencies:
//   1. Frontmatter against schemas/skill-frontmatter.schema.json (required/pattern/minLength).
//   2. name === directory name (the skills.sh @handle).
//   3. Manifest <-> disk reconciliation: every skills.sh.json skill exists; every skill on disk
//      is in >=1 grouping (NO ORPHANS — ECC shipped 54 skills no profile installed).
//   4. No live supersession: a `supersedes:` target that still exists is an ERROR
//      (ECC kept continuous-learning + autonomous-loops alive next to their replacements).
//   5. Dead/foreign symlinks: ~/.agents/skills entries pointing into this repo must resolve.
//   6. WARN (not fail): missing cluster/version/origin, or a description with no "USE WHEN" trigger.
//
// Exit 1 on any ERROR (CI/gate usable). Flags: --json, --warn-only, --no-symlinks, --help.
//
// This is STRUCTURAL health (prevents drift). ECC's skills-health.js is RUNTIME health
// (success-rate/decline) — complementary, added later.

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, '..');
const SKILLS_DIR = path.join(REPO, 'skills');
const MANIFEST = path.join(REPO, 'skills.sh.json');
const SCHEMA = path.join(REPO, 'schemas', 'skill-frontmatter.schema.json');

const args = process.argv.slice(2);
if (args.includes('--help') || args.includes('-h')) {
  console.log('Usage: node scripts/skills-health.mjs [--json] [--warn-only] [--no-symlinks]');
  process.exit(0);
}
const asJson = args.includes('--json');
const warnOnly = args.includes('--warn-only');
const checkSymlinks = !args.includes('--no-symlinks');

const errors = [];
const warnings = [];
const err = (skill, msg) => errors.push({ skill, msg });
const warn = (skill, msg) => warnings.push({ skill, msg });

// ---- frontmatter parser (single-line key: value; quotes stripped) ----
function parseFrontmatter(text) {
  if (!text.startsWith('---')) return null;
  const end = text.indexOf('\n---', 3);
  if (end === -1) return null;
  const block = text.slice(3, end);
  const fm = {};
  for (const line of block.split('\n')) {
    const m = line.match(/^([A-Za-z_][\w-]*):\s?(.*)$/);
    if (!m) continue;
    const k = m[1];
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    if (!(k in fm)) fm[k] = v;
  }
  return fm;
}

// ---- minimal JSON-schema-subset checker (required / type / pattern / minLength) ----
function checkSchema(fm, schema, skill) {
  for (const req of schema.required || []) {
    if (!(req in fm) || fm[req] === '') err(skill, `missing required frontmatter '${req}'`);
  }
  for (const [key, spec] of Object.entries(schema.properties || {})) {
    if (!(key in fm) || fm[key] === '') continue;
    const val = fm[key];
    if (spec.minLength && val.length < spec.minLength) {
      err(skill, `'${key}' is ${val.length} chars, min ${spec.minLength}`);
    }
    if (spec.pattern && !new RegExp(spec.pattern).test(val)) {
      err(skill, `'${key}' ("${val.slice(0, 40)}") fails pattern ${spec.pattern}`);
    }
  }
}

// ---- load schema + manifest ----
let schema, manifest;
try { schema = JSON.parse(fs.readFileSync(SCHEMA, 'utf8')); }
catch (e) { console.error(`FATAL: cannot read schema: ${e.message}`); process.exit(2); }
try { manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8')); }
catch (e) { console.error(`FATAL: cannot read skills.sh.json: ${e.message}`); process.exit(2); }

// ---- enumerate skills on disk ----
const onDisk = fs.readdirSync(SKILLS_DIR, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

// ---- per-skill checks ----
const fmBySkill = {};
const supersedes = []; // {skill, target}
for (const name of onDisk) {
  const skillMd = path.join(SKILLS_DIR, name, 'SKILL.md');
  if (!fs.existsSync(skillMd)) { err(name, 'no SKILL.md'); continue; }
  const fm = parseFrontmatter(fs.readFileSync(skillMd, 'utf8'));
  if (!fm) { err(name, 'no parseable frontmatter (--- block)'); continue; }
  fmBySkill[name] = fm;

  checkSchema(fm, schema, name);
  if (fm.name && fm.name !== name) err(name, `frontmatter name '${fm.name}' != directory '${name}'`);
  if (fm.description && !/use when/i.test(fm.description)) {
    warn(name, "description has no 'USE WHEN' trigger (the routing key)");
  }
  if (!fm.cluster) warn(name, "missing 'cluster'");
  if (!fm.version) warn(name, "missing 'version'");
  if (fm.supersedes) supersedes.push({ skill: name, target: fm.supersedes });
}

// ---- supersession: a superseded target that still exists is an ERROR ----
for (const { skill, target } of supersedes) {
  if (onDisk.includes(target)) {
    err(skill, `supersedes '${target}' but '${target}' still exists live (remove it)`);
  }
}

// ---- manifest <-> disk reconciliation ----
const inManifest = new Set();
const groupingByCluster = new Set();
for (const g of manifest.groupings || []) {
  for (const s of g.skills || []) {
    inManifest.add(s);
    if (!onDisk.includes(s)) err(s, `listed in manifest grouping "${g.title}" but missing on disk`);
  }
}
for (const name of onDisk) {
  if (!inManifest.has(name)) err(name, 'ORPHAN: on disk but in no skills.sh.json grouping');
}
// cluster frontmatter that names a non-existent grouping handle
const groupingTitles = (manifest.groupings || []).map((g) => g.title.toLowerCase());

// ---- dead/foreign symlink check (deployed harness drift) ----
let symlinkReport = { checked: 0, intoRepo: 0, broken: [] };
if (checkSymlinks) {
  const agentsDir = path.join(os.homedir(), '.agents', 'skills');
  if (fs.existsSync(agentsDir)) {
    for (const entry of fs.readdirSync(agentsDir)) {
      const p = path.join(agentsDir, entry);
      let stat;
      try { stat = fs.lstatSync(p); } catch { continue; }
      if (!stat.isSymbolicLink()) continue;
      symlinkReport.checked++;
      const target = fs.readlinkSync(p);
      const resolved = path.resolve(agentsDir, target);
      if (!resolved.startsWith(SKILLS_DIR)) continue; // foreign (other source) — ignore
      symlinkReport.intoRepo++;
      if (!fs.existsSync(resolved)) symlinkReport.broken.push({ entry, target });
    }
  }
}
for (const b of symlinkReport.broken) err(b.entry, `dead symlink in ~/.agents/skills -> ${b.target}`);

// ---- report ----
const summary = {
  skills_on_disk: onDisk.length,
  in_manifest: inManifest.size,
  clusters: (manifest.groupings || []).length,
  errors: errors.length,
  warnings: warnings.length,
  symlinks_into_repo: symlinkReport.intoRepo,
  dead_symlinks: symlinkReport.broken.length,
};

if (asJson) {
  console.log(JSON.stringify({ summary, errors, warnings }, null, 2));
} else {
  console.log(`\n  Skills-Health — structural gate`);
  console.log(`  ${'-'.repeat(48)}`);
  console.log(`  skills on disk : ${summary.skills_on_disk}`);
  console.log(`  in manifest    : ${summary.in_manifest}  (clusters: ${summary.clusters})`);
  console.log(`  symlinks→repo  : ${summary.symlinks_into_repo}  (dead: ${summary.dead_symlinks})`);
  console.log(`  ${'-'.repeat(48)}`);
  if (errors.length) {
    console.log(`\n  ✖ ${errors.length} ERROR(S):`);
    for (const e of errors) console.log(`     [${e.skill}] ${e.msg}`);
  }
  if (warnings.length) {
    console.log(`\n  ⚠ ${warnings.length} warning(s):`);
    const shown = warnings.slice(0, 40);
    for (const w of shown) console.log(`     [${w.skill}] ${w.msg}`);
    if (warnings.length > shown.length) console.log(`     … and ${warnings.length - shown.length} more`);
  }
  console.log(
    `\n  ${errors.length ? '✖ FAIL' : '✓ PASS'} — ${errors.length} error(s), ${warnings.length} warning(s)\n`
  );
}

process.exit(errors.length && !warnOnly ? 1 : 0);
