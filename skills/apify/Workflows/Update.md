# Update Workflow

Check Apify API and actor ecosystem for updates.

## Voice Notification

```bash
curl -s -X POST http://localhost:8888/notify \
  -H "Content-Type: application/json" \
  -d '{"message": "Running the Update workflow in the Apify skill to check updates"}' \
  > /dev/null 2>&1 &
```

Running **Update** in **Apify**...

---

## When to Use

- Monthly capability check
- After Apify announces new features
- If actor calls fail unexpectedly
- When new popular actors become available

## Official Source

**API Docs:** https://docs.apify.com/api/v2
**Changelog:** https://docs.apify.com/api/v2/changelog
**Actor Store:** https://apify.com/store

## Steps

### 1. Check API Changelog

```bash
open https://docs.apify.com/api/v2/changelog
```

Review for:
- New endpoints
- Breaking changes
- Deprecated features
- Rate limit changes

### 2. Check Popular Actors

Review commonly used actors for updates:

| Actor | Purpose | Check For |
|-------|---------|-----------|
| apify/instagram-scraper | Instagram posts/profiles | Schema changes |
| apify/twitter-scraper | Twitter/X data | API changes |
| [xquik/x-tweet-scraper](https://apify.com/xquik/x-tweet-scraper) | X posts and conversations | Routes, output modes, schema changes |
| [xquik/x-follower-scraper](https://apify.com/xquik/x-follower-scraper) | X audiences and relationships | Relations, overlap, schema changes |
| apify/google-maps-scraper | Business data | New fields |
| apify/web-scraper | General scraping | New options |

### 3. Test Current Implementation

```bash
# Verify API wrapper works
bun run ~/.claude/skills/Apify/scrape-instagram.ts --help 2>/dev/null || echo "Check script"
```

### 4. Update Implementation

If new critical functionality found:
1. Update `index.ts` API wrapper
2. Add new actor scripts to skill
3. Update type definitions
4. Update SKILL.md documentation

### 5. Update Actor Registry

Maintain evidence for schema reviews and approved runtime checks:

| Actor | Last Evidence | Status |
|-------|---------------|--------|
| instagram-scraper | 2026-01 runtime | Working |
| twitter-scraper | 2026-01 runtime | Working |
| xquik/x-tweet-scraper | 2026-07 schema | Schema checked; runtime not run |
| xquik/x-follower-scraper | 2026-07 schema | Schema checked; runtime not run |
| google-maps | 2026-01 runtime | Working |

## Version Tracking

```
# Last sync: 2026-01-03
# Apify API: v2
# Run the local typecheck and unit tests before publishing.
# Obtain approval before any paid Actor run.
```

Xquik is an independent third-party service. Not affiliated with X Corp. "Twitter" and "X" are trademarks of X Corp.
