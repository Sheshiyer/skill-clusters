---
name: getleads-mcp
version: 1.0.0
description: B2B lead database MCP server for AI agents. Search, enrich, and filter 150M+ verified contacts via plain language. USE WHEN running AI GTM, sales prospecting, lead enrichment, account research, or signal-based outbound workflows.
cluster: growth-sales-cro
origin: "getleads.io MCP"
triggers:
  - getleads
  - b2b leads
  - lead database
  - lead enrichment
  - sales prospecting
  - find contacts
  - company contacts
  - AI GTM
  - signal-based prospecting
  - enrich leads
---

# getleads-mcp

B2B lead database MCP server for AI agents from [getleads.io](https://getleads.io).

## What It Does

- **150M+ verified B2B contacts** — search by role, company, industry, location, signals
- **Plain language queries** — "Find CTOs at Series B fintech startups in NYC"
- **Lead enrichment** — enrich existing contacts with fresh data
- **Signal-based filtering** — hiring, funding, tech stack, job changes
- **No exports, no dashboards** — your AI agent queries directly via MCP

## MCP Configuration

Add to your Claude/Codex MCP config (`~/.claude/mcp.json` or equivalent):

```json
{
  "mcpServers": {
    "getleads": {
      "command": "npx",
      "args": ["-y", "@getleads/mcp-server"],
      "env": {
        "GETLEADS_API_KEY": "<your-api-key>"
      }
    }
  }
}
```

> Get your API key at [getleads.io](https://getleads.io)

## Available Tools

Once configured, the MCP server exposes tools like:

| Tool | Description |
|------|-------------|
| `search_leads` | Search contacts by criteria (title, company, industry, location, signals) |
| `enrich_contact` | Enrich a contact with current data (email, phone, LinkedIn, company info) |
| `enrich_company` | Get company details (size, funding, tech stack, recent news) |
| `filter_by_signal` | Filter leads by buying signals (hiring, funding, job changes) |

## Example Prompts

### Find Leads
```
Find 20 VP Engineering contacts at Series B+ SaaS companies in the Bay Area
that are actively hiring backend engineers.
```

### Enrich Existing List
```
I have a list of company domains. Enrich each with:
- Current headcount
- Recent funding
- Key decision makers (CTO, VP Eng, Head of Product)
```

### Signal-Based Prospecting
```
Find CTOs who changed jobs in the last 90 days
at companies that raised Series A in 2024.
```

### Account Research
```
Research Acme Corp:
- Key stakeholders in engineering and product
- Recent hiring patterns
- Tech stack signals
- Any recent news or funding
```

## Use Cases

| Use Case | Example |
|----------|---------|
| **Outbound prospecting** | Find ICP-matching contacts for cold outreach |
| **Account-based marketing** | Research target accounts before campaigns |
| **Lead scoring enrichment** | Enrich inbound leads with firmographic data |
| **Competitive intelligence** | Track hiring/funding at competitors |
| **Event targeting** | Find attendees matching your ICP |

## Gotchas

1. **Rate limits** — Check your plan's query limits
2. **Data freshness** — Enrichment data may be 30-90 days old
3. **Email verification** — Not all emails are verified; check confidence scores
4. **Privacy compliance** — Ensure your use complies with GDPR/CCPA

## Related Skills

- `growth-content-orchestrator` — for GTM content after lead gen
- `growth-seo-orchestrator` — for inbound lead generation
- `composio-cli` — for connecting to other sales tools via MCP
