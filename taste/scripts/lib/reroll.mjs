// reroll.mjs (lib) — the AUTO-REROLL closed loop: regenerate renders until they're on-brand.
//
//   rerollImages({ descriptors, generateImage, scoreImage, scoreOf, threshold, maxAttempts, log })
//     -> [ { name, file, out, attempts, bestScore, onBrand, ok } ]   // one result per descriptor
//
// WHY: gpt-image-2 renders are non-deterministic — a single pass can come back off-palette. brandmint
// plans the on-brand prompts (planImageArtifacts) and kit-qa MEASURES how on-palette a render is
// (scorePalette → coverage). This module joins the two into an autonomous quality gate: for each
// descriptor it GENERATES, SCORES, and — while the score is below threshold — REGENERATES up to
// maxAttempts, keeping the BEST-scoring attempt. It stops the instant an attempt clears threshold, so
// it spends the minimum number of (paid-sub) generations to get an on-brand render.
//
// PURE except via injected I/O — generateImage / scoreImage / log are all passed in, so the loop is
// unit-testable with fakes: nothing shells out to codex, nothing reads a PNG, nothing touches disk.
// The CLI (brandmint-reroll.mjs) supplies the REAL generateImage (makeGptImage) and the REAL
// scoreImage (read → decodePng → scorePalette). The default scoreOf reads the kit-qa `coverage`
// field; pass a custom scoreOf to gate on a different metric (e.g. accentPresence).
//
// SEMANTICS (the contract):
//   attempts  = number of generate attempts ACTUALLY made (a passing first attempt = 1, not maxAttempts)
//   bestScore = the highest scoreOf(...) seen across the attempts made (−Infinity if none scored)
//   onBrand   = bestScore >= threshold
//   ok        = true if ANY attempt returned { ok: true } (a failed generate is NOT scored but still
//               counts as an attempt — there is no render to read)

// ── rerollImages (PURE via injected generateImage/scoreImage/log) ────────────────────────────────
export function rerollImages({
  descriptors,
  generateImage,
  scoreImage,
  scoreOf = (s) => s.coverage,
  threshold = 0.12,
  maxAttempts = 2,
  log = () => {},
}) {
  const results = [];

  for (const d of descriptors) {
    const out = d.out || d.file;
    let attempts = 0;
    let bestScore = -Infinity;
    let ok = false;

    for (let i = 0; i < maxAttempts; i++) {
      attempts++;
      const res = generateImage({ prompt: d.prompt, out, refs: d.refs });

      if (res && res.ok) {
        ok = true;
        const s = scoreOf(scoreImage(out)); // score the render we asked for at `out`
        if (s > bestScore) bestScore = s;
        log(`  ${d.name} · attempt ${attempts}: ${s.toFixed(3)}${s >= threshold ? ' ✓ on-brand' : ''}`);
        if (s >= threshold) break; // on-brand — no need to reroll
      } else {
        log(`  ${d.name} · attempt ${attempts}: generate failed (code ${res?.code ?? 'n/a'})`);
      }
    }

    const onBrand = bestScore >= threshold;
    results.push({ name: d.name, file: d.file, out, attempts, bestScore, onBrand, ok });
    log(`  ${d.name} → best ${bestScore === -Infinity ? 'n/a' : bestScore.toFixed(3)} · ${onBrand ? 'on-brand' : 'off-brand'} · ${attempts} attempt(s)`);
  }

  return results;
}
