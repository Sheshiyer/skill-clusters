#!/usr/bin/env bash
# setup-comfyui.sh — provision a ComfyUI + Qwen-Image-Edit VIRTUAL TRY-ON backend on an AWS GPU box.
#
# Run as the default user on an AWS "Deep Learning OSS Nvidia Driver AMI (Ubuntu 22.04)" instance
# (CUDA + drivers preinstalled). Idempotent-ish; re-runs skip existing downloads.
#
#   HF_TOKEN=hf_xxx COMFYUI_TOKEN=<bearer> bash setup-comfyui.sh
#
# Model: Qwen-Image-Edit (Comfy-Org repackaged, fp8 — fits 24GB; comfortable on 48GB) + the FoxBaze
# Try-On LoRA. Exposes ComfyUI on 127.0.0.1:8188 behind a Caddy reverse proxy that requires a bearer
# token (so the box is not an open ComfyUI on the internet).
set -euo pipefail

: "${HF_TOKEN:?set HF_TOKEN (a HuggingFace read token) — Qwen-Image-Edit + the LoRA are gated/large}"
: "${COMFYUI_TOKEN:?set COMFYUI_TOKEN (the bearer the adapter will send)}"
COMFY="$HOME/ComfyUI"
PY="$COMFY/venv/bin/python"

echo "── 1. system deps ───────────────────────────────────────────────"
sudo apt-get update -y && sudo apt-get install -y git python3-venv python3-pip aria2 caddy

echo "── 2. ComfyUI + venv + torch (CUDA) ─────────────────────────────"
[ -d "$COMFY" ] || git clone --depth 1 https://github.com/comfyanonymous/ComfyUI "$COMFY"
[ -x "$PY" ] || python3 -m venv "$COMFY/venv"
"$PY" -m pip install --upgrade pip wheel
"$PY" -m pip install torch torchvision --index-url https://download.pytorch.org/whl/cu124
"$PY" -m pip install -r "$COMFY/requirements.txt"
# ComfyUI-Manager (resolves any custom nodes the workflow needs)
[ -d "$COMFY/custom_nodes/ComfyUI-Manager" ] || git clone --depth 1 https://github.com/ltdrdata/ComfyUI-Manager "$COMFY/custom_nodes/ComfyUI-Manager"

echo "── 3. models — Qwen-Image-Edit (fp8) + try-on LoRA + workflow ────"
dl(){ aria2c -x4 -s4 --continue=true --header="Authorization: Bearer $HF_TOKEN" -d "$1" -o "$2" "$3"; }
HF="https://huggingface.co"
# diffusion model · text encoder · vae  (Comfy-Org repackaged Qwen-Image-Edit)
dl "$COMFY/models/diffusion_models" qwen_image_edit_fp8_e4m3fn.safetensors \
   "$HF/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors"
dl "$COMFY/models/text_encoders" qwen_2.5_vl_7b_fp8_scaled.safetensors \
   "$HF/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors"
dl "$COMFY/models/vae" qwen_image_vae.safetensors \
   "$HF/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors"
# the FoxBaze virtual try-on LoRA  (confirm the exact .safetensors filename from the repo tree)
dl "$COMFY/models/loras" tryon_qwen_edit_alpha.safetensors \
   "$HF/FoxBaze/Try_On_Qwen_Edit_Lora_Alpha/resolve/main/Try_On_Qwen_Edit_Lora_Alpha.safetensors" || \
   echo "  ⚠ confirm the LoRA filename in the FoxBaze repo tree, then re-download"
# the provided workflow
mkdir -p "$COMFY/workflows"
curl -fsSL -H "Authorization: Bearer $HF_TOKEN" \
   "$HF/FoxBaze/Try_On_Qwen_Edit_Lora_Alpha/resolve/main/TryOn-Alpha-Workflow.json" \
   -o "$COMFY/workflows/TryOn-Alpha-Workflow.json" || echo "  ⚠ confirm the workflow filename, then re-download"

echo "── 4. auth proxy (Caddy: bearer-gated → 127.0.0.1:8188) ─────────"
sudo tee /etc/caddy/Caddyfile >/dev/null <<EOF
:8443 {
  @noauth not header Authorization "Bearer $COMFYUI_TOKEN"
  respond @noauth "unauthorized" 401
  reverse_proxy 127.0.0.1:8188
}
EOF
sudo systemctl restart caddy

echo "── 5. run ComfyUI as a service (listens on localhost only) ──────"
sudo tee /etc/systemd/system/comfyui.service >/dev/null <<EOF
[Unit]
Description=ComfyUI
After=network.target
[Service]
User=$USER
WorkingDirectory=$COMFY
ExecStart=$PY $COMFY/main.py --listen 127.0.0.1 --port 8188
Restart=on-failure
[Install]
WantedBy=multi-user.target
EOF
sudo systemctl daemon-reload && sudo systemctl enable --now comfyui

echo "── DONE ─────────────────────────────────────────────────────────"
echo "ComfyUI try-on backend up. Point the adapter at it:"
echo "  COMFYUI_URL=https://<this-host>:8443   COMFYUI_TOKEN=<the bearer>"
echo "  COMFYUI_TRYON_WORKFLOW=$COMFY/workflows/TryOn-Alpha-Workflow.json"
echo "Stop the GPU when idle to control cost:  sudo systemctl stop comfyui  +  aws ec2 stop-instances"
