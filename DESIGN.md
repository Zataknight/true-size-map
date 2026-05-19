# Design Brief

## Direction

Dark Cartographic Tech — Interactive geospatial comparison interface where equal-area map projection is the protagonist, supported by minimal, high-contrast UI controls.

## Tone

Brutalist-minimal meets data visualization. No decorative bloat, only functional geometry. Dark background reduces eye strain during extended exploration. Strong accent colors enable country differentiation.

## Differentiation

Multi-color country palette (distinct OKLCH hues per chart token) on deep charcoal background. Canvas-first composition with supporting card-based controls and stats. High saturation accents against dark background create visual drama without distraction.

## Color Palette

| Token      | OKLCH              | Role                                        |
| ---------- | ------------------ | ------------------------------------------- |
| background | 0.145 0.014 260    | Dark charcoal, primary surface              |
| foreground | 0.95 0.01 260      | Off-white, all text                         |
| card       | 0.18 0.014 260     | Slightly elevated card backgrounds          |
| primary    | 0.75 0.15 190      | Cyan/teal interactive states, buttons       |
| accent     | 0.75 0.15 190      | Same as primary; hover, focus, selection    |
| chart-1    | 0.75 0.18 195      | Teal (country color)                        |
| chart-2    | 0.65 0.22 310      | Magenta (country color)                     |
| chart-3    | 0.65 0.22 40       | Orange (country color)                      |
| chart-4    | 0.75 0.18 145      | Lime/green (country color)                  |
| chart-5    | 0.7 0.2 70         | Red (country color)                         |

## Typography

- Display: Space Grotesk (geometric, technical—section headings, labels, hero text)
- Body: Satoshi (clean sans—body text, UI labels, stats)
- Mono: JetBrains Mono (optional, stats/coordinates)
- Scale: hero `text-5xl md:text-7xl font-bold tracking-tight`; h2 `text-3xl md:text-4xl font-bold`; label `text-xs font-semibold uppercase tracking-widest`; body `text-base`

## Elevation & Depth

Minimal shadows (only on elevated card surfaces). No glows, no blurs. Depth achieved through background color variation (0.145 base, 0.18 cards) and border treatments, not z-depth effects.

## Structural Zones

| Zone    | Background           | Border         | Notes                              |
| ------- | -------------------- | -------------- | ---------------------------------- |
| Header  | card (0.18 0.014 260) | border-b       | Dark card with subtle border       |
| Canvas  | background           | —              | Full bleed, minimal padding        |
| Details | card (0.18 0.014 260) | border-t       | Stat cards grid below map          |

## Spacing & Rhythm

Base unit 0.5rem (8px). Header padding 1rem (16px). Canvas margin minimal (2rem max sides). Card gaps 1.5rem. Stat cards in 2–3 column grid with 1rem gap. Content grouping via color, not whitespace alone.

## Component Patterns

- **Buttons**: Filled accent color, no radius or 4px minimal, uppercase label `text-xs font-semibold`, hover: increase opacity/brightness
- **Cards**: 0.5rem border-radius, border-b or border-t with border color, no shadow
- **Search input**: border-b only, transparent background, placeholder muted foreground
- **Badges**: Inline chart color tokens for country indicators, no fill background

## Motion

- **Entrance**: No animations. Instant render favors responsiveness.
- **Hover**: Button/card opacity shift 0.3s ease, drag visual feedback via cursor + subtle scale
- **Drag**: Canvas country highlight on mouseover, cursor change to grab/grabbing

## Constraints

- No gradients, patterns, or textures
- Map canvas is always full-width center focus
- All controls must be keyboard-accessible (tab/arrow navigation)
- Stats cards must maintain 2:1 aspect ratio minimum
- No animations on initial page load

## Signature Detail

Chart colors are intentionally saturated and distinct—high chroma (0.18–0.22) against dark background creates visual pop, making each country immediately recognizable without relying on labels.
