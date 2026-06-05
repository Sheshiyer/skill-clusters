---
name: cloudflare
description: Deploy and manage Cloudflare Workers, MCP servers, and Pages, with auth-token gotchas baked in. USE WHEN deploying a Worker or MCP server, publishing a Pages site, or debugging a Cloudflare deploy/auth failure.
cluster: cloudflare
version: 1.0.0
---

# Cloudflare Skill

Deploy and manage Cloudflare Workers, MCP servers, and Pages.

## Workflow Routing

  - **Create** MCP server or Worker → `Workflows/Create.md`
  - **Troubleshoot** deployment issues → `Workflows/Troubleshoot.md`

## Quick Reference

- **Account ID:** Set via `CF_ACCOUNT_ID` environment variable
- **Worker URL format:** `https://[worker-name].[your-subdomain].workers.dev`

## Deployment Commands

### Workers Deployment
```bash
# Unset tokens that interfere with wrangler login-based auth
(unset CF_API_TOKEN && unset CLOUDFLARE_API_TOKEN && wrangler deploy)
```

### Pages Deployment

**🚨 CRITICAL: ALL env tokens lack Pages permissions. MUST unset them to use OAuth:**

```bash
# ALWAYS unset tokens for Pages - OAuth login works, tokens don't
(unset CF_API_TOKEN && unset CLOUDFLARE_API_TOKEN && npx wrangler pages deploy dist --project-name=PROJECT_NAME --commit-dirty=true)
```

**Known Pages Projects:**
| Project | Directory | Deploy Command |
|---------|-----------|----------------|
| [project] | `~/Projects/[project]` | `(unset CF_API_TOKEN && unset CLOUDFLARE_API_TOKEN && npx wrangler pages deploy dist --project-name=[project] --commit-dirty=true)` |

## Critical Notes

- **Workers:** Unset `CF_API_TOKEN` and `CLOUDFLARE_API_TOKEN` before deploying - they interfere with wrangler login-based auth
- **Pages:** 🚨 **UNSET ALL TOKENS** - None of the API tokens have Pages permissions. OAuth-based wrangler login is the ONLY method that works.

## Examples

**Example 1: Deploy a Worker**
```
User: "deploy the MCP server to Cloudflare"
→ Invokes CREATE workflow
→ Unsets env tokens, runs wrangler deploy
→ "Deployed to https://mcp-server.[subdomain].workers.dev"
```

**Example 2: Deploy Pages site**
```
User: "deploy daemon to Cloudflare"
→ Builds dist/, unsets tokens
→ Runs wrangler pages deploy
→ "Deployed daemon to Cloudflare Pages"
```

**Example 3: Fix deployment error**
```
User: "Cloudflare deploy is failing with auth error"
→ Invokes TROUBLESHOOT workflow
→ Identifies token interference
→ "Fixed - tokens were overriding OAuth. Redeployed successfully."
```
