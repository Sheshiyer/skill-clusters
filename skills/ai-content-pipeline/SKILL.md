---
name: ai-content-pipeline
description: Use when running or coordinating the Tryambakam Noesis source-to-distribution content pipeline. This local mirror aligns OpenClaw with inference-sh agent-skills ai-content-pipeline and binds it to the current OpenClaw, Paperclip, Higgsfield, and inference.sh adapters.
metadata:
  version: 1.0.0
  mirrors: inference-sh/agent-skills@ai-content-pipeline
cluster: social-media
version: 1.0.0
---

# AI Content Pipeline

Use this skill when the job spans multiple stages of the TN content system.

## Primary Owners

- `sadhana-orchestrator`
- `pi` as upstream brief support

## Canonical OpenClaw Pipeline

1. Source material or published post
2. Content Engine brief
3. Distribution packet
4. Creative staging or generative asset production
5. Dry-run or live execution
6. Receipt capture and dashboard visibility

## Bound Adapters

- Blog or source -> packet:

```bash
python3 <openclaw-scripts>/blog_to_distribution_packet.py --slug <post-slug>
```

- Stage article-native assets:

```bash
python3 <openclaw-scripts>/stage_distribution_assets.py --packet /abs/path/to/packet.json --overwrite
```

- Generate Higgsfield assets when required:

```bash
python3 <openclaw-scripts>/higgsfield_generate.py --packet /abs/path/to/packet.json
```

- Execute inference dry-run or publish:

```bash
python3 <openclaw-scripts>/inference_flow_run.py --packet /abs/path/to/packet.json --dry-run
```

- Hand off actionable work to Paperclip:

```bash
python3 <openclaw-scripts>/handoff-to-paperclip.py --packet /abs/path/to/packet.json
```

- Review live state:

`http://127.0.0.1:5199/api/distribution/overview`

## Guardrails

- X is the source lane.
- Reddit and Substack are manual expansions.
- Threads, Instagram, and Facebook are repost layers.
- Do not bypass `manual-confirmed` publish policy.
- Use the adapters above instead of raw provider calls whenever possible.
