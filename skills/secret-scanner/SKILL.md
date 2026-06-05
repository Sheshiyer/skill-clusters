---
name: secret-scanner
description: "Scan codebases for leaked secrets, API keys, and credential exposure patterns. USE WHEN before pushing to a public repo, during a security audit, or wiring secret detection into CI/CD."
cluster: security
version: 1.0.0
origin: lxgic-studios (MIT)
---

# Secret Scanner

Scan your codebase for leaked secrets, API keys, and credentials before they hit production.

## Quick Start

```bash
npx ai-secret-scan
```

## What It Does

- Scans files for hardcoded secrets and API keys
- Detects common patterns (AWS, Stripe, GitHub tokens, etc.)
- Checks .env files for sensitive data exposure
- Warns about secrets in git history
- Zero config, instant results

## Usage

```bash
# Scan current directory
npx ai-secret-scan

# Scan specific path
npx ai-secret-scan ./src
```

## When to Use

- Before pushing to a public repo
- During security audits
- Setting up CI/CD pipelines
- Onboarding new team members

## License

MIT.
