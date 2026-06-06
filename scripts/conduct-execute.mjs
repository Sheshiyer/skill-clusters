// conduct-execute.mjs — the generalized conductor execute loop (venture-agnostic).
//
// The HDILINT slice proved the pattern; this is it, extracted so ANY venture can run it:
//   resolve each spec-kit task → cluster (resolve-task)  →  inject the on-brand taste brief
//   (taste-resolve --brand X)  →  dispatch the resolved <cluster>-orchestrator  →  record.
//
// Everything is injected (resolveTask · tasteResolve · dispatch), so it's pure, testable orchestration
// with no hard-wired venture. The defaults shell out to the real CLIs; `dispatch` is environment-
// specific (the agent harness runs the cluster orchestrator), so callers inject it. Failures degrade,
// they don't abort the venture: an unresolved task is flagged + skipped, a taste-resolve failure
// dispatches with a null brief, a failed dispatch is recorded and the loop continues.

import { execFileSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(__dirname, '..');

// ── default deps (real integration) ────────────────────────────────────────────────────────────
async function defaultResolveTask(tasksPath, planPath) {
  const args = ['scripts/resolve-task.mjs', tasksPath, ...(planPath ? [planPath] : []), '--json'];
  return JSON.parse(execFileSync('node', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
}
async function defaultTasteResolve(request, brand) {
  const args = ['taste/scripts/taste-resolve.mjs', request, ...(brand ? ['--brand', brand] : []), '--json'];
  return JSON.parse(execFileSync('node', args, { cwd: REPO, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 }));
}
function defaultDispatch() {
  throw new Error('executePlan: inject a dispatch(task, cluster, brief) — it runs the resolved <cluster>-orchestrator');
}

// ── the four hard-gates (#89) ────────────────────────────────────────────────────────────────────
// A task is gated when it would do something IRREVERSIBLE. We detect the gate type from the task
// description and delegate the decision to an injected `gate(task, type)`. THE DEFAULT IS HOLD —
// every gated task waits (never auto-fires); the founder/Hermes approves to release it.
const GATES = [
  [/\b(deploy|publish|launch|go[- ]?live|ship to prod)/i, 'publish'],
  [/\b(outreach|outbound|cold[- ]?email|send (the )?(batch|email|campaign|outreach))/i, 'outbound'],
  [/\b(spend|charge|payment|\bpaid\b|render.*\blive\b|live render|purchase)/i, 'spend'],
  [/\b(brand|positioning|identity)\b.*(approv|sign[- ]?off|direction)/i, 'brand'],
];
export function gateOf(task) {
  const d = `${task.desc || ''}`;
  for (const [re, type] of GATES) if (re.test(d)) return type;
  return null;
}
const defaultGate = async () => ({ approved: false }); // safe default: hold every gated task

// ── executePlan ─────────────────────────────────────────────────────────────────────────────────
// { tasksPath, planPath?, brand } → { brand, tasks, results[], touched[], activate[], held[] }
//   opts.gate(task, type) → {approved}  (#89, default = hold)
//   opts.checkpoint { load:()=>id[], save:(id,record)=>void }  (#92, resume past completed tasks)
export async function executePlan({ tasksPath, planPath, brand = 'default' }, {
  resolveTask = defaultResolveTask,
  tasteResolve = defaultTasteResolve,
  dispatch = defaultDispatch,
  gate = defaultGate,
  checkpoint,
} = {}) {
  const resolution = await resolveTask(tasksPath, planPath);
  const plan = resolution.plan || [];
  const done = new Set(checkpoint ? (await checkpoint.load()) || [] : []);
  const results = [];
  const held = [];
  for (const task of plan) {
    if (done.has(task.id)) { results.push({ id: task.id, cluster: task.cluster, status: 'skipped' }); continue; } // #92 resume
    if (!task.cluster) { results.push({ id: task.id, desc: task.desc, status: 'unresolved' }); continue; }
    // #89 hard-gate: hold irreversible tasks unless explicitly approved
    const gateType = gateOf(task);
    if (gateType) {
      const g = await gate(task, gateType);
      if (!g?.approved) { results.push({ id: task.id, cluster: task.cluster, status: 'held', gate: gateType }); held.push(task.id); continue; }
    }
    // inject the on-brand taste brief; if taste is down, degrade to a null brief rather than abort
    let brief = null;
    try { brief = await tasteResolve(task.desc, brand); } catch { brief = null; }
    let out;
    try { out = await dispatch(task, task.cluster, brief); } catch (e) { out = { ok: false, error: e.message }; }
    const rec = { id: task.id, cluster: task.cluster, dispatch: task.dispatch, ...(out || {}), status: out?.ok ? 'built' : 'failed' };
    results.push(rec);
    if (checkpoint && rec.status === 'built') await checkpoint.save(task.id, rec); // #92 checkpoint after a build
  }
  const touched = [...new Set(results.map((r) => r.cluster).filter(Boolean))];
  const activate = [...new Set(plan.filter((t) => t.activate && t.cluster).map((t) => t.cluster))];
  return { brand, tasks: plan.length, results, touched, activate, held };
}

// ── CLI: dry-run preview (resolve + brief per task; no real dispatch) ──────────────────────────────
//   node scripts/conduct-execute.mjs <tasks.md> [plan.md] --brand <brand>
async function main() {
  const argv = process.argv.slice(2);
  const arg = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : undefined; };
  const positionals = argv.filter((a, i) => !a.startsWith('--') && argv[i - 1] !== '--brand');
  const tasksPath = positionals[0];
  const planPath = positionals[1];
  const brand = arg('--brand') || 'default';
  if (!tasksPath) { console.error('usage: conduct-execute.mjs <tasks.md> [plan.md] --brand <brand>'); process.exit(2); }

  // dry-run dispatch: don't build, just show what WOULD be dispatched with which on-brand brief
  const out = await executePlan({ tasksPath, planPath, brand }, {
    dispatch: async (task, cluster, brief) => ({ ok: true, dryRun: true, directive: brief?.directive || null }),
  });
  console.log(`\n  Conductor dry-run — brand: ${brand}  (${out.tasks} tasks)\n  ${'-'.repeat(66)}`);
  for (const r of out.results) {
    if (r.status === 'unresolved') { console.log(`  ${(r.id || '').padEnd(5)} ⚠ UNRESOLVED  ${(r.desc || '').slice(0, 44)}`); continue; }
    console.log(`  ${(r.id || '').padEnd(5)} → ${(r.dispatch || r.cluster).padEnd(28)}`);
    if (r.directive) console.log(`        brief: ${r.directive.slice(0, 72)}`);
  }
  console.log(`  ${'-'.repeat(66)}`);
  console.log(`  clusters: ${out.touched.join(', ') || 'none'}`);
  if (out.activate.length) console.log(`  ◆ activate first: ${out.activate.join(', ')}`);
  console.log('');
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) main();
