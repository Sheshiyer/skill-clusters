<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=gradient&customColorList=12,20,24&height=220&text=Media-Gen&fontSize=52&fontAlignY=38&desc=11%20generators%20%26%20processors%2C%20one%20router%20%E2%80%94%20generate%20%E2%86%92%20transform%20%E2%86%92%20assemble&descAlignY=58&fontColor=ffffff" width="100%" />

</div>

<div align="center">

[![License](https://img.shields.io/github/license/Sheshiyer/skill-clusters?style=flat&color=blue)](../../LICENSE)
[![Skills](https://img.shields.io/badge/skills-13-f59e0b?style=flat)](../../skills.sh.json)
[![Tier](https://img.shields.io/badge/tier-deferred-64748b?style=flat)](../../profiles.json)
[![skills.sh](https://img.shields.io/badge/install-skills.sh-000?style=flat)](https://skills.sh/)

**Generative + transformational media behind a single router.**
Generating, editing, upscaling, 3D-ifying, or assembling an image, video, or GIF? The orchestrator
places your task on the **modality × stage** map and routes; `media-gen-core` holds the
backend-routing decision they all share.

</div>

<img src="https://capsule-render.vercel.app/api?type=rect&color=gradient&customColorList=12,20,24&height=2" width="100%" />

## What it is

13 skills: `media-gen-orchestrator` (router) + `media-gen-core` (shared model) + 11 specialists
spanning image generation, image enhancement, image-to-3D, AI video direction, FFmpeg processing,
frame extraction, and GIF search/authoring. The cluster's job is to make a grab-bag of media tools
*navigable* — the orchestrator knows which backend to reach for, and the core keeps the one
decision that matters (which generator, given its **access/billing model** and the **modality**)
consistent.

```mermaid
graph TD
    O["media-gen-orchestrator<br/>(hub · modality × stage router)"]
    O --> IMG["Image<br/>generate"]
    O --> XF["Image<br/>transform"]
    O --> D3["Image → 3D"]
    O --> VID["Video<br/>generate · process"]
    O --> GIF["GIF<br/>find · author"]
    IMG -. references .-> C["media-gen-core<br/>(access-model × modality routing<br/>· generate→transform→assemble · formats)"]
    VID -. references .-> C
    D3 -. references .-> C

    style O fill:#0e7490,color:#fff
    style C fill:#276749,color:#fff
```

## Skills by concern

| Concern | Spokes |
|---|---|
| **Router / model** | `media-gen-orchestrator`, `media-gen-core` |
| **Image — generate** | `gpt-image-2`, `nano-banana-2`, `openai-image-gen`, `art` |
| **Image — transform** | `image-enhancer` |
| **3D** | `hunyuan3d` |
| **Video — generate** | `ai-video-director` |
| **Video — process / extract** | `ffmpeg`, `video-frames` |
| **GIF — find / author** | `gifgrep`, `slack-gif-creator` |

## The decision that ties it together

Every generative request resolves on two axes — **modality** × **access model**:

```
Request ──> [ image | 3D | video | GIF ] × [ subscription-CLI | API-key+billing | local/hosted-GPU | free ] ──> spoke
```

Confirm the chosen backend's prerequisite (plan / key / GPU endpoint) before spending a call;
generation is non-deterministic and may cost money. Full model in
[`media-gen-core`](../../skills/media-gen-core/SKILL.md).

## Install

```bash
npx skills add Sheshiyer/skill-clusters@media-gen-orchestrator -g -y     # entry point
npx skills add Sheshiyer/skill-clusters@hunyuan3d -g -y                  # any spoke
```

## Local development

Part of the [`skill-clusters`](../../README.md) monorepo; the repo is the single source of truth.

```bash
./scripts/link-agents.sh --apply    # symlink ~/.agents/skills → these canonical copies
```
