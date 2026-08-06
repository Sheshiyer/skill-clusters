---
name: grokfilm
description: "Search and apply the GrokFilm cinema technique index (300 camera/lighting/composition/editing/sound/story/effects/genre techniques as Grok Imagine prompt language). USE WHEN writing cinematic still or video prompts, picking camera language for scroll-world/brandmint/Higgsfield/Grok Imagine, or grounding visual direction in named film techniques from https://grokfilm.app/#index."
cluster: design
version: 1.0.0
origin: "https://grokfilm.app/#index (TETSUO CORP / AgenC Cinématique); local mirror in skill-clusters taste corpus"
---

# grokfilm — visual cortex · film technique layer

Local, searchable mirror of **[GrokFilm](https://grokfilm.app/#index)** — 300 cinema & photography techniques written as generative prompt language (camera, lighting, composition, editing, sound, story, effects, genre).

This is a **visual cortex** spoke under `design`: it supplies *named cinematic language* so brand stills, scroll-world dives, and Grok Imagine / Higgsfield / Remotion shots stop defaulting to generic AI gloss.

## Where it sits

| Layer | Role |
|---|---|
| `design-core` | research → lock direction → ledger → generate |
| **grokfilm** | pick technique(s) + emit prompt clauses |
| brandmint / openbrand | brand tokens (palette, type, voice) |
| scroll-world / media-gen / Higgsfield | actually render frames |

**Rule:** brand tokens + composition path first; then **stack 1–3 GrokFilm techniques** into the style preamble. Do not dump 10 techniques.

## Corpus (local)

```
~/.agents/skill-clusters/taste/corpus/grokfilm/techniques.json   # full 300
~/.agents/skill-clusters/taste/corpus/grokfilm/index.json        # slim search
```

Refresh from upstream when the public index updates:

```bash
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs refresh
```

## CLI

```bash
# Search by name / mood / definition keywords
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs search "dutch angle noir"
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs search "golden hour" --category Lighting
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs search "" --mood Horror --limit 10

# One technique + ready prompt
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs get chiaroscuro
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs get dutch-angle --json

# Ranked prompts for a brief
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs prompt "luxury lobby night rain" --limit 3

# Category census
node ~/.agents/skill-clusters/skills/grokfilm/scripts/grokfilm.mjs categories
```

## Prompt shape (default)

```
Cinematic film still using the {Technique Name} technique. {First sentence of definition}
Film grain, disciplined composition, production still quality.
```

Combine with brand:

```
{brand style preamble}. Cinematic film still using Rembrandt lighting and a low angle shot.
Subject: {slot}. Palette: {hexes}. No text, no logos.
```

## Categories (8)

Camera · Lighting · Composition · Editing · Sound · Story · Effects · Genre  

Tiers: Basic · Intermediate · Advanced  

## Workflow handoff

| Intent | Then |
|---|---|
| Brand hero still | brandmint/openbrand tokens → `grokfilm prompt` → Higgsfield / gpt-image-2 / Codex image |
| Scroll-world dive | lock art direction → 1 camera + 1 lighting technique shared across all scene stills |
| Live GSAP page | use technique names only as art-direction copy; motion stays creative-frontend |
| Pure film reel | media-gen / Remotion / Grok Imagine with stacked prompts |

## Attribution

Catalogue origin: **GrokFilm** — [grokfilm.app](https://grokfilm.app/#index) · Tetsuo Corp / AgenC.  
When shipping public work that relies on these definitions, attribute the index. Local cache is for operator use inside Temperance / skill-clusters.

## Anti-patterns

- Do not invent technique names when the index has a match — search first.
- Do not mix conflicting lighting schemes (high-key + low-key) without an intentional story reason.
- Do not skip brand lock and “just add Dutch angle.”
- Prefer `design-orchestrator` routing when the ask is fuzzy (“make it cinematic”).
