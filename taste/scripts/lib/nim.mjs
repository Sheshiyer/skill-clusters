// nim.mjs — swappable NVIDIA NIM client (hosted build.nvidia.com / integrate.api.nvidia.com).
//
// The ONLY thing gating VLM enrichment + multi-modal embeddings is the API key. Set one of
// NVIDIA_API_KEY / NIM_API_KEY in the env (or a .env the caller loads) and these activate.
// Models are env-overridable so swapping the embedder/VLM is a one-line change (Tier-B requirement).

const BASE = process.env.NIM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
const KEY = () => process.env.NVIDIA_API_KEY || process.env.NIM_API_KEY || null;
export const hasKey = () => !!KEY();

async function post(path, body) {
  const key = KEY();
  if (!key) throw new Error('NVIDIA_API_KEY not set');
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`NIM ${res.status}: ${(await res.text()).slice(0, 240)}`);
  return res.json();
}

// VLM auto-annotation → the structured taste schema (the aesthetic vocabulary the tags lack).
const TASTE_KEYS = ['aesthetic_category', 'mood', 'motion_language', 'color_story', 'type_voice', 'density', 'composition', 'era'];
export async function vlmAnnotate(imageBuf, mime = 'image/jpeg', { model = process.env.NIM_VLM_MODEL || 'meta/llama-3.2-90b-vision-instruct' } = {}) {
  const b64 = imageBuf.toString('base64');
  const prompt = `You are a senior art director analyzing a web-design preview. Return ONLY a compact JSON object (no markdown, no prose) with EXACTLY these keys: ${TASTE_KEYS.join(', ')}. Each value is a short, specific phrase (2-6 words) describing that aesthetic dimension of the design shown.`;
  const out = await post('/chat/completions', {
    model,
    messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:${mime};base64,${b64}` } }] }],
    max_tokens: 320, temperature: 0.2,
  });
  const txt = out.choices?.[0]?.message?.content || '';
  const json = txt.match(/\{[\s\S]*\}/)?.[0];
  try { return json ? JSON.parse(json) : { _raw: txt }; } catch { return { _raw: txt }; }
}

// Text embeddings (e.g. nv-embedqa-e5-v5 / llama-3.2-nv-embedqa). input_type: 'passage' to index, 'query' to search.
export async function embedText(input, { model = process.env.NIM_EMBED_MODEL || 'nvidia/nv-embedqa-e5-v5', inputType = 'passage' } = {}) {
  const out = await post('/embeddings', { model, input: Array.isArray(input) ? input : [input], input_type: inputType, encoding_format: 'float' });
  return out.data.map((d) => d.embedding);
}

// Multi-modal image embedding via NV-CLIP (shares a space with embedText for cross-modal retrieval).
export async function embedImage(imageBuf, mime = 'image/jpeg', { model = process.env.NIM_CLIP_MODEL || 'nvidia/nvclip' } = {}) {
  const url = `data:${mime};base64,${imageBuf.toString('base64')}`;
  const out = await post('/embeddings', { model, input: [url], encoding_format: 'float' });
  return out.data[0].embedding;
}

export const TASTE_SCHEMA_KEYS = TASTE_KEYS;
