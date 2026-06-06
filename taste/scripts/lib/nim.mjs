// nim.mjs — multi-key NVIDIA NIM client (hosted integrate.api.nvidia.com, OpenAI-compatible).
//
// Uses a POOL of keys, round-robin per call so no single account is overloaded, with failover on
// 429 / 5xx to the next key. Primary is NVIDIA_NIM_API_KEY; NVIDIA_API_KEY (and any NIM_KEYS list)
// are additional lanes. Models are env-overridable so swapping the embedder/VLM is a one-line change.
//
// PRODUCTIZABLE: the pool is just env vars, so a Cloudflare Worker injects them from KV secrets in
// prod (see taste/PRODUCTION.md). Nothing here is hard-coded to a single account.

import './load-env.mjs';   // populate keys from the repo .env + home env files (in-process, never shell-sourced)

// Endpoint: both NVIDIA accounts use integrate.api.nvidia.com. The repo .env's NVIDIA_NIM_API_URL
// (api.nvidia.com/nim/v1) is NOT a real endpoint — only honor a configured URL if it's an integrate host.
const cfg = process.env.NIM_BASE_URL || (/integrate\.api\.nvidia\.com/.test(process.env.NVIDIA_NIM_API_URL || '') ? process.env.NVIDIA_NIM_API_URL : '');
const BASE = (cfg || 'https://integrate.api.nvidia.com/v1').replace(/\/$/, '');

// Key pool — primary first, deduped. NIM_KEYS (comma-separated env var NAMES) overrides the default order.
const POOL = [...new Set((process.env.NIM_KEYS
  ? process.env.NIM_KEYS.split(',').map((n) => process.env[n.trim()])
  : [process.env.NVIDIA_NIM_API_KEY, process.env.NVIDIA_API_KEY, process.env.NIM_API_KEY]
).filter(Boolean))];

let rr = 0;
export const hasKey = () => POOL.length > 0;
export const keyCount = () => POOL.length;
export const baseUrl = () => BASE;

async function post(path, body) {
  if (!POOL.length) throw new Error('no NVIDIA key — set NVIDIA_NIM_API_KEY (or NVIDIA_API_KEY) in .env');
  let lastErr;
  for (let attempt = 0; attempt < POOL.length; attempt++) {
    const key = POOL[(rr++) % POOL.length];                 // round-robin across calls + failover within a call
    let res;
    try {
      res = await fetch(BASE + path, { method: 'POST', headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(body) });
    } catch (e) { lastErr = e; continue; }                  // network error → try the next key
    if (res.ok) return res.json();
    const text = (await res.text()).slice(0, 240);
    // only fail over on rate-limit / server errors; a 4xx (bad input) won't be fixed by another key
    if (res.status === 429 || res.status >= 500) { lastErr = new Error(`NIM ${res.status}: ${text}`); continue; }
    throw new Error(`NIM ${res.status}: ${text}`);
  }
  throw lastErr || new Error('NIM: all keys failed');
}

// VLM auto-annotation → the structured taste schema (the aesthetic vocabulary the tags lack).
const TASTE_KEYS = ['aesthetic_category', 'mood', 'motion_language', 'color_story', 'type_voice', 'density', 'composition', 'era'];
export async function vlmAnnotate(imageBuf, mime = 'image/jpeg', { model = process.env.NIM_VLM_MODEL || 'meta/llama-3.2-90b-vision-instruct', fallback = process.env.NIM_VLM_FALLBACK || 'meta/llama-3.2-11b-vision-instruct' } = {}) {
  const b64 = imageBuf.toString('base64');
  const prompt = `You are a senior art director analyzing a web-design preview. Return ONLY a compact JSON object (no markdown, no prose) with EXACTLY these keys: ${TASTE_KEYS.join(', ')}. Each value is a short, specific phrase (2-6 words) describing that aesthetic dimension of the design shown.`;
  const call = async (m) => {
    const out = await post('/chat/completions', {
      model: m,
      messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } }] }],
      max_tokens: 320, temperature: 0.2,
    });
    const txt = out.choices?.[0]?.message?.content || '';
    const json = txt.match(/\{[\s\S]*\}/)?.[0];
    try { return json ? JSON.parse(json) : { _raw: txt }; } catch { return { _raw: txt }; }
  };
  // model-fallback: the 90B occasionally 500s on a specific image the 11B handles fine (a different
  // axis from the key-failover in post() — that's for rate-limits, this is per-image model failures).
  try { return await call(model); }
  catch (e) { if (fallback && fallback !== model) return call(fallback); throw e; }
}

// Text embeddings. input_type: 'passage' to index, 'query' to search. nv-embedqa caps at 512 tokens.
export async function embedText(input, { model = process.env.NIM_EMBED_MODEL || 'nvidia/nv-embedqa-e5-v5', inputType = 'passage', maxChars = 900 } = {}) {
  // token-dense text runs ~0.46 tok/char, so 900 chars (~410 tokens) stays safely under the 512 cap
  const arr = (Array.isArray(input) ? input : [input]).map((s) => String(s).slice(0, maxChars));
  const out = await post('/embeddings', { model, input: arr, input_type: inputType, encoding_format: 'float' });
  return out.data.map((d) => d.embedding);
}

// Multi-modal image embedding via NV-CLIP (shares a space with embedText for cross-modal retrieval).
export async function embedImage(imageBuf, mime = 'image/jpeg', { model = process.env.NIM_CLIP_MODEL || 'nvidia/nvclip' } = {}) {
  const url = `data:${mime};base64,${imageBuf.toString('base64')}`;
  const out = await post('/embeddings', { model, input: [url], encoding_format: 'float' });
  return out.data[0].embedding;
}

export const TASTE_SCHEMA_KEYS = TASTE_KEYS;
