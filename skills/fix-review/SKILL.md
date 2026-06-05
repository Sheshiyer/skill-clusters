---
name: fix-review
description: "Verify that fix commits properly resolve security/audit findings at the root cause without introducing new bugs, regressions, or vulnerabilities, and confirm test coverage for the fixed scenario. USE WHEN reviewing remediation commits that claim to close audit findings, or validating that a fix is complete and side-effect-free before merging."
cluster: quality-eval
version: 1.0.0
origin: "antigravity-awesome-skills (MIT)"
risk: safe
source: "https://github.com/trailofbits/skills/tree/main/plugins/fix-review"
date_added: "2026-02-27"
---

# Fix Review

## Overview

Verify that fix commits properly address audit findings without introducing new bugs or security vulnerabilities.

## When to Use This Skill

Use this skill when you need to verify fix commits address audit findings without new bugs.

Use this skill when:
- Reviewing commits that address security audit findings
- Verifying that fixes don't introduce new vulnerabilities
- Ensuring code changes properly resolve identified issues
- Validating that remediation efforts are complete and correct

## Instructions

This skill helps verify that fix commits properly address audit findings:

1. **Review Fix Commits**: Analyze commits that claim to fix audit findings
2. **Verify Resolution**: Ensure the original issue is properly addressed
3. **Check for Regressions**: Verify no new bugs or vulnerabilities are introduced
4. **Validate Completeness**: Ensure all aspects of the finding are resolved

## Review Process

When reviewing fix commits:

1. Compare the fix against the original audit finding
2. Verify the fix addresses the root cause, not just symptoms
3. Check for potential side effects or new issues
4. Validate that tests cover the fixed scenario
5. Ensure no similar vulnerabilities exist elsewhere

## Best Practices

- Review fixes in context of the full codebase
- Verify test coverage for the fixed issue
- Check for similar patterns that might need fixing
- Ensure fixes follow security best practices
- Document the resolution approach

## Resources

For more information, see the [source repository](https://github.com/trailofbits/skills/tree/main/plugins/fix-review).

## Limitations
- Use this skill only when the task clearly matches the scope described above.
- Do not treat the output as a substitute for environment-specific validation, testing, or expert review.
- Stop and ask for clarification if required inputs, permissions, safety boundaries, or success criteria are missing.
