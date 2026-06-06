#!/usr/bin/env node
// put-secrets.mjs — load the NVIDIA keys (from env/.env) + a generated proxy token into the
// TASTE_SECRETS KV namespace, WITHOUT ever printing a value. Idempotent. Run from anywhere.
//
//   node taste/worker/put-secrets.mjs

import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import '../scripts/lib/load-env.mjs';   // populate NVIDIA_* from the repo .env + home env files

const NS = 'cad55b37e92546b8afd567a375423b61';   // TASTE_SECRETS
const here = path.dirname(fileURLToPath(import.meta.url));
const proxyEnv = path.join(here, '.proxy.env');

function putKV(name, value) {
  if (!value) { console.log(`  · ${name}: (no value in env — skipped)`); return; }
  const tmp = path.join(os.tmpdir(), `kv-${name}-${process.pid}`);
  fs.writeFileSync(tmp, value, { mode: 0o600 });
  try {
    execSync(`wrangler kv key put --namespace-id ${NS} ${name} --path ${JSON.stringify(tmp)} --remote`, { cwd: here, stdio: ['ignore', 'ignore', 'pipe'] });
    console.log(`  ✓ ${name}  (len ${value.length})`);
  } catch (e) { console.log(`  ✗ ${name}: ${String(e.stderr || e).slice(0, 140)}`); }
  finally { fs.rmSync(tmp, { force: true }); }
}

// reuse an existing proxy token (keep KV + local in sync across re-runs), else generate one
const existing = fs.existsSync(proxyEnv) ? (fs.readFileSync(proxyEnv, 'utf8').match(/NIM_PROXY_TOKEN=(\S+)/) || [])[1] : null;
const token = existing || crypto.randomBytes(24).toString('hex');

console.log('\n  putting taste secrets into KV (TASTE_SECRETS) — values never printed\n  ' + '-'.repeat(54));
putKV('nvidia_nim_primary', process.env.NVIDIA_NIM_API_KEY);
putKV('nvidia_nim_secondary', process.env.NVIDIA_API_KEY);
putKV('proxy_token', token);
if (process.env.INFERENCE_SH_API_KEY) putKV('inference_sh', process.env.INFERENCE_SH_API_KEY);

if (!existing) fs.appendFileSync(proxyEnv, `NIM_PROXY_TOKEN=${token}\n`, { mode: 0o600 });
console.log(`  ${'-'.repeat(54)}\n  proxy token → taste/worker/.proxy.env (git-ignored). After deploy, append NIM_PROXY_URL there.\n`);
