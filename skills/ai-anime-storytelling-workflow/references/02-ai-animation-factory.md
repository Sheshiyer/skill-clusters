# Reference 02 — AI Animation Factory

Source: https://x.com/0x_fokki/status/2066199209892606194?s=20

## Main tweet

```text
🚨an anime studio spends $180,000 per episode

a 22-year-old spent $57 last month and made $14,600
he built it in 3 weeks.

> Claude maps every script: 10 minutes
> Midjourney designs every frame: 20 minutes
> Runway turns storyboards into motion: 15 minutes
> ElevenLabs delivers every voice: 10 minutes
> Suno produces the score: 5 minutes
> Make releases on schedule: 0 minutes

60 minutes per episode. 4 episodes/week.

the full pipeline is in the article above
```

## Quoted article/thread text

```markdown
I Built an AI Animation Factory That Runs 24/7

$12,345 last month. Six tools. I directed it for maybe 4 hours total.

I spent three months asking one question.

What if animation - characters, motion, voice, music - could be produced faster than studios can greenlight a pitch deck?

Turns out it can. Brands, YouTube, and licensing platforms all pay well for it.

The factory runs 24/7. I sleep. It produces.

---

## What the Factory Actually Produces

Four content types, all automated:

- Animated story series - 6-10 minute episodes, original characters, AI voice cast, original score

- Brand explainer animations - 60-90 second product videos sold to SaaS companies and startups

- Motion comic series - illustrated panels pushed into Runway, narrated, cinematic pacing

- Children's story channels - 5-minute bedtime stories, soft animation, calming voice, ambient music

Each type hits a different buyer. Together they clear $12,000+/month.

One pipeline builds all four.

---

## The Pipeline

Claude -> Midjourney -> Runway -> ElevenLabs -> Suno -> Make
script -> frames -> motion -> voice -> music -> publish

Six tools. Fully automated after setup.

---

## Step 1 - Claude Writes the Script

Everything starts here. Claude generates the episode script, visual scene breakdowns for Midjourney, voiceover lines for ElevenLabs, and the brief for Suno.

Prompt for episode script:

```
You are a writer for an original animated series.

Write episode 2 of a 10-episode series called "Drift Protocol."
Main character: Mara, 19, a courier who discovers she can
replay 30 seconds of any moment she's touched.

Episode 2: Mara replays the moment before a building collapse
and realizes it wasn't an accident. Someone is erasing events.

Format the output as:
- Scene description (for image generation)
- Character dialogue
- Narrator lines
- Emotional tone notes

Each scene: 30-45 seconds read aloud.
Total episode: 8 minutes.
Tense pacing. Cinematic cuts. End on an unresolved threat.
```

Prompt for brand explainer:

```
You are a scriptwriter for premium SaaS explainer videos.

Product: Vaultly - document automation for law firms.
Audience: partners at mid-size firms, 35-55, skeptical of new software.
Tone: confident, direct, slightly dry.

Write a 75-second explainer script.
Structure:
- 0:00-0:12: the problem (one specific scenario, not a list)
- 0:12-0:45: how Vaultly solves it, step by step
- 0:45-1:15: result in numbers (time saved, error rate, cost)
- 1:15: one-line CTA

No buzzwords. No enthusiasm. Just mechanics.
```

---

## Step 2 - Midjourney Generates the Frames

Character sheet (series):

```
19-year-old girl, athletic build, short dark hair with one bleached streak,
worn courier jacket covered in faded patches, fingerless gloves,
expression: cautious but sharp, scanning the environment,
cinematic western animation style, Disney Feature meets Studio Ghibli,
high contrast lighting, muted earth tones with cyan accent,
full body, turnaround sheet style, white background,
ultra detailed, 4k
```

Environment - night city:

```
rain-soaked elevated highway at night,
brutalist concrete and holographic transit signs,
deep shadows, orange sodium light mixing with cold blue from screens,
puddles reflecting neon, empty except for one courier bike,
western animated feature style, wide establishing shot,
cinematic, desaturated palette, moody
```

Brand explainer - corporate:

```
clean minimal office, one lawyer at a desk,
stacks of paper contracts on left, laptop open on right,
overhead lighting, cool whites and grays,
flat vector-influenced style, professional but not sterile,
negative space composition, character mid-distance,
motion graphic aesthetic
Generate 4 variations per scene. Upscale the best. Series episodes: 12-18 images each. Explainer videos: 8-12.
```

---

## Step 3 - Runway Animates Everything

Action cut:

```
Camera pushes in slow toward the character.
She turns her head left. Something off-screen caught her attention.
Her hand reaches out and touches the wall.
Subtle glow pulses from her palm, then fades.
She exhales.
6 seconds. Tense, focused energy.
```

Environmental atmosphere:

```
Rain falls in slow irregular sheets across the highway.
Holographic signs flicker in the wind.
One sign glitches. Text scrambles for a half-second, returns.
Camera holds still. Background moves.
Cold, unsettling, quiet. 8 seconds.
```

Brand explainer transition:

```
Stack of paper contracts slides off the desk to the left.
Laptop screen brightens.
Interface elements appear one by one.
Clean, smooth motion. 2 seconds per element.
Professional pace. No drama.
```

---

## Step 4 - ElevenLabs Does the Voices

Best voices by content type:

```
Role               Voice     Notes
-----              -----     -----
Mara (main)        Rachel    young, controlled, edge underneath the calm
Narrator           Antoni    measured, cinematic, weight behind each line
Antagonist         Clyde     smooth authority, never raises his voice
Brand explainer    Daniel    precise, credible, adult professional

