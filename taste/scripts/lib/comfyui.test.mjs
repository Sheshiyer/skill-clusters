// comfyui.test.mjs — the ComfyUI Qwen-Edit try-on client. Run: node --test
// Mocks the ComfyUI HTTP API (upload → prompt → history → view); no live backend needed.

import { test } from 'node:test';
import assert from 'node:assert';
import { injectWorkflow, tryOn } from './comfyui.mjs';

// minimal workflow shaped like a ComfyUI graph: titled LoadImage nodes + a prompt + a SaveImage
const WORKFLOW = {
  '10': { class_type: 'LoadImage', inputs: { image: 'PLACEHOLDER' }, _meta: { title: 'subject' } },
  '11': { class_type: 'LoadImage', inputs: { image: 'PLACEHOLDER' }, _meta: { title: 'garment' } },
  '20': { class_type: 'CLIPTextEncode', inputs: { text: 'PLACEHOLDER' }, _meta: { title: 'prompt' } },
  '30': { class_type: 'SaveImage', inputs: { images: ['x', 0] }, _meta: { title: 'output' } },
};

const jsonRes = (obj) => ({ ok: true, status: 200, json: async () => obj, text: async () => JSON.stringify(obj) });

test('injectWorkflow: routes subject + garment filenames + prompt into the titled nodes', () => {
  const wf = injectWorkflow(WORKFLOW, { subject: 'subj.png', garments: ['g1.png'], prompt: 'style the woman in the top' });
  assert.equal(wf['10'].inputs.image, 'subj.png', 'subject node');
  assert.equal(wf['11'].inputs.image, 'g1.png', 'garment node');
  assert.match(wf['20'].inputs.text, /style the woman/, 'prompt node');
  // pure: original template untouched
  assert.equal(WORKFLOW['10'].inputs.image, 'PLACEHOLDER');
});

test('tryOn: uploads images, submits the workflow, polls history, returns the output image', async () => {
  const calls = [];
  const mockFetch = async (url, opts = {}) => {
    calls.push(`${opts.method || 'GET'} ${url}`);
    if (url.includes('/upload/image')) return jsonRes({ name: 'up.png', subfolder: '', type: 'input' });
    if (url.endsWith('/prompt')) return jsonRes({ prompt_id: 'PID' });
    if (url.includes('/history/PID')) return jsonRes({ PID: { status: { completed: true }, outputs: { '30': { images: [{ filename: 'out.png', subfolder: '', type: 'output' }] } } } });
    if (url.includes('/view')) return { ok: true, status: 200, arrayBuffer: async () => new TextEncoder().encode('IMGBYTES').buffer };
    throw new Error('unexpected ' + url);
  };
  const out = await tryOn(
    { subject: 'data:image/png;base64,AAAA', garments: ['data:image/png;base64,BBBB'], prompt: 'style', workflow: WORKFLOW },
    { baseUrl: 'http://comfy:8188', fetchImpl: mockFetch, pollMs: 1 },
  );
  assert.equal(out.status, 'rendered');
  assert.ok(out.imageBase64 && out.imageBase64.length, 'returns the rendered image (base64)');
  assert.ok(calls.some((c) => c.includes('/upload/image')), 'uploaded an image');
  assert.ok(calls.some((c) => c.startsWith('POST') && c.endsWith('/prompt')), 'submitted the workflow');
  assert.ok(calls.some((c) => c.includes('/view?')), 'fetched the output');
});

test('tryOn: a ComfyUI execution error surfaces (not a silent empty render)', async () => {
  const mockFetch = async (url) => {
    if (url.includes('/upload/image')) return jsonRes({ name: 'up.png' });
    if (url.endsWith('/prompt')) return jsonRes({ prompt_id: 'PID' });
    if (url.includes('/history/PID')) return jsonRes({ PID: { status: { completed: true, status_str: 'error' }, outputs: {} } });
    return jsonRes({});
  };
  await assert.rejects(
    () => tryOn({ subject: 'x', garments: ['y'], prompt: 'p', workflow: WORKFLOW }, { baseUrl: 'http://c', fetchImpl: mockFetch, pollMs: 1 }),
    /no output|error/i,
  );
});
