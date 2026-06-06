// taste-eval.mjs — #60: on-brand precision metric for taste-resolve.
//
// Given labelled cases and an INJECTED resolveFn (the taste brief generator), measure how often the
// brief lands on the expected aesthetic. A case "hits" when the brief's classification[axis] OR its
// suggested_cluster matches the expected value — the two handles taste-resolve hands the left brain.
//
// Pure: resolveFn is injected (no live NIM/LLM/corpus), so this is deterministic, offline measurement.
// resolveFn(request) → a taste brief shaped like taste-resolve.mjs emits:
//   { classification, suggested_cluster, exemplars, ... }

// evalTaste(cases, resolveFn, { axis }) → { precision, n, perCase: [{ request, expect, got, hit }] }.
//   cases    — [{ request, expect }]  (expect = the dominant axis value OR the suggested_cluster)
//   resolveFn(request) → brief        (injected; awaited per case)
//   axis     — which classification key to compare (default 'aesthetic_category')
export async function evalTaste(cases = [], resolveFn, { axis = 'aesthetic_category' } = {}) {
  const perCase = [];
  for (const { request, expect } of cases) {
    const brief = await resolveFn(request);
    const got = brief?.classification?.[axis] ?? null;          // the axis value the brief landed on
    const hit = got === expect || brief?.suggested_cluster === expect;
    perCase.push({ request, expect, got, hit });
  }
  const n = perCase.length;
  const hits = perCase.filter((c) => c.hit).length;
  const precision = n ? hits / n : 0;                            // no division by zero on empty cases
  return { precision, n, perCase };
}
