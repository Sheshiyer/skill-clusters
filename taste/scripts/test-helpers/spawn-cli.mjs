// spawn-cli.mjs — shared helper for SUBPROCESS CLI tests.
//
// CLIs in this tree call process.exit() in main(), so they can't be exercised in-process — a test must
// spawn them and inspect the exit code + captured streams. This centralizes that one line of wiring so
// every CLI test file (kit-register, and future brandmint / kit-qa / pack tests) shares it instead of
// re-deriving spawnSync('node', …) per file.
//
//   spawnCli(scriptPath, args = [], opts = {}) -> { status, stdout, stderr, ... }   // spawnSync result
//
// stdout/stderr come back as strings (encoding: 'utf8'); `status` is the exit code. Pass opts to
// override (e.g. cwd, env, input). Zero dependencies: node:child_process only.

import { spawnSync } from 'node:child_process';

export function spawnCli(scriptPath, args = [], opts = {}) {
  return spawnSync('node', [scriptPath, ...args], { encoding: 'utf8', ...opts });
}
