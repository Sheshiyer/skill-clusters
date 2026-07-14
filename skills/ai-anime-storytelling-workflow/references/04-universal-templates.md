# Reference 04 — Universal Templates

These templates are distilled from the source workflows. Replace bracketed variables while preserving the structure.

---

## CRITICAL: Choose the Right Template

**Before generating, decide which approach you need:**

| Your situation | Use template |
|---|---|
| Seedance + single emotional moment (<15s) | A (Combined Board) |
| Any model + single continuous action | A2 (Character Sheet Only) + B |
| Any model + multiple scenes/beats | A2 (Character Sheet Only) + A3 (Individual Keyframes) + B |

**Do NOT use Template A (Combined Board) with Kling, HappyHorse, Wan, or other non-Seedance models.** They will animate the board image itself rather than interpreting the storyboard panels.

---

## A. Combined Board (Seedance Only)

**USE ONLY WITH SEEDANCE.** This template creates a planning document that Seedance can interpret as a narrative reference. Other i2v models will literally animate this image.

```text
Create a single [vertical / 16:9] anime animation development board for an original [genre / emotion] short film titled "[TITLE]".

The output must be ONE combined image with [two / three] sections:
1. Character / IP design sheet
2. Cinematic storyboard page
[3. Optional prop / environment design panel]

IMPORTANT:
Create fully original characters. Do not imitate copyrighted characters directly. Avoid any copyrighted character resemblance. Keep the designs unique while using broad cinematic/anime production qualities.

STYLE:
Premium anime pre-production board mixing hand-drawn storyboard sketches with semi-rendered anime keyframes. Use [lighting], [palette], [camera notes], [movement arrows], [timing notes], and production annotations. The board should feel like a real animation studio planning sheet.

SECTION A — CHARACTER / IP DESIGN SHEET
Main character:
[age, body type, face, hair, eyes, outfit, accessories, personality, emotional state]
Show front view, side profile, 3/4 angle, back view, expression sheet, and action poses.

Secondary character / object:
[creature / vehicle / emotional object / prop]
Show multiple angles, expressions/states, material details, and interaction poses.

SECTION B — STORYBOARD
Create [number] cinematic storyboard frames arranged in a clean grid. Keep character designs consistent across all panels. Every panel should include handwritten camera notes, movement arrows, timing notes, and lens notes.

STORY BEATS:
1. [beat]
2. [beat]
3. [beat]
...

ENVIRONMENT:
[setting, time of day, atmosphere, weather, architectural/natural details]

FINAL GOAL:
Make this feel like a beautiful animation development board with [specific emotional effect].
```

---

## A2. Character Sheet Only (Any Model)

**USE FOR:** Any i2v model when you want identity consistency. This is your reference image for animation — NOT a storyboard.

```text
Create a professional anime character design sheet for an original [genre] production titled "[TITLE]".

The output must be a SINGLE CHARACTER REFERENCE IMAGE with clean layout for animation production.

IMPORTANT:
Create a fully original character. This sheet will be used as a strict visual reference for video generation. Keep the design consistent, detailed, and animation-ready.

STYLE:
Premium anime character sheet with clean studio presentation. [lighting style], [color palette]. Professional turnaround layout suitable for animation reference.

CHARACTER:
[Name]:
[age, body type, face shape, skin tone, hair style and color, eye shape and color]
[outfit description with specific details]
[accessories, props, distinguishing features]
[personality conveyed through expression and pose]

LAYOUT:
- Large hero pose (3/4 dynamic or front-facing)
- Front view full body
- Side profile
- Back view (if relevant)
- Expression sheet: [emotion 1], [emotion 2], [emotion 3], [emotion 4]
- Key prop or accessory detail callouts

BACKGROUND:
Clean studio background (white, light gray, or subtle gradient). No environmental distractions.

COLOR PALETTE:
Include color swatches for: skin, hair, eyes, primary outfit color, secondary outfit color, accent color.

QUALITY:
Production-ready character bible sheet. Consistent proportions across all views. Clear enough to serve as strict reference for video generation.
```

---

## A3. Individual Keyframe Image (Any Model, Multi-Scene)

**USE FOR:** Complex narratives with multiple scenes. Generate ONE of these per major story beat, then animate each separately.

