// comfyui.mjs — ComfyUI API client for the Qwen-Image-Edit VIRTUAL TRY-ON backend (AWS GPU).
//
// The Fitcheck render feature is NOT generic text-to-image — it's garment-on-body try-on via a
// dedicated model: Qwen-Image-Edit + the FoxBaze Try-On LoRA, run through ComfyUI on a GPU box.
// This client drives that backend's HTTP API: upload the subject + garment images, inject them into
// the provided try-on workflow, submit it, poll for completion, and return the rendered image.
//
// Config (env): COMFYUI_URL (the AWS-hosted ComfyUI, e.g. http://<host>:8188), COMFYUI_TOKEN (optional
// bearer if fronted by an auth proxy), COMFYUI_TRYON_WORKFLOW (path to TryOn-Alpha-Workflow.json).
// Everything is injectable (baseUrl, fetchImpl) so it's unit-testable with no live backend.

import './load-env.mjs';

const BASE = () => (process.env.COMFYUI_URL || 'http://localhost:8188').replace(/\/$/, '');
const TOKEN = () => process.env.COMFYUI_TOKEN || '';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── PURE: route uploaded filenames + the prompt into the workflow's titled nodes ─────────────────
// The try-on workflow has LoadImage nodes titled like "subject"/"model" and "garment"/"product",
// plus a text node titled "prompt". We deep-copy and set those inputs — template stays untouched.
export function injectWorkflow(workflow, { subject, garments = [], prompt } = {}) {
  const wf = JSON.parse(JSON.stringify(workflow));
  let gi = 0;
  for (const node of Object.values(wf)) {
    const title = (node._meta?.title || '').toLowerCase();
    if (node.class_type === 'LoadImage' && node.inputs) {
      if (/subject|model|person|\btop\b/.test(title)) node.inputs.image = subject;
      else if (/garment|cloth|product|\bbottom\b/.test(title)) node.inputs.image = garments[gi++] ?? garments[0] ?? node.inputs.image;
    }
    if (node.inputs && typeof node.inputs.text === 'string' && /prompt|text|style/.test(title) && prompt) {
      node.inputs.text = prompt;
    }
  }
  return wf;
}

// resolve an image ref → raw bytes. data-URI decoded directly; http(s) fetched; bare name passed through.
async function refToBytes(ref, fetchImpl) {
  if (typeof ref !== 'string') return null;
  const m = ref.match(/^data:([^;]+);base64,(.*)$/);
  if (m) return { bytes: Buffer.from(m[2], 'base64'), mime: m[1] };
  if (/^https?:\/\//.test(ref)) {
    const r = await fetchImpl(ref);
    if (!r.ok) throw new Error(`comfyui: fetch ref ${r.status}`);
    return { bytes: Buffer.from(await r.arrayBuffer()), mime: 'image/png' };
  }
  return null; // already a ComfyUI-side filename
}

async function uploadImage(ref, { baseUrl, auth, fetchImpl }) {
  const got = await refToBytes(ref, fetchImpl);
  if (!got) return ref; // already an uploaded filename
  const fd = new FormData();
  fd.append('image', new Blob([got.bytes], { type: got.mime }), 'fitcheck.png');
  fd.append('overwrite', 'true');
  const r = await fetchImpl(`${baseUrl}/upload/image`, { method: 'POST', headers: { ...auth }, body: fd });
  if (!r.ok) throw new Error(`comfyui upload ${r.status}`);
  const j = await r.json();
  return j.subfolder ? `${j.subfolder}/${j.name}` : j.name;
}

// ── tryOn: the end-to-end render ──────────────────────────────────────────────────────────────────
// { subject, garments[], prompt, workflow } → { status:'rendered', imageBase64, meta }. Throws on
// timeout or a ComfyUI execution error (never a silent empty render — the caller's fallback handles it).
export async function tryOn({ subject, garments = [], prompt, workflow }, {
  baseUrl = BASE(), token = TOKEN(), fetchImpl = fetch, pollMs = 1500, timeoutMs = 120000,
} = {}) {
  if (!workflow) throw new Error('comfyui tryOn: a workflow template is required');
  const auth = token ? { Authorization: `Bearer ${token}` } : {};

  // 1. upload the subject + every garment
  const subjName = await uploadImage(subject, { baseUrl, auth, fetchImpl });
  const garNames = [];
  for (const g of garments) garNames.push(await uploadImage(g, { baseUrl, auth, fetchImpl }));

  // 2. inject + submit the workflow
  const wf = injectWorkflow(workflow, { subject: subjName, garments: garNames, prompt });
  const subRes = await fetchImpl(`${baseUrl}/prompt`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...auth }, body: JSON.stringify({ prompt: wf }),
  });
  if (!subRes.ok) throw new Error(`comfyui prompt ${subRes.status}: ${(await subRes.text()).slice(0, 200)}`);
  const promptId = (await subRes.json()).prompt_id;
  if (!promptId) throw new Error('comfyui: no prompt_id returned');

  // 3. poll /history until the prompt completes
  const deadline = Date.now() + timeoutMs;
  let output = null;
  while (Date.now() < deadline) {
    const h = await (await fetchImpl(`${baseUrl}/history/${promptId}`, { headers: { ...auth } })).json();
    const rec = h[promptId];
    if (rec?.status?.completed) {
      if (rec.status.status_str === 'error') throw new Error('comfyui: workflow execution error');
      const imgs = Object.values(rec.outputs || {}).flatMap((o) => o.images || []);
      output = imgs[0] || null;
      break;
    }
    await sleep(pollMs);
  }
  if (!output) throw new Error('comfyui: no output image (timeout or empty result)');

  // 4. fetch the rendered image bytes
  const q = new URLSearchParams({ filename: output.filename, subfolder: output.subfolder || '', type: output.type || 'output' });
  const v = await fetchImpl(`${baseUrl}/view?${q}`, { headers: { ...auth } });
  if (!v.ok) throw new Error(`comfyui view ${v.status}`);
  const imageBase64 = Buffer.from(await v.arrayBuffer()).toString('base64');
  return { status: 'rendered', imageBase64, meta: { promptId, filename: output.filename } };
}

export const baseUrl = BASE;
export const hasBackend = () => !!process.env.COMFYUI_URL;
