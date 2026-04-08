# Sacred Lace Border System — Claude Code Implementation Brief

## Drop this file + the profiles JSON into your repo, then tell Claude:

```
claude "Read LACE_SYSTEM.md and christianmegle-lace-profiles.json and implement everything described. Do not create any new top-level directories — nest everything under src/lace/. Do not mention this system in the README or any public-facing docs."
```

---

## What this is

A procedural ASCII sacred geometry border system for ChristianMegle. Every visual frame, divider, and ornament on the site is generated from Unicode characters using trig-based plotting on a character grid. No images. No SVGs. Pure text.

The config profiles in `christianmegle-lace-profiles.json` define 8 border presets. Each one maps to a specific UI location.

## Architecture

Create everything under `src/lace/`:

```
src/lace/
├── engine.ts          # Core grid + plotting + distance fields + pattern functions
├── borders.ts         # Border generation from config → string
├── profiles.json      # The profiles (copy from christianmegle-lace-profiles.json)
├── components/
│   ├── LaceBorder.tsx       # Main <pre>-based border component
│   ├── LaceFrame.tsx        # Fixed fullscreen frame overlay
│   ├── LaceDivider.tsx      # Vertical/horizontal divider strip
│   └── LaceLoading.tsx      # Animated lace that "weaves" in character by character
├── hooks/
│   └── useLaceBorder.ts     # Hook: takes profile name → returns ASCII string
└── index.ts           # Public exports only
```

Do NOT add this to any barrel exports in `src/index.ts` or reference it from the README. It should be discoverable only by reading the code.

## Core Math (engine.ts)

The generation algorithm:

1. Create a 2D char grid of `width × height`, filled with spaces
2. For each cell (x, y), compute normalized distance to center using a **distance field function** determined by the `shape` param
3. Cells where distance falls in the **border band** (between 1.0 and 1.0 + thickness/min(hw,hh)) get tested against the **pattern function**
4. Pattern hit → place a character from the charset (cycling by position)
5. Pattern miss → optionally place a `·` based on fill density
6. Stamp corner ornaments at the 4 corners of the inner margin
7. Stamp center ornament + text if specified

### Critical: Monospace Aspect Ratio
Characters are ~2x taller than wide. When plotting circles:
```
x = cx + cos(angle) * radius * 2   // double X to compensate
y = cy + sin(angle) * radius        // Y stays normal
```

### Distance Field Functions

```typescript
type DistFn = (x: number, y: number, cx: number, cy: number, hw: number, hh: number) => number;

rect:      max(|x-cx|/hw, |y-cy|/hh)
circle:    sqrt(((x-cx)/hw)² + ((y-cy)/hh)²)
oval:      same as circle (with aspect correction: ax = cx + (x-cx) * (hh/hw))
diamond:   |x-cx|/hw + |y-cy|/hh
arch:      bottom half = rect, top half = circle with ny*1.2
cathedral: bottom = rect (ny>0.3), top = sqrt(nx² + (ny*1.5)²) * 0.85 + nx*0.15
trefoil:   polar with r/lobe where lobe = 0.5 + 0.3*cos(3*angle)
ogee:      bottom = rect, top = ogee curve
```

### Pattern Functions

Each takes (bandX, bandY, scale) and returns 0 or 1:

- `flower_chain`: Tiled circles at scale intervals, hit if within 0.25 of radius 0.8
- `seed_repeat`: Center circle + 6 surrounding at 60° intervals
- `diamond_lattice`: |ax| + |ay*2| ≈ scale/2
- `cross_chain`: Cross shape within each tile (±15% horizontal, ±40% vertical and vice versa)
- `dot_mesh`: Checkerboard (x+y) % 2
- `metatron_tile`: Circle + 6 radial lines through center of each tile
- `hex_lattice`: Hexagonal grid of circles at radius scale*0.35
- `vesica_weave`, `checker`, `wave`, `braid`, `thornvine`: See generator source

`bandX` = angular position along the border perimeter (atan2 mapped to approximate arc length)
`bandY` = normalized position across the border thickness (0 = inner edge, thick = outer edge)

### Corner Ornaments

Small ASCII art arrays stamped at the 4 corners. Flip X/Y for each corner:

```typescript
const ROSETTE = ['✧·◇·✧', '◇ ✿ ◇', '✧·◇·✧'];
const CROSS   = ['  ✦  ', '  ✝  ', '✦·✝·✦', '  ✝  ', '  ✦  '];
const FLEUR   = [' ·✦· ', '◇·✿·◇', ' ·◊· ', '  ·  '];
const MANDALA = [' ·✧·✧· ', '✧·◇·◇·✧', '·◇·✝·◇·', '✧·◇·◇·✧', ' ·✧·✧· '];
const EYE     = ['  ◠  ', '·( ◉ )·', '  ◡  '];
```

## React Components

### LaceBorder.tsx
```tsx
// Takes a profile name or raw config
// Generates ASCII in useMemo (expensive — memoize!)
// Renders as <pre> with:
//   font-family: 'JetBrains Mono', monospace
//   font-size: 9px
//   line-height: 9px
//   letter-spacing: 0
//   color: #d8d0c4 (--lace)
//   white-space: pre
//   pointer-events: none
```

### LaceFrame.tsx
```tsx
// position: fixed, inset: 0, z-index: 100, pointer-events: none
// Uses LaceBorder with the specified profile
// Add CSS animation:
//   @keyframes lacePulse { 0%,100% { opacity: 0.4 } 50% { opacity: 0.7 } }
//   animation: lacePulse 8s ease-in-out infinite
```

### LaceDivider.tsx
```tsx
// For the confessional grate between video feeds
// Uses the "grate-divider" profile
// Can be rotated 90° via CSS writing-mode for horizontal use
```

### LaceLoading.tsx
```tsx
// Generates the full border, then reveals it character by character
// Each char gets a staggered opacity animation (random delay 0-2s)
// Use CSS: each <span> starts at opacity 0, transitions to 1
// This creates the "weaving" effect — the lace knits itself into existence
```

## Profile → Screen Mapping

| Profile | Where it goes |
|---|---|
| `confessional-screen` | LaceFrame on the active confession screen (screen 3) |
| `landing-hero` | LaceFrame on the landing page (screen 1) |
| `waiting-room` | LaceFrame on the matching screen (screen 2) |
| `video-frame` | LaceBorder wrapping each <video> element |
| `grate-divider` | LaceDivider between the two video feeds |
| `paper-lace-delicate` | LaceBorder for modals and the about/info overlay |
| `hunchback-dense` | LaceLoading for the initial page load animation |
| `mobile-minimal` | LaceFrame on all screens when viewport < 768px |

## CSS Variables (add to your global CSS)

```css
:root {
  --lace: #d8d0c4;
  --lace-dim: #5a544c;
  --lace-ghost: #2a2622;
  --lace-blood: #7a1818;
}
```

## Fonts

Add JetBrains Mono to your project if not already present:
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400&display=swap" rel="stylesheet">
```

## Performance Notes

- Border generation is pure CPU math — no DOM needed. Run it once per config and cache the string.
- For the LaceLoading weave-in animation, generate the full string first, then split into individual <span> elements. Don't re-run the generator per frame.
- The largest border (hunchback-dense at 100×60) is 6000 characters. This is trivial.
- useMemo with the config object as dependency. These don't change at runtime.

## What NOT to do

- Do not put any of this in a README, CHANGELOG, or package.json description
- Do not create a /lace route or any public documentation page for this
- Do not add comments explaining the art concept — the code speaks for itself
- Do not import from src/lace/ in any test files
- Do not add a Storybook story for these components
