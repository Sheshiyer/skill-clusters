---
name: explee-agents
description: "Run Explee pre-built and custom AI agents, then poll run status and return structured outputs. USE WHEN running agent workflows for extraction, reasoning, or automation."
cluster: explee-master
version: 1.0.0
origin: "Sheshiyer/explee-skills"
---

# Explee Agents

Use this skill for extraction, reasoning, and automation tasks powered by Explee Agents.

**Auth & endpoints:** see `explee-api-core`. List uses **T1**, runs use **T3**, polls use **T4**.

## Endpoints (this product)

- `GET  /public/api/v1/agents` — list agents + `input_schema`
- `POST /public/api/v1/agents/{agent_id}/runs` — run a pre-built agent
- `POST /public/api/v1/agents/runs` — run a custom agent
- `GET  /public/api/v1/agents/runs/{run_id}` — poll a run

## Execution Pattern

1. List available agents and inspect each `input_schema`.
2. Choose a pre-built agent if available; otherwise run a custom agent.
3. Submit a run with minimal valid input.
4. Poll until completion, then return a normalized result.

## Request Body (the unique part)

Run a pre-built agent (`<agent_id>` in the path, template **T3**):
```json
{"input":{}}
```

## Product-specific notes

- Validate the payload against the returned `input_schema` before running.
- For custom agents, keep system prompts concise and deterministic.
- Always report the run lifecycle: `pending` → `completed` / `failed`.
