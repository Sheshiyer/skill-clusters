---
name: sales
description: Turn product/feature documentation into compelling sales narratives, talking points, and visual assets. USE WHEN the user asks for a sales pitch, sales package, sales narrative, or sales collateral from technical docs.
cluster: growth-sales-cro
version: 1.0.0
---

# Sales Skill

**Transform product documentation into compelling sales narratives and visual assets.**

Takes technical documentation, product information, or feature descriptions and produces:
1. **Sales Narratives** - Story explanations that capture the value proposition
2. **Visual Assets** - Charcoal sketch art that conveys the concept visually
3. **Scripts** - Clear, succinct, effective messaging tied to what you're selling

---

## The Pipeline

```
PRODUCT DOCUMENTATION
        ↓
[1] STORY EXPLANATION — Extract the narrative arc (what's the real value?)
        ↓
[2] EMOTIONAL REGISTER — What feeling should this evoke? (wonder, determination, hope, etc.)
        ↓
[3] VISUAL CONCEPT — Derive scene from narrative + emotion
        ↓
[4] GENERATE ASSETS — Create visual + narrative package
        ↓
SALES-READY OUTPUT
```

---


## Workflows

### Full Sales Package → `Workflows/Create-sales-package.md`
**The complete pipeline.** Takes product docs and produces:
- Sales narrative (story explanation)
- Visual asset (charcoal sketch)
- Key talking points

### Sales Narrative Only → `Workflows/Create-narrative.md`
**Just the story.** Converts technical docs into compelling narrative.

### Visual Asset Only → `Workflows/Create-visual.md`
**Just the visual.** Creates charcoal sketch art for existing narrative.

---

## Output Format

### Sales Narrative
- 8-24 point story explanation
- First person, conversational
- Captures the "why this matters" not just "what it does"
- Ready for sales scripts, presentations, pitches

### Visual Asset
- Charcoal gestural sketch aesthetic
- Minimalist composition with breathing space
- Transparent background for versatility
- Captures the emotional core of the value proposition

---

## Example

**Input:** Technical documentation about AI code review tool

**Output:**
- **Narrative:** "This tool doesn't just find bugs—it understands your codebase like a senior engineer who's been there for years. It catches the subtle issues that slip through PR reviews..."
- **Visual:** Gestural sketch of human developer and AI figure collaborating, both examining the same code output
- **Talking Points:**
  1. Senior engineer understanding, not just pattern matching
  2. Catches what humans miss in PR reviews
  3. Learns your specific codebase patterns

---

## Integration

This skill combines:
- **Narrative extraction** - Pull the value-proposition story arc out of dense docs
- **Visual generation** - Optional charcoal-sketch asset that conveys the concept
- **Sales-specific framing** - Value proposition focus

---

**The goal:** Sales teams get materials that are highly tied to what they're selling, clear, succinct, and effective.

---

## Examples

**Example 1: Full sales package from docs**
```
User: "create a sales package for this product" [provides docs]
→ Extracts narrative arc using storyexplanation
→ Determines emotional register (wonder, determination, hope)
→ Generates charcoal sketch visual + narrative + talking points
```

**Example 2: Sales narrative only**
```
User: "turn this technical doc into a sales pitch"
→ Reads documentation and extracts value proposition
→ Creates 8-24 point story explanation in first person
→ Returns conversational narrative ready for sales scripts
```

**Example 3: Visual asset for existing narrative**
```
User: "create a visual for this sales story"
→ Analyzes narrative for emotional core
→ Derives scene concept from story + emotion
→ Generates charcoal gestural sketch with transparent background
```