```

Settings:

> Stability: 0.40
Similarity: 0.85
Style exaggeration: 0.35
Speaker boost: ON

Directing the performance:

```
Read this line flat. She's not scared yet - she's calculating.
The fear comes later. Right now she's measuring the situation.
Slight pause before "erased":

"This moment wasn't lost. It was erased."

Hold 0.6 seconds before "erased."
Barely drop volume on the last word.
ElevenLabs responds to direction written into the prompt. Most people paste lines. Write the performance.
```

---

## Step 5 - Suno Generates the Score

Main title theme:

```
Original animated series theme, western feature style,
brass and strings leading, percussive electronic undertone,
opens quietly with solo piano, full orchestra enters at 0:20,
builds to emotional swell at 0:55, then resolves into a fragile melody,
runtime 1:45, memorable but not aggressive,
Steven Price meets Thomas Newman energy,
cinematic, emotional, slightly uncertain
```

Chase and tension:

```
Taut rhythmic underscore, animation thriller pacing,
low bass pulses every 2 beats, staccato string hits,
sparse piano accents on offbeats,
tempo 112 BPM, never fully resolves,
3 minutes, loops cleanly,
The Bear meets Into the Spider-Verse OST
```

Brand explainer background:

```
Corporate ambient, clean and confident,
light piano chords, neutral pad underneath,
no melody - just motion and space,
2 minutes, fades under voiceover without competing,
modern, professional
```

All tracks are yours. Commercial license on the $8/month plan.

---

## Step 6 - Make Automates Everything

Scenario runs every Monday and Thursday at 8am:

```
Trigger: Schedule (2x per week)

1. Pull new script folder from Google Drive
2. Extract scene list, send prompts to Midjourney via API
3. Download generated images to organized Drive folders
4. Send dialogue lines to ElevenLabs, download audio
5. Send scene + image pairs to Runway, download clips
6. Combine clips and audio in CapCut template
7. Upload finished episode to YouTube with auto-generated title and tags
8. Clip 30-second preview, upload to X with article link
9. Post episode to Patreon (members get 48-hour early access)
10. Send Telegram notification with upload confirmation
```

Explainer pipeline runs on demand. One Make webhook. Client drops a brief, finished video appears in shared Drive in 6 hours.

Setup time: 5 hours once. Runs indefinitely after.

---

## How You Make Money

YouTube AdSense

> Animation RPM: $5-$12 per 1,000 views. At 900k monthly views: $4,500-$10,800/month. Children's content and adult animated series monetize differently. Run both.

Patreon early access

> First 48 hours per episode at $5.99/month. 150 members = $900/month passive.

Brand explainer sales

> $350-$800 per 90-second video. Pipeline cost per video: $12. At 10 videos/month: $3,500-$8,000/month.

Asset licensing

> Midjourney character packs on Gumroad. "AI Animation Pack - 40 production-ready frames" at $27. Sell indefinitely.

Sponsorships

> Animation tools, indie game studios, design software. At 40k subscribers: $400-$1,000 per integration.

---

## The Numbers

> Month 1:    setup, $0
Month 2:   $600 - $1,200
Month 3:   $2,000 - $3,500
Month 6:   $5,000 - $7,500
Month 9:   $8,000 - $11,000
Month 12:  $12,000 - $18,000+

---

## The Cost

```
Claude Pro           $20/month
Midjourney Pro       $30/month
Runway Standard      $35/month
ElevenLabs Creator   $22/month
Suno Pro             $8/month
Make Core            $9/month
---------------------
Total                $124/month

```

Total: $124/month in. $12,000+ out.

The factory runs. You direct it.

Your only job: pick the story, pick the style, approve the output.

Six tools. One pipeline. Builds while you sleep.

comment "FACTORY" and I'll send the Make automation file.
```

## Workflow distilled

- Claude maps scripts, scene descriptions, dialogue, narrator lines, and music briefs.
- Midjourney generates character sheets, environments, and scene frames.
- Runway turns frames/storyboards into motion clips.
- ElevenLabs performs voice lines with explicit performance direction.
- Suno creates title themes, tension beds, and background music.
- Make orchestrates file movement, generation calls, downloads, editing templates, uploads, previews, Patreon posts, and notifications.

## Cost snapshot from source

```text
Claude Pro           $20/month
Midjourney Pro       $30/month
Runway Standard      $35/month
ElevenLabs Creator   $22/month
Suno Pro             $8/month
Make Core            $9/month
---------------------
Total                $124/month
```

## Local media assets

Downloaded to `references/media/fokki-animation-factory/`:

- `2066199209892606194-factory-preview-video.mp4` — factory preview video.
- `2066199209892606194-factory-preview-thumbnail.jpg` — factory preview thumbnail.
- `2063922946947575945-quoted-article-cover.jpg` — quoted article cover image.

See `references/05-media-manifest.md` for file sizes, SHA-256 hashes, and original URLs.
