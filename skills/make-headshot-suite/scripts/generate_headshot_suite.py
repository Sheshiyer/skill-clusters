#!/usr/bin/env python3
"""Generate a 9-look professional headshot suite via codex-gpt-image."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime
from pathlib import Path


LOOKS = [
    (
        "01-editorial-headshot",
        "Editorial Headshot",
        "Create a high-end editorial studio portrait. The subject is seated on a simple studio stool, torso slightly leaning forward with quiet confidence. Forearms rest naturally on thighs, hands open and relaxed, shoulders soft, posture engaged but not stiff. Head slightly tilted, eyes looking toward the camera, expression thoughtful with a subtle confident smile. Wardrobe: minimalist black casual jacket over a charcoal or deep black T-shirt, slim tailored fit. Background: smooth concrete or neutral gray studio wall with subtle texture. Lighting: soft directional editorial lighting, gentle contrast, natural shadows, premium magazine portrait feel. Camera look: Sony A7R V, 50mm lens, natural compression, shallow depth of field, ultra-realistic professional photography.",
    ),
    (
        "02-cinematic-headshot",
        "Cinematic Headshot",
        "Create a highly cinematic close-to-mid portrait. The subject is centered, looking directly at the camera with calm emotional depth, composed mouth, and confident eyes. Posture upright and relaxed, shoulders balanced, neck natural. Wardrobe: white crew-neck T-shirt under a deep blue leather jacket, slim structured fit, realistic leather texture, rich navy-cobalt shade. Background: smooth studio gradient, dark charcoal at the top transitioning to softer gray-light tones below. Lighting: soft diffused cinematic key light, balanced highlights, subtle shadows, polished film-poster mood. Camera look: 85mm portrait lens, shallow depth of field, cinematic editorial color grading, ultra-realistic.",
    ),
    (
        "03-high-fashion-headshot",
        "High-Fashion Headshot",
        "Create a high-fashion close-up headshot framed from upper chest to head. The subject is slightly angled but facing camera, with intense defined eyes, relaxed mouth, very subtle smile, refined editorial presence. Wardrobe: black turtleneck or high-neck black knit under a black tailored blazer, subtle fabric texture and lapel shape, close comfortable fit, sharp shoulder line, no boxy silhouette. Background: seamless deep black studio background. Lighting: strong controlled front/side editorial lighting, high contrast without harshness, catchlights in eyes, defined cheekbones and jaw, subtle falloff into shadow. Camera look: Phase One XF or Nikon Z8, 85-100mm portrait lens, premium high-fashion magazine style, ultra-realistic.",
    ),
    (
        "04-chiaroscuro-headshot",
        "Chiaroscuro Headshot",
        "Create a hyper-realistic cinematic black-and-white chiaroscuro portrait. The subject is seated at a three-quarter angle, leaning slightly forward with relaxed commanding posture. Face turned slightly away from camera, eyes looking off-camera, expression contemplative and composed. Hands near chest in a natural precise pose, fingers gently interlocked or resting correctly. One wrist may show a luxury black chronograph watch with detailed metal bracelet; one hand may wear a subtle silver ring. Hands must be anatomically correct. Wardrobe: sharp black suit jacket over white dress shirt with top buttons open, elegant slim fit, clean lapels, slim sleeves, natural fabric folds, not oversized. Background: solid seamless black. Lighting: dramatic directional studio light from one side, rich contrast, clean shadow falloff. Camera look: 85mm portrait lens, shallow depth of field, ultra-sharp focus, cinematic monochrome.",
    ),
    (
        "05-warm-light-headshot",
        "Warm And Light Headshot",
        "Create a warm professional portrait. The subject stands upright in relaxed professional posture, shoulders soft, arms naturally relaxed, slight lean toward camera. Expression friendly, open, and confident, with a genuine soft smile and warm eyes. Wardrobe: light cream or beige blazer over pale blue or pastel blue button-up shirt, tailored professional fit, clean shoulder seam, lightly structured, tapered sleeves, natural drape. Background: soft neutral interior, warm beige or cream tones, subtle out-of-focus window or bookshelf detail. Lighting: natural warm window light, gentle highlights, no harsh glare. Camera look: Canon EOS R5, 85mm lens, shallow depth of field, refined LinkedIn/editorial professional portrait style, ultra-realistic.",
    ),
    (
        "06-turtleneck-headshot",
        "Turtleneck Headshot",
        "Create a cinematic ultra-realistic portrait before a vivid burnt-orange wall where bold diagonal sunlight casts geometric shadows. Camera angle slightly low. Subject looks slightly upward and to the right, not directly into lens, projecting quiet confidence and sophistication. Wardrobe: black turtleneck under a tailored black blazer, clean shoulder line, slim elegant fit. Add thin round glasses with subtle metal frame only if requested or clearly appropriate. Background: rich orange wall with clean diagonal light and shadow. Lighting: natural hard sunlight creating strong facial contrast, controlled highlights, no blown-out skin. Camera look: 8K cinematic editorial portrait, 85mm lens feel, shallow depth of field, crisp fabric texture and realistic facial detail.",
    ),
    (
        "07-authority-headshot",
        "Authority Headshot",
        "Create a sober authoritative portrait. The subject is standing or seated very still with perfectly balanced body, relaxed shoulders, straight back, and composed hands visible. Hands may rest together in front or relaxed in lap. Head slightly tilted forward, eyes steady, expression serious but human: calm, credible, focused, quietly powerful. Wardrobe: tailored navy suit with a baby blue shirt, narrow-to-medium lapels, fitted shoulders, tapered sleeves, no oversized jacket, no bulky padding. Minimal accessories, no loud watch or tie unless requested. Background: vast minimalist space, soft gray-blue gradient, or open architectural setting suggesting scale and responsibility. Lighting: soft naturalistic overcast light, balanced shadows, calm premium corporate atmosphere. Camera look: Nikon Z8, 85mm lens, executive restraint, ultra-realistic.",
    ),
    (
        "08-ceo-headshot",
        "CEO Headshot",
        "Create a contemporary CEO portrait. The subject stands with weight slightly shifted, leaning lightly against a modern architectural element such as a concrete column, glass wall, or office terrace railing. One hand casually in pocket, the other visible and relaxed. Posture confident but approachable, shoulders natural, back straight. Expression confident, approachable, and authoritative, with natural small smile and steady eyes. Wardrobe: tailored navy suit over baby blue shirt, clean shoulder fit, slim sleeves, modern lapels, slight waist shaping, no oversized silhouette. Background: modern office lobby, glass corridor, architectural terrace, or refined workspace, softly out of focus. Lighting: clean daylight with soft reflections, polished but natural, no harsh shadows. Camera look: Canon EOS R5, 50mm lens, high-end executive photography, shallow depth of field.",
    ),
    (
        "09-dramatic-headshot",
        "Dramatic Headshot",
        "Create a dramatic studio portrait. The subject stands tall with arms crossed but relaxed, shoulders open, head slightly turned, eyes intense but controlled. Expression serious, focused, cinematic, with quiet confidence rather than aggression. Wardrobe: black suit with a black or white shirt depending on contrast, tailored with clean shoulders, fitted sleeves, and no bulky padding. Background: dark studio gradient, deep charcoal fading to black. Lighting: strong key light with deep shadows, controlled rim light, cinematic contrast, premium film-poster mood. Camera look: RED V-Raptor, 85mm lens, ultra-realistic, high contrast, crisp details, no text, no logos, no distortion.",
    ),
]

IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif"}


GLOBAL_IDENTITY = """Use all supplied reference images as mandatory identity anchors for the same person. Preserve the exact real face shape, eye shape, nose shape, lips, jaw, forehead, skin tone, age, weight, body proportions, hairstyle, and natural facial structure. Do not beautify into a different model face. Keep personal details such as earrings, glasses, facial hair, moles, and hairline only when present in the references or explicitly requested. Make skin professional and matte while preserving pores, realistic texture, and natural undertones."""

GLOBAL_NEGATIVE = """Negative prompt: no face alteration, no change to eye shape, nose shape, lips, jaw, forehead, skin tone, age, weight, or body proportions. No oily skin shine, no excessive skin smoothing, no plastic skin, no beauty-filter look, no cartoon styling, no AI face, no distorted hands, no extra fingers, no warped body, no oversized clothing, no fake muscles, no text, no logos, no watermark, no blur, no noise, no artifacts."""


def expand_path(value: str) -> Path:
    return Path(value).expanduser().resolve()


def default_codex_script() -> Path:
    return Path.home() / ".agents" / "skills" / "codex-gpt-image" / "scripts" / "codex_gpt_image.py"


def skill_root() -> Path:
    return Path(__file__).resolve().parents[1]


def default_reference_dir() -> Path:
    return skill_root() / "assets" / "person-reference-images"


def default_style_reference_dir() -> Path:
    return skill_root() / "assets" / "reference-images"


def default_out_dir() -> Path:
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    return Path.home() / "Documents" / f"headshot-suite-{stamp}"


def build_prompt(title: str, look_prompt: str) -> str:
    return "\n\n".join(
        [
            f"{title}.",
            GLOBAL_IDENTITY,
            look_prompt,
            "Production requirements: professional headshot, realistic camera optics, refined wardrobe fit, clean background, accurate anatomy, realistic skin detail, crisp eyes, no text.",
            GLOBAL_NEGATIVE,
        ]
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate a 9-look professional headshot suite via codex-gpt-image.")
    parser.add_argument("--image", action="append", default=None, help="Reference image path. Provide 2-3 images.")
    parser.add_argument(
        "--reference-dir",
        default=str(default_reference_dir()),
        help="Directory to scan when --image is omitted. Defaults to this skill's assets/person-reference-images/.",
    )
    parser.add_argument("--out-dir", default=None, help="Output directory. Defaults to ~/Documents/headshot-suite-<timestamp>.")
    parser.add_argument("--codex-script", default=str(default_codex_script()), help="Path to codex_gpt_image.py.")
    parser.add_argument("--model", default="gpt-image-2", help="Image generation model.")
    parser.add_argument("--responses-model", default=None, help="Outer Responses model override.")
    parser.add_argument("--size", default="1024x1536", help="Output size, portrait by default.")
    parser.add_argument("--quality", default="auto", help="Image quality passed to codex-gpt-image.")
    parser.add_argument("--timeout", default="300", help="Per-image timeout in seconds.")
    parser.add_argument("--login-if-missing", action="store_true", help="Ask codex-gpt-image to start login if auth is missing.")
    parser.add_argument("--open-browser", action="store_true", help="Open browser during login when --login-if-missing is used.")
    parser.add_argument("--dry-run", action="store_true", help="Write prompts and manifest, print commands, do not generate.")
    return parser.parse_args()


def collect_reference_images(args: argparse.Namespace) -> list[Path]:
    if args.image:
        return [expand_path(image) for image in args.image]

    reference_dir = expand_path(args.reference_dir)
    if not reference_dir.exists():
        print(f"Reference image directory not found: {reference_dir}", file=sys.stderr)
        return []

    return sorted(
        path
        for path in reference_dir.iterdir()
        if path.is_file() and path.suffix.lower() in IMAGE_EXTENSIONS
    )


def main() -> int:
    args = parse_args()
    images = collect_reference_images(args)
    if not 2 <= len(images) <= 3:
        print(
            "Provide exactly 2-3 person reference images, either with --image or in assets/person-reference-images/.",
            file=sys.stderr,
        )
        return 2
    missing = [str(image) for image in images if not image.exists()]
    if missing:
        print("Missing reference image(s): " + ", ".join(missing), file=sys.stderr)
        return 2

    codex_script = expand_path(args.codex_script)
    if not codex_script.exists():
        print(f"codex-gpt-image script not found: {codex_script}", file=sys.stderr)
        return 2

    out_dir = expand_path(args.out_dir) if args.out_dir else default_out_dir()
    prompt_dir = out_dir / "prompts"
    prompt_dir.mkdir(parents=True, exist_ok=True)

    manifest = {
        "created_at": datetime.now().isoformat(timespec="seconds"),
        "generator": str(codex_script),
        "model": args.model,
        "responses_model": args.responses_model,
        "size": args.size,
        "quality": args.quality,
        "reference_images": [str(image) for image in images],
        "style_reference_dir": str(default_style_reference_dir()),
        "looks": [],
    }

    for slug, title, look_prompt in LOOKS:
        prompt_path = prompt_dir / f"{slug}.prompt.txt"
        output_path = out_dir / f"{slug}.png"
        prompt_path.write_text(build_prompt(title, look_prompt), encoding="utf-8")

        command = [
            sys.executable,
            str(codex_script),
            "generate",
            "--prompt-file",
            str(prompt_path),
            "--out",
            str(output_path),
            "--model",
            args.model,
            "--size",
            args.size,
            "--quality",
            args.quality,
            "--timeout",
            str(args.timeout),
        ]
        if args.responses_model:
            command.extend(["--responses-model", args.responses_model])
        if args.login_if_missing:
            command.append("--login-if-missing")
        if args.open_browser:
            command.append("--open-browser")
        for image in images:
            command.extend(["--image", str(image)])

        manifest["looks"].append(
            {
                "slug": slug,
                "title": title,
                "prompt": str(prompt_path),
                "output": str(output_path),
                "style_reference": str(default_style_reference_dir() / f"{slug.replace('-headshot', '-style-reference')}.png"),
                "command": command,
            }
        )

        print(" ".join(json.dumps(part) if " " in part else part for part in command))
        if not args.dry_run:
            subprocess.run(command, check=True)

    manifest_path = out_dir / "manifest.json"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    if args.dry_run:
        print(f"Dry run complete. Prompts and manifest written to {out_dir}")
    else:
        print(f"Headshot suite complete: {out_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
