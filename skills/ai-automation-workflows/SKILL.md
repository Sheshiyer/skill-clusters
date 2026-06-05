---
name: ai-automation-workflows
description: Use when you need to orchestrate an approved AI workflow, scheduled automation, or execution backend without bypassing the packet and approval path. This local mirror aligns OpenClaw with inference-sh agent-skills ai-automation-workflows.
metadata:
  version: 1.0.0
  mirrors: inference-sh/agent-skills@ai-automation-workflows
cluster: agentic-ops
version: 1.0.0
---

# AI Automation Workflows

Use this skill when the main problem is workflow choreography, not authorship.

## Primary Owner

- `sadhana-orchestrator`

## OpenClaw Bindings

- Execute approved inference tasks:

```bash
python3 ~/.openclaw/scripts/inference_flow_run.py --packet /abs/path/to/packet.json --dry-run
```

- Hand actionable findings to Paperclip:

```bash
python3 ~/.openclaw/scripts/handoff-to-paperclip.py --packet /abs/path/to/packet.json
```

- Preflight the distribution lane:

```bash
python3 ~/.openclaw/scripts/test-distribution-flow.py
```

## Workflow

1. Confirm that the upstream packet, approval state, and required assets exist.
2. Confirm whether the run is `dry-run` or live.
3. Route execution through the existing adapters.
4. Capture receipts and surface failures.
5. Never skip the approval boundary just because automation is available.

## Guardrails

- This skill does not create permission to publish.
- Cron-owned automation must remain downstream of `CLIP` and the packet gate.
- Prefer existing adapters over raw provider calls.
