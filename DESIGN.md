---
name: Pastel Blocks
version: 1.0.0
owner: Vince Pedres
mode: dark-first (light tokens defined, design for dark)
colors:
  dark:
    background: "#0D0D0F"
    surface: "#17171A"        # raised rows, inputs, inactive tabs
    surface-hover: "#222226"
    text: "#ECEBE8"           # off-white, never pure #FFF
    text-muted: "#8A8A8A"     # never darker than this for readable text
    text-faint: "#55555A"     # done/disabled only
    action: "#ECEBE8"         # primary button fill (text on it: #0D0D0F)
    error: "#E06A5A"
  light:
    background: "#FFFFFF"
    surface: "#FFFFFF"        # rows get a 1px #F0F0F0 ring instead of fill
    surface-hover: "#F5F5F4"
    text: "#1A1A1A"
    text-muted: "#9A9A9A"
    text-faint: "#C4C4C4"
    action: "#1A1A1A"         # text on it: #FFFFFF
    error: "#D9584A"
  pastels:                    # each has ONE meaning. Text on pastels is always #1A1A1A.
    connect:   { dark: "#F2CDB2", light: "#FBE3D2", chip: "#E9A57A" }  # peach: integrations, deploys, linking
    people:    { dark: "#BFD3F0", light: "#DFEAF9", chip: "#8DB0E6" }  # blue: clients, inbox, sharing, messages
    ai:        { dark: "#CFC3F0", light: "#E9E2F8", chip: "#A996E6" }  # lavender: anything an AI/agent does
    healthy:   { dark: "#C3DDBF", light: "#E0EFDF", chip: "#8FBF88" }  # sage: live, done, streaks, progress
    attention: { dark: "#EEDC9A", light: "#F8EFC8", chip: "#D9BE55" }  # butter: needs you, due, review, pending
typography:
  display: { family: "Rubik", weight: 500, letter-spacing: "-0.02em" }
  body:    { family: "M PLUS Rounded 1c", weight: 400 }
  scale: { xs: 11px, sm: 12px, base: 14px, md: 16px, lg: 18px, xl: 24px, xxl: 32px, hero: 40px }
radius: { chip: 6px, button: 12px, row: 14px, tile: 18px, pill: 999px }
spacing: { base: 4px, gap-tight: 6px, gap: 8px, section: 24px, page-x: 18px }
icons: { library: "Phosphor", weight: "regular", tile-weight: "duotone", size: 20px }
motion:
  fast: 120ms
  base: 200ms
  slow: 300ms           # hard max for UI feedback
  ease-out: "cubic-bezier(.2,.8,.2,1)"
  spring: "cubic-bezier(.3,1.6,.5,1)"
---

# Pastel Blocks

**One line:** Get in, get it, get out, and have a tiny moment of delight on the way.

Dark, calm, practical UI. Black and gray do all the structure. Pastel blocks appear only on the
few things that actually matter, and every pastel color has exactly one meaning. Fonts have rounded
ends. Everything responds to touch with small, fast motion.

## 1. Core principles (in priority order)

1. **Frictionless first.** Minimize clicks before the user starts doing the real thing. The main
   action of a screen must be visible without scrolling and reachable in one tap. Prefer sensible
   defaults over setup screens. Never ask for something you can infer.
2. **One screen, one job.** Each screen answers one question ("what's due?", "what do I record?",
   "what's next?"). Lead with that answer as a big number or short sentence.
3. **Color means something.** If a color doesn't carry meaning, it's gray.
4. **Cut the fluff.** For every element ask: "if I removed this, would anyone miss it?" If no, remove it.
5. **Motion is feedback, not decoration.** It answers "did that work?"

## 2. Color rules

- Background is near-black `#0D0D0F`. Never pure `#000`, never navy, never tinted purple.
- Structure (rows, inputs, nav, tabs) uses **neutral grays only**. No borders in dark mode; separate
  with tone (`surface` on `background`) and spacing.
- **Pastels go on tiles, chips and status dots only.** Never on backgrounds, body text, headings,
  icons in lists, or primary buttons.
- **Text on any pastel is always `#1A1A1A`**, in both modes. Pastel tiles are "light islands".
- In dark mode use the `dark` pastel values (slightly deeper, less milky). In light mode use `light`.
- Primary button = `action` (off-white in dark, near-black in light). It reads as "action", not "category".
- Status dots: sage = live/ok, butter = needs you/pending, gray = idle/paused, error red = broken.
- Error red is the only red in the system. Use it for errors and destructive actions (and the
  record dot in recording UIs). Never for decoration.
- Do not invent new pastel meanings per app. If something doesn't fit the five, it's neutral.

| Pastel | Meaning | Examples |
|---|---|---|
| Peach | connect | Notion connected, deploy to Vercel, link account |
| Blue | people | 3 clients waiting, shared with 1 person, inbox |
| Lavender | AI | AI recap, "break this into steps", summarized chip |
| Sage | healthy | Live, done today, 12 day streak, sync ok |
| Butter | needs you | Due Thu, review, expiring, uploading |

## 3. Tiles (the signature component)

- A tile is a rounded `18px` pastel block with `12-16px` padding, black text, and optionally a
  Phosphor duotone icon, a big number (`Rubik 500, 26px`) or a short line of text.
- **Max 3 tiles per screen.** Usually 2 in a row (`grid-cols-2`, gap `6-8px`), optionally one
  full-width tile below. More than 3 means something isn't actually important.
- A tile must be either informative (a number or state) or actionable (tapping does the thing).
  Actionable tiles end with a chip like `Connect ↗` or a short underlined action word.
- Order tiles by urgency: attention (butter) first, then the rest.
- No tiles for things that are fine and boring. "Everything's normal" goes in muted text.

