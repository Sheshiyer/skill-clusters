# Fitcheck try-on render backend — AWS deployment

The VTO engine = **ComfyUI + Qwen-Image-Edit + the FoxBaze try-on LoRA** on an AWS GPU box.
`taste/scripts/lib/comfyui.mjs` (the adapter) drives its HTTP API; `render.mjs` routes the `tryon`
lane to it. The adapter is **built + tested + gated** — it stays inert until `COMFYUI_URL` +
`COMFYUI_TRYON_WORKFLOW` are set, so nothing spends GPU by accident.

## The pipeline (already wired)
```
renderTryOn({productImage: garment, body: subject})  →  generate('tryon')  →  comfyui adapter
   →  upload images → inject TryOn-Alpha-Workflow.json → POST /prompt → poll → /view → image
   ↑ idempotency-keyed (one render per identical request) · governor-metered (cost 8) · graceful fallback
```

## Instance options (us-east-1, on-demand)
| Instance | GPU | VRAM | ~$/hr | Fit for Qwen-Image-Edit |
|---|---|---|---|---|
| **g6e.xlarge** (recommended) | L40S | 48 GB | ~$1.86 | comfortable, headroom for full quality |
| g5.xlarge (budget) | A10G | 24 GB | ~$1.01 | works with the fp8 model |
| g6.xlarge (cheapest) | L4 | 24 GB | ~$0.80 | works with fp8; slower |

- **Storage:** ~150 GB gp3 EBS (the models are ~30 GB) — ~$12/mo.
- **AMI:** *Deep Learning OSS Nvidia Driver AMI (Ubuntu 22.04)* — CUDA + drivers preinstalled.
- **Render time:** ~20–60 s per try-on (30 steps @ 832×1248).

## Cost control — this is the key decision
A GPU instance is **~$0.80–1.86/hr while RUNNING**. Two modes:
- **On-demand (recommended):** keep it **stopped** ($0 compute, ~$12/mo for the disk); `aws ec2
  start-instances` before a render batch, `stop-instances` after. Best for pilots/demos.
- **Always-on:** ~$600–1340/mo. Only once there's live shopper traffic.

## Security
- ComfyUI listens on **127.0.0.1** only; a Caddy proxy on :8443 requires the `COMFYUI_TOKEN` bearer.
- Security group: open **:8443 to your IP / the agent host only** (not 0.0.0.0).

## Launch steps (run on approval)
1. `aws ec2 run-instances` — g6e.xlarge, the DLAMI, 150 GB gp3, the locked-down SG, an SSH key.
2. SSH in → `HF_TOKEN=… COMFYUI_TOKEN=… bash setup-comfyui.sh` (~15–25 min: deps + ~30 GB model pulls).
3. Locally set `COMFYUI_URL=https://<host>:8443`, `COMFYUI_TOKEN=…`, `COMFYUI_TRYON_WORKFLOW=…/TryOn-Alpha-Workflow.json`.
4. **#17 — fire one real try-on** behind the spend gate: a Fitcheck garment + a subject → a real render.
5. `aws ec2 stop-instances` when done.

## 🚦 Spend gate (needs founder approval before step 1)
- A **HuggingFace read token** (`HF_TOKEN`) — Qwen-Image-Edit + the LoRA are large/gated.
- Approval of the **instance type** (→ the $/hr) and the **on-demand vs always-on** mode.
- Confirmation that an **AWS GPU quota** (vCPU for G instances) is available in the region (new accounts often need a quota-increase request first).
