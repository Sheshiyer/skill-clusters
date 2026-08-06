---
name: cli-core
description: "Shared reference for the cli cluster: credential handling for terminal tools, the dry-run-before-mutation contract, explicit confirmation on anything that publishes externally, and how an internal CLI relates to the skill that may supersede it. USE WHEN running any Thoughtseed-internal CLI that writes, authenticates, or publishes."
cluster: cli
version: 1.0.0
---

# CLI Core

Shared model for the `cli` cluster — Thoughtseed's own operator utilities. The members differ
completely in subject matter, so what has to stay consistent is *how they behave*, not what
they do.

## Credentials

Internal CLIs authenticate against real accounts. Two rules, no exceptions:

- Never place a credential, token, or cookie in a command string, a commit, or a log line.
  Tools read them from their own configured store.
- Never enter credentials on the operator's behalf. If a tool needs re-auth, say so and let
  the operator do it.

## Dry run before mutation

Any member that can change external state supports inspecting the plan first. Run that path
before the applying path, and show the operator what would change. A tool without a dry-run
path is a gap in the tool, not a reason to skip the step.

## Publishing is always confirmed

Reading is ordinary. **Publishing is not.** Posting, commenting, uploading, deleting, or
messaging on any external network requires explicit confirmation from the operator for that
specific action. Approval for one post is not approval for the next.

This is the boundary that matters most in this cluster: `gram-cli` and `reddit-cli` both
touch live social accounts where a mistake is public and effectively irreversible.

## Supersession

An internal CLI can be replaced by a skill that wraps the same capability more directly.
When that happens, record it rather than letting the CLI quietly rot:

- name the superseding skill in the CLI's own SKILL.md
- keep the member catalogued so the reason it was retired survives

Deleting the entry loses the history of why the tool existed.

## Provenance

Every member of this cluster is `origin: authored` — Thoughtseed wrote it. That is the
defining property of the cluster, and it is what makes these tools publishable as work in a
way an imported cluster is not.
