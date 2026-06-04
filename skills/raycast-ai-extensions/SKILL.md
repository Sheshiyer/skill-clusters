---
name: raycast-ai-extensions
description: "Build Raycast AI extensions — expose tools that Raycast AI can call to read and act on behalf of the user. Covers the tools[] manifest, tool function shape, AI instructions, confirmations for side-effecting tools, and evals. USE WHEN making an extension AI-callable or building tools for Raycast AI. Defer exact API to developers.raycast.com/ai."
---

# Raycast AI Extensions

AI extensions let **Raycast AI** call your extension's **tools** to answer questions and take
actions ("@your-extension create an issue titled …"). You provide the tools; the model decides
when to call them. Build on `raycast-core` (manifest + command model); this spoke covers the AI
surface. Confirm current signatures at developers.raycast.com/ai.

## Mental model

- A **tool** is a typed function the AI may invoke: it receives validated input and returns data the model uses to continue. Tools are the AI analog of commands.
- Declare tools in **`package.json` → `tools[]`** (each with a `name`, `title`, and description the model reads to decide relevance), with a matching implementation file that default-exports the tool function.
- The extension's description and any **AI instructions** steer when/how the AI uses your tools — write them for the model, not the user.

## Designing good tools

- **One clear job per tool.** Prefer `getIssues` + `createIssue` over a mega-tool with a `mode` arg — the model routes better to focused tools.
- **Strong descriptions.** The tool/param descriptions are the model's only routing signal; say what it does, when to use it, and what each argument means.
- **Typed inputs.** Validate every argument; never trust the model's input blindly (same boundary discipline as user input).
- **Read vs write.** Mark/structure side-effecting tools so they require **confirmation** before mutating (create/delete/send). Read tools can run freely.

## Confirmations & safety

- Any tool that changes state, spends money, or sends something should request explicit user confirmation before executing (Raycast surfaces a confirmation UI).
- Return concise, structured results; don't dump secrets or huge payloads into the model context.

## Evals

- Raycast supports **evals** (in `package.json`) that assert the AI calls the right tool with the right args for representative prompts. Add evals for your core flows so model/prompt changes don't silently regress routing.

## Build & ship

- Develop with `ray develop` and test via the AI Chat / `@extension` mentions.
- Ships through the same Store flow → `raycast-store-publishing`.

## Guardrails

- Tool/param **descriptions are the routing brain** — invest in them.
- Validate inputs; gate every side-effecting tool behind confirmation.
- Keep tools small and single-purpose; cover them with evals.
- Never leak preference secrets into tool results or the model context.
- Verify exact `tools[]` schema, function signature, and eval format against developers.raycast.com/ai (this is the model, not a frozen API).
