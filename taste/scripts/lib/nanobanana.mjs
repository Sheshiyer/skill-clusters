// nanobanana.mjs — the brandmint wing's bridge to the nanobanana skill's `scripts/generate.py`.
//
// Nano Banana Pro = Google's Gemini 3 Pro Image (`gemini-3-pro-image-preview`) via the `google-genai`
// Python package; it authenticates with the GEMINI_API_KEY the RUNNER carries in its env. This adapter
// does NOT talk to Gemini itself — it builds the argv for `python3 <generate.py> …` and shells out,
// exactly like gpt-image.mjs wraps gen.sh, so the brandmint flow can pick its render backend by swapping
// the injected generateImage. Unlike gpt-image-2 (ChatGPT session, no key), this lane uses a real API
// key and supports image EDITING (`-i`), 2K/4K (`-s`) and aspect ratios (`-r`).
//
//   buildNanoArgs({scriptPath,prompt,out,refs,size,ratio}) -> argv[]   PURE: the generate.py argument
//                                                                      vector. PROMPT is positional;
//                                                                      -i takes the FIRST ref (the skill
//                                                                      edits from a single input image).
//   makeNanoBanana({scriptPath,runner}).generateImage({…}) -> {ok,out,code}   runner is injected (a
//                                                                      child_process.spawnSync-shaped
//                                                                      fn → { status }); the CLI's real
//                                                                      runner spawns python3 with
//                                                                      GEMINI_API_KEY inherited from env.
//
// Zero dependencies: node: builtins only (the heavy lifting is in the Python skill).

// ── PURE: build the generate.py argument vector ──────────────────────────────────────────────────
// Order: the script path, then the PROMPT as the trailing positional generate.py expects, then -o out,
// then -i <ref> (first ref only — the skill's image-edit input is single), then -s/-r when supplied.
export function buildNanoArgs({ scriptPath, prompt, out, refs = [], size, ratio }) {
  const argv = [scriptPath, prompt, '-o', out];
  if (refs[0]) argv.push('-i', refs[0]);
  if (size) argv.push('-s', size);
  if (ratio) argv.push('-r', ratio);
  return argv;
}

// ── makeNanoBanana: bind a scriptPath + an injected runner into a generateImage() ────────────────
// Mirrors makeGptImage: validate (generate.py fails opaquely on a blank prompt/out), build the argv,
// run it, normalise spawnSync's { status } into { ok, out, code }. The runner is responsible for having
// GEMINI_API_KEY in its environment.
export function makeNanoBanana({ scriptPath, runner }) {
  function generateImage({ prompt, out, refs = [], size, ratio }) {
    if (!prompt || !String(prompt).trim()) throw new Error('nanobanana: prompt is required');
    if (!out || !String(out).trim()) throw new Error('nanobanana: out path is required');
    const argv = buildNanoArgs({ scriptPath, prompt, out, refs, size, ratio });
    const { status } = runner(argv);
    return status === 0 ? { ok: true, out, code: 0 } : { ok: false, out, code: status };
  }
  return { generateImage };
}
