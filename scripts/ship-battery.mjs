#!/usr/bin/env node
// ship-battery.mjs — the fail-CLOSED ship gate the conductor runs before shipping.
//
// conducty's Ship step is advisory ("6-gate battery"); PAI's doctrine is that real gates fail
// CLOSED. This is that gate, made runnable and project-generic: it runs every check it can find in
// the target project and EXITS NON-ZERO if any *required* gate fails. The conductor calls it at the
// Ship step; a non-zero exit means do not ship / do not auto-merge — escalate to the human.
//
//   node scripts/ship-battery.mjs [--dir <path>] [--json] [--warn-only]
//
//   --dir <path>   project to gate (default: cwd)
//   --warn-only    run everything, report, but exit 0 regardless (preview the gate)
//   --json         machine-readable result
//
// Gates (each runs only when applicable to the target project):
//   structural  skills-health.mjs            — required, when the project is a skills repo
//   secrets     obvious-secret pattern scan  — required (tracked text files)
//   lint        npm run lint                 — required, when the script exists
//   typecheck   npm run typecheck | tsc      — required, when configured
//   tests       npm test                     — required, when the script exists
//   gitclean    uncommitted working tree     — advisory (warn, never blocks)

import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const argv = process.argv.slice(2);
const asJson = argv.includes('--json');
const warnOnly = argv.includes('--warn-only');
const dir = path.resolve((() => { const i = argv.indexOf('--dir'); return i >= 0 ? argv[i + 1] : '.'; })());

const has = (p) => fs.existsSync(path.join(dir, p));
const pkg = has('package.json') ? JSON.parse(fs.readFileSync(path.join(dir, 'package.json'), 'utf8')) : null;
const pkgScript = (name) => pkg?.scripts?.[name];