## 4. Lists, rows and other components

- **Rows:** `surface` fill, `14px` radius, `12px 14px` padding, `6px` gap between rows. Title in
  body font 14-16px, meta in `text-muted` 12px, optional status dot (7px) or pastel chip on the right.
- **Primary button:** `action` fill, `12px` radius (not full pill), Rubik 500 14px, 12px vertical padding.
  One primary button per screen.
- **Secondary action:** `surface` fill button or plain text link with underline offset 3px.
- **Inputs/search:** `surface` fill, `14-16px` radius, no border, muted placeholder, leading icon,
  optional `/` shortcut hint chip.
- **Tabs / segmented nav:** text items in `text-muted`; active item gets `surface` pill fill and `text` color.
- **Chips:** `6px` radius, 11px Rubik 500, pastel `chip` color or pastel fill, black text.
- **Wordmark:** lowercase app name in Rubik 500 + a butter-yellow period: `sidequest.`
- **Greeting/header:** big Rubik line that states the situation ("3 quests today", "12 tasks found"),
  muted second line with context. Do NOT open with "Good to see you 👋" style filler.
- **Empty states:** one pastel tile that names the first action, so even an empty app is one tap
  from getting started.
- **Floating/overlay bars** (focus timer, player): `action` fill pill, dark text, live dot, monospaced
  or tabular numbers.

## 5. Typography

- Display/headings: **Rubik 500**, tight letter-spacing (-0.02em on 24px+).
- Body/UI text: **M PLUS Rounded 1c 400/500**.
- Use `font-variant-numeric: tabular-nums` for timers, counts and money.
- Hierarchy comes from size and color (text vs text-muted), not from boxes or borders.
- Sentence case everywhere. No ALL CAPS labels except tiny metadata if really needed.

## 6. Icons

- Library: **Phosphor Icons** (`@phosphor-icons/react` for React, `@phosphor-icons/web` otherwise).
- Weight `regular` in lists, nav and inputs. Weight `duotone` inside pastel tiles (icon color `#1A1A1A`).
- Size 18-20px in UI, 20-24px in tiles. Icons inherit `currentColor`; recolor via text color.
- **Never use sparkle, stars or magic-wand icons for AI.** Use a neutral glyph instead (for example
  Phosphor `Brain`, `Lightning`, `Cpu` or a simple dot/orbit), always on a lavender tile or chip.
- No emoji in UI chrome.

## 7. Motion and interactivity (required, not optional)

Every interactive element must visibly respond. Keep all feedback animations **≤ 300ms**.

| Interaction | Behavior |
|---|---|
| Press (buttons, tiles, rows) | scale to 0.96 on `:active`, spring ease, 120ms |
| Hover (pointer devices) | rows/inputs shift to `surface-hover`; tiles lift `translateY(-1px)` |
| Complete / check | circle fills sage, pops to 1.1 scale, text fades to faint, strikethrough draws left to right |
| Numbers changing | count up/down over ~600-700ms with ease-out cubic, never jump |
| Content appearing | fade + rise 8-10px, staggered 60-90ms per item |
| Loading | the wordmark's yellow period breathes (opacity 1 → 0.25 → 1, 2.4s); skeletons are `surface` blocks with a soft shimmer |
| Toggle / tab switch | active pill slides between items (layout animation), 200ms |
| Success after action | brief sage dot or chip appears, then settles |
| Destructive | confirm with an undo toast instead of a modal when possible (less friction) |

- Respect `prefers-reduced-motion: reduce`: disable movement, keep instant color changes.
- In React, prefer `motion` (Framer Motion) for layout/stagger, CSS for press/hover.

## 8. Frictionless checklist (run before shipping any screen)

- [ ] The main action is visible without scrolling and takes one tap.
- [ ] Top of screen states the situation in one line (number or sentence).
- [ ] ≤ 3 pastel tiles, each with one of the five meanings.
- [ ] Exactly one primary button.
- [ ] No borders in dark mode; separation via tone and spacing.
- [ ] Hidden actions (swipe, tap-to-skip) have a tiny hint text.
- [ ] Muted text is ≥ `#8A8A8A` on dark.
- [ ] Every clickable thing has press feedback; numbers count; lists stagger in.
- [ ] No sparkles, no gradients, no glassmorphism, no purple glow, no bento grid of 6+ cards.
- [ ] Removed everything nobody would miss.

## 9. Don'ts (explicit, agents must obey)

- No gradients, glassmorphism, glow, drop-shadow-heavy cards, neon.
- No pastel backgrounds behind whole sections or pages.
- No white text on pastel.
- No more than 3 pastel tiles on one screen. No bento grids.
- No ✨ sparkle/magic icons. No emoji in UI chrome.
- No pure black `#000` or pure white `#FFF` text in dark mode.
- No multi-step setup flows when a default would work.
- No animations slower than 300ms for feedback, no decorative looping motion (except the loading period).

## Project overrides (workout-tower)

Chosen by Vince for this app (his own prototype plus a Duolingo reference). These win over the rules above:

- **Font:** Nunito everywhere (headings 900, labels 800), not Rubik / M PLUS Rounded.
- **Chunky press:** primary buttons, pastel tiles and the Done button have a solid darker "lip"
  underneath (`.chunky`, `--lip` color) that squishes away on press, Duolingo style. Rows get a
  faint inner bottom edge.
- **Thick progress bars** (`.bar`), sage fill with a light top highlight.
- **Exercise tiles are colored by muscle group** on the workout screen (push blue, back sage,
  arms lavender, legs peach, core butter, custom gray). This is a sixth use of pastels, on purpose.
- **Tower materials** (wood, stone, iron, gold, diamond) are game art with textures and a solid
  depth face. Not UI chrome.