```text
Create a single cinematic anime keyframe for scene [N] of "[TITLE]".

This image will be animated with image-to-video AI. Design it as a starting frame for motion.

CHARACTER REFERENCE:
Use the established character design: [repeat key identity details from character sheet — hair, eyes, outfit, distinguishing features]. Do not alter the character design.

SCENE:
[Describe the specific moment — what is happening, where, emotional state]

COMPOSITION:
[Camera angle: wide / medium / close-up / extreme close-up]
[Character position in frame: center / rule of thirds / foreground-background relationship]
[Depth: what's in focus, what's soft]

ENVIRONMENT:
[Specific setting details for THIS scene]
[Lighting: time of day, source, mood]
[Atmosphere: weather, particles, ambient elements]

ACTION HINT:
[What motion will happen FROM this frame — character will turn, reach, walk, the wind will blow, light will shift]
Design the pose and composition to naturally lead into this motion.

STYLE:
[Consistent with overall project style]
Premium anime keyframe quality. Painterly backgrounds. Natural pose that implies imminent motion.

AVOID:
- Stiff posed look
- Action frozen mid-motion (hard to animate smoothly)
- Cluttered composition
- Text or UI elements
```

---

## B. Image-to-Video Prompt (Any Model)

```text
TITLE
[TITLE]

REFERENCE
Use the uploaded [character sheet / storyboard / production board] as the strict visual reference.
Keep all character designs, environment details, prop designs, lighting, and emotional story beats visually consistent.
Do not add extra characters unless specified.
Do not change the story.

SUBJECTS
[Character name]:
[identity, age, appearance, outfit, accessories, personality, acting style]

[Prop / creature / vehicle]:
[appearance, role, material, behavior, emotional function]

ENVIRONMENT
[setting, time, weather, lighting, atmosphere, motion in environment]

STYLE
[anime quality, cinematic language, rendering style, lighting, motion blur, emotional tone]

SHOT FORMAT
[duration] seconds.
[continuous shot / timeline with cuts].
[aspect ratio].
No text. No subtitles. No logos. No watermark.

CAMERA
[starting composition]
[camera movement path]
[lens / depth of field / height / distance]
[final framing]

ACTION FLOW / TIMELINE
0:00-0:02
[visual action]
SFX: [sound]

0:02-0:04
[visual action]
SFX: [sound]

...

FINAL MOMENT
[ending image / emotional resolution / unresolved cliffhanger]

NEGATIVE CONSTRAINTS
Do not redesign the character.
Do not change face shape, eye color, hairstyle, outfit, accessories, body proportions, or prop design.
No flicker. No identity drift. No extra limbs. No text overlays. No social media UI.
```

## C. Claude Script Prompt

```text
You are a writer for an original animated [series / short / explainer].

Write [episode / short / scene] called "[TITLE]".
Main character: [name, age, role, special trait].
Premise: [one-line dramatic premise].

Format the output as:
- Scene description for image generation
- Character dialogue
- Narrator lines
- Emotional tone notes
- Voice direction notes
- Music brief notes

Each scene: [duration] seconds read aloud.
Total runtime: [duration].
Pacing: [tense / gentle / comedic / mysterious].
End on: [resolution / cliffhanger / emotional beat].
```

## D. ElevenLabs Voice Direction Template

```text
Voice role: [character / narrator]
Voice quality: [age, tone, texture, emotional range]
Performance direction:
Read this line [flat / intimate / controlled / breathless / warm].
The character is feeling [emotion] but hiding [subtext].
Pause [duration] before "[word]".
Drop / raise volume slightly on "[phrase]".
Do not overact. Keep it cinematic and grounded.

Settings:
Stability: [0.35-0.55]
Similarity: [0.75-0.90]
Style exaggeration: [0.20-0.45]
Speaker boost: ON
```

## E. Suno Music Prompt Template

```text
Original animated [series / short / explainer] score,
[mood and genre],
[instruments],
[tempo / rhythm],
[structure over time],
[reference energy without copying],
runtime [duration],
loops cleanly / resolves emotionally,
cinematic, [emotional adjectives]
```

## F. Make / Automation Blueprint

```text
Trigger: [Schedule / Webhook / New file in folder]

1. Pull new script folder / brief from [source]
2. Parse scene list and metadata
3. Send character / frame prompts to image model
4. Save generated images to organized folders
5. Send dialogue lines to voice model
6. Send music briefs to music model
7. Send scene + reference images to video model
8. Download clips, audio, and score
9. Combine assets in editing template
10. Export final video and short preview
11. Upload to [YouTube / X / TikTok / Patreon / client Drive]
12. Notify operator with approval link and upload confirmation
```