// run a shell command in the target dir; return {ok, out}
function run(cmd, { required = true } = {}) {
  try {
    const out = execSync(cmd, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', timeout: 600000 });
    return { ok: true, out: (out || '').trim().slice(-2000), required };
  } catch (e) {
    return { ok: false, out: ((e.stdout || '') + (e.stderr || '') || e.message).trim().slice(-2000), required };
  }
}

const gates = [];
const add = (name, status, detail, required = true) => gates.push({ name, status, detail, required });

// 1. structural — skills-health when this is a skills repo
if (has('skills.sh.json')) {
  const health = path.join(__dirname, 'skills-health.mjs');
  const r = run(`node ${JSON.stringify(health)} --no-symlinks`, { required: true });
  add('structural', r.ok ? 'pass' : 'fail', r.ok ? 'skills-health: PASS' : r.out.split('\n').slice(-6).join(' / '), true);
} else {
  add('structural', 'skip', 'not a skills repo (no skills.sh.json)', false);
}

// 2. secrets — split: high-precision real-credential formats are REQUIRED (near-zero false
// positives); the broad inline-assignment heuristic trips on example/docs code, so it is ADVISORY
// and placeholder-filtered. A docs-heavy skills repo must not be blocked by `api_key="your-key"`.
{
  const REAL = [
    [/AKIA[0-9A-Z]{16}/, 'AWS access key id'],
    [/-----BEGIN (RSA|EC|OPENSSH|PGP|DSA) PRIVATE KEY-----/, 'private key block'],
    [/\bgh[pousr]_[A-Za-z0-9]{30,}/, 'GitHub token'],
    [/\bsk-(ant-)?[A-Za-z0-9]{24,}/, 'API secret key'],
    [/\bxox[baprs]-[A-Za-z0-9-]{12,}/, 'Slack token'],
  ];
  const INLINE = /\b(secret|password|passwd|api[_-]?key|token)\s*[:=]\s*['"]([^'"\n]{8,})['"]/i;
  const PLACEHOLDER = /your|example|placeholder|changeme|x{3,}|<.*>|\.\.\.|\$\{|process\.env|os\.environ|getenv|import\.meta|redacted|dummy|sample|test|fake|todo|abc123|0{4,}|here|insert|my[_-]?(key|token|secret)/i;
  let files = [];
  try { files = execSync('git ls-files', { cwd: dir, encoding: 'utf8' }).split('\n').filter(Boolean); }
  catch { files = []; }
  const real = [], heur = [];
  for (const f of files) {
    if (/\.(png|jpg|jpeg|gif|webp|ico|pdf|zip|gz|tgz|mp4|mov|woff2?|ttf|lock)$/i.test(f)) continue;
    const fp = path.join(dir, f);
    let txt = '';
    try { if (fs.statSync(fp).size < 512 * 1024) txt = fs.readFileSync(fp, 'utf8'); } catch { continue; }
    for (const [re, label] of REAL) if (re.test(txt)) { real.push(`${f}: ${label}`); break; }
    for (const ln of txt.split('\n')) { const m = ln.match(INLINE); if (m && !PLACEHOLDER.test(m[2])) { heur.push(`${f}: inline ${m[1].toLowerCase()}`); break; } }
  }
  add('secrets', real.length ? 'fail' : 'pass', real.length ? real.slice(0, 10).join(' · ') : `clean (${files.length} tracked files)`, true);
  add('secrets-heuristic', heur.length ? 'warn' : 'pass', heur.length ? `${heur.length} non-placeholder inline assignment(s): ` + heur.slice(0, 5).join(' · ') : 'no non-placeholder inline assignments', false);
}

// 3. lint / 4. typecheck / 5. tests — only when the project declares them
for (const [gate, script, fallback] of [
  ['lint', 'lint', null],
  ['typecheck', 'typecheck', has('tsconfig.json') ? 'npx --no-install tsc --noEmit' : null],
  ['tests', 'test', null],
]) {
  if (pkgScript(script)) {
    const r = run(`npm run --silent ${script}`, { required: true });
    add(gate, r.ok ? 'pass' : 'fail', r.ok ? `npm run ${script}: ok` : r.out.split('\n').slice(-6).join(' / '), true);
  } else if (fallback) {
    const r = run(fallback, { required: true });
    add(gate, r.ok ? 'pass' : 'fail', r.ok ? `${fallback}: ok` : r.out.split('\n').slice(-6).join(' / '), true);
  } else {
    add(gate, 'skip', `no ${script} script`, false);
  }
}

// 6. gitclean — advisory only
{
  let dirty = '';
  try { dirty = execSync('git status --porcelain', { cwd: dir, encoding: 'utf8' }).trim(); } catch {}
  add('gitclean', dirty ? 'warn' : 'pass', dirty ? `${dirty.split('\n').length} uncommitted path(s)` : 'clean tree', false);
}

const failed = gates.filter((g) => g.required && g.status === 'fail');
const shipOk = failed.length === 0;

if (asJson) {
  console.log(JSON.stringify({ dir, shipOk, failed: failed.map((g) => g.name), gates }, null, 2));
} else {
  console.log(`\n  Ship battery — ${path.basename(dir)}${warnOnly ? '  (warn-only)' : ''}\n  ${'-'.repeat(60)}`);
  const icon = { pass: '✓', fail: '✗', skip: '·', warn: '⚠' };
  for (const g of gates) console.log(`  ${icon[g.status] || '?'} ${g.name.padEnd(11)} ${g.status.padEnd(5)} ${g.required ? '' : '(advisory) '}${g.detail}`);
  console.log(`  ${'-'.repeat(60)}`);
  console.log(shipOk ? `  ✓ SHIP — ${gates.filter((g) => g.status === 'pass').length} gate(s) passed, 0 required failures`
                     : `  ✗ HOLD — ${failed.length} required gate(s) FAILED: ${failed.map((g) => g.name).join(', ')}  → do not ship; escalate to human`);
  console.log('');
}

process.exit(warnOnly ? 0 : shipOk ? 0 : 1);   // fail-CLOSED: required failure → non-zero
