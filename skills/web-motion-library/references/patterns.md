# Web Motion Patterns & Components

## Pattern 1: Hover Motion Grid (Codrops / sink.design)
**Use for:** Interactive image grids with mouse-responsive movement and intro animations

### Concept
Rows of images (or text) move in sync with mouse movements. The entire grid is rotated for visual interest. Can serve as an introductory animation — clicking an "enter" button expands the center image to fullscreen and reveals content beneath.

### Key Behaviors
- Mouse position controls row offset (parallax-like)
- Grid rotation adds depth (typically 15-30 degrees)
- Filter animations (blur, contrast) on hover
- Center image can expand to fullscreen on click
- Content slides in after the intro animation completes

### Reference
- Source: sink.design "Play" experiments
- Inspiration: Nick Hart (Dribbble) for enter-button reveal pattern

---

## Pattern 2: Morphing Background Shapes (Codrops)
**Use for:** Organic SVG shape transitions behind content

### Concept
Background shapes morph between organic forms using SVG path animation. Creates an exhibition or gallery aesthetic where content overlays animated abstract shapes.

### Key Behaviors
- SVG paths transition between defined shapes
- Works as background layer behind text/images
- Smooth easing transitions between states
- Can be triggered by scroll, hover, or auto-animate

---

## Pattern 3: Full-Screen Hero Section (Viktor Oddy)
**Use for:** Landing page hero with background video, bold typography, custom CTA

### Specification
1. **Layout & Positioning:**
   - Container: min-h-screen, dark blue fallback (#21346e)
   - Content alignment: TOP of page (not centered), pt-32 mobile / pt-48 desktop
   - Standard container with horizontal padding

2. **Background Video:**
   - Full-screen, absolute-positioned
   - autoPlay, loop, muted, playsInline
   - object-cover for distortion-free fill

3. **Typography (Headline):**
   - Font: Rubik (Google Fonts), Bold, Uppercase, White
   - Three lines: "NEW ERA" / "OF DESIGN" / "STARTS NOW"
   - Sizing: text-6xl → text-8xl → text-[100px]
   - Line height: 0.98, Letter spacing: -2px to -4px

4. **Custom CTA Button:**
   - Fixed: 184px x 65px
   - Hover: scale-105, Active: scale-95
   - Background: SVG element (absolute inset-0) with custom path, filled white
   - Label: "GET STARTED", Rubik Bold Uppercase 20px, color #161a20

---

## Pattern 4: Magic UI Component Library

### Overview
50+ free, open-source animated components. React + TypeScript + Tailwind CSS + Framer Motion. Designed as a shadcn/ui companion — install individually.

### Key Components

| Component | What It Does | Use Case |
|-----------|-------------|----------|
| **Marquee** | Infinite horizontal/vertical scroll | Logo strips, testimonial tickers |
| **Shine Border** | Animated gradient border glow | Featured cards, CTAs |
| **Circles** | Concentric expanding rings | Hero backgrounds, loading states |
| **Ripple** | Click/hover ripple effect | Buttons, interactive elements |
| **Globe** | 3D rotating earth | International/global features |
| **Dock** | macOS-style icon dock | Navigation, app launchers |
| **Bento Grid** | Animated grid layout | Feature showcases |
| **Number Ticker** | Animated counting numbers | Stats, metrics displays |
| **Animated List** | Staggered item animations | Notification feeds, activity logs |
| **File Tree** | Animated file browser | Documentation, code structure |
| **Terminal** | Typing terminal animation | CLI demos, code showcases |

### Installation
Components are installed individually (not a monolithic package):
- Visit magicui.design
- Browse components by category
- Copy/paste or install via CLI
- Customize with Tailwind classes

### Companies Using Magic UI
Used by YC-backed startups, Vercel AI Accelerator winners, and companies with notable investor backing. Proven at scale for landing pages and marketing sites.

---

## Animation Decision Tree

```
Need animation for landing page?
├── Hero section → Viktor Oddy Hero (Pattern 3)
├── Mouse-interactive grid → Hover Motion (Pattern 1)
├── Background shapes → Morphing Shapes (Pattern 2)
├── Pre-built component → Magic UI (Pattern 4)
│   ├── Scrolling content → Marquee
│   ├── Highlighted card → Shine Border
│   ├── Stats display → Number Ticker
│   ├── Activity feed → Animated List
│   └── Navigation → Dock
└── Custom animation → Framer Motion primitives
```

---

## Visual Examples

### Viktor Oddy Hero Section Demos
- [Hero Demo 1](images/hero_demo_1.mp4)
- [Hero Demo 2](images/hero_demo_2.mp4)
