// gpt-image.mjs — the brandmint wing's bridge to the gpt-image-2 skill's `scripts/gen.sh`.
//
// gpt-image-2 generates images through the user's ChatGPT subscription via codex (no per-image API
// spend). This adapter does NOT talk to codex itself — it just builds the argv for `bash <gen.sh> …`
// and shells out, so the brandmint flow can request on-brand renders the same way it calls the
// deterministic generators. Two surfaces, mirroring the wing's other adapters (comfyui.mjs):
//
//   buildGenArgs({skillDir,prompt,out,refs,timeoutSec}) -> argv[]   PURE: just the gen.sh argument
//                                                                    vector, in a fixed order. No
//                                                                    validation, no I/O.
//   makeGptImage({skillDir,runner}).generateImage({…})  -> {ok,out,code}   runner is injected (a
//                                                                    child_process.spawnSync-shaped
//                                                                    fn → { status }), so tests run
//                                                                    with a fake and nothing shells
//                                                                    out / calls codex.

// ── PURE: build the gen.sh argument vector ───────────────────────────────────────────────────────
// Order is load-bearing (the flow + tests read it positionally): the gen.sh path first, then
// --prompt/--out, then one --ref pair per reference image (in order), then --timeout-sec only when a
// timeout was supplied. Validation lives in generateImage, not here.
export function buildGenArgs({ skillDir, prompt, out, refs = [], timeoutSec }) {
  const argv = [`${skillDir}/scripts/gen.sh`, '--prompt', prompt, '--out', out];
  for (const r of refs) argv.push('--ref', r);
  if (timeoutSec != null) argv.push('--timeout-sec', String(timeoutSec));
  return argv;
}

// ── makeGptImage: bind a skillDir + an injected runner into a generateImage() ────────────────────
// generateImage validates its inputs (gen.sh would fail opaquely on a blank prompt/out, so we fail
// loud and early), builds the argv, runs it, and normalises spawnSync's { status } into a small
// result the flow can record: { ok, out, code }.
export function makeGptImage({ skillDir, runner }) {
  function generateImage({ prompt, out, refs = [], timeoutSec }) {
    if (!prompt || !String(prompt).trim()) throw new Error('gpt-image: prompt is required');
    if (!out || !String(out).trim()) throw new Error('gpt-image: out path is required');
    const argv = buildGenArgs({ skillDir, prompt, out, refs, timeoutSec });
    const { status } = runner(argv);
    return status === 0 ? { ok: true, out, code: 0 } : { ok: false, out, code: status };
  }
  return { generateImage };
}
