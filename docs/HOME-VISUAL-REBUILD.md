# Home visual rebuild

Reference head: `6bbfde99` (`cursor/game-production-closeout-c08e`).
Rebuild branch: `cursor/home-visual-rebuild-c08e`.

## Before

The home was a tall wallpaper hero (~88dvh) with the selected title pinned low, four equal CTAs (Play / Daily Arcade / Party / Grand Prix), and three dashboard cards (Record / Rival / Daily) that advertised empty states.

The catalog lived in a uniform 4×2 grid under the fold. Six stacked sections followed (All Games, Challenges, Daily, Rivals, Continue, Activities). Changing games swapped the backdrop, accent, and title. The first other cover required a scroll. It read as a dark landing page that contained games, not as a launcher.

## After

The first viewport is a launcher dock: composed gameplay stage, one primary action, one contextual secondary, inline PB / rival when they exist, a compact mode stepper, and a horizontal GameRail that keeps several titles visible.

Below the fold there are at most two blocks: **Today in the arcade** (Daily + Grand Prix as events) and **People** (only if friends, rivals, or challenges exist). Activities is gone from the home. Continue is a rail mark and a contextual CTA, not a section.

A second pass tightened crops, lifted low-horizon subjects above the dock, docked copy onto the rail, and gave Play / mode / selection a shared chamfer-and-tick language.

## First viewport

```
header (wordmark tick · Games / Arcade · search · inbox · player)
composed stage (art + bloom + game glow + washes)
dock:
  genre · title · tagline
  PB / rival / daily chip   (omitted when empty)
  mode ‹ ›                  (if the game has modes)
  [ PLAY ]  secondary
GameRail (selected tile + 4–5 neighbours)
optional “n friends online”
```

At 1440×900 the rail and Play are in the first screen. Title sits in the lower-left so the art is the environment, not a banner above a landing.

## Game rail

Horizontal `listbox`. Click focuses. Click again on the focused tile plays. ArrowLeft / ArrowRight change focus. Enter plays.

Desktop: selected tile ~22rem 16:9 with a left accent bar and corner ticks. Idle tiles ~11.5rem 16:10 so artwork is readable, not a 4×5 sliver.

Mobile: `snap-start`, selected tile ~78vw, the next cover peeks. Touch targets stay ≥ 44px.

One mark per tile, priority: challenge → daily → continue → new. Friend avatars appear only when a friend is actually playing that game.

## Social presence

No invented activity.

- Focused game: rival avatar + win record, or a friend score if one is on the board.
- Rail: challenge / daily / continue / new, plus playing-friend avatars.
- Under the rail: “n friends online” when true.
- People: live friends, rivals, open challenges. The section is omitted when all three are empty.

## Events

Daily is a large editorial panel: remaining count, game chain, countdown. Grand Prix is a playlist with art chips and points or Enter. They are not hero pills and not dashboard cards.

## Empty state

A new player sees genre, title, tagline, Play, one Daily link if a daily exists, and the rail. No “No record yet” / “No rivalry yet” boxes. Missing PB, rival, and People simply do not render.

## Returning state

Fixture (`docs/qa-home-rebuild/home-returning-1440.png`):

- Personal best `82,400`
- Mika `2–3`
- Primary `Beat Mika`, secondary `Play`
- Rail mark `Challenge`
- `1 friend online`
- People lists Mika

## Performance

- Focused backdrop is `priority` / eager. Adjacent rail art is lazy.
- Desktop-only blurred bloom layer. No blur on small screens.
- Motion is CSS 320–380ms, disabled under `prefers-reduced-motion` / `html.reduce-motion`.
- Source JPGs stay in the 16–70 KB range. No video, no WebGL on the home.

## Screenshots

All under `docs/qa-home-rebuild/`.

| File | Viewport |
| --- | --- |
| `before/home-neon-1440.png` | Before, 1440×900 |
| `home-neon-1440.png` | Neon, 1440×900 |
| `home-velocity-1440.png` | Velocity, 1440×900 |
| `home-swarm-1440.png` | Swarm, 1440×900 |
| `home-sky-1440.png` | Sky, 1440×900 |
| `home-neon-1920.png` | Neon, 1920×1080 |
| `home-neon-1366.png` | Neon, 1366×768 |
| `home-neon-390.png` | Neon, 390×844 |
| `home-swarm-390.png` | Swarm, 390×844 |
| `home-sky-390.png` | Sky, 390×844 |
| `home-new-player-1440.png` | Empty guest |
| `home-returning-1440.png` | PB + rival + challenge |
| `home-neon-1440-full.png` | Full page desktop |
| `home-neon-390-full.png` | Full page mobile |
| `home-tablet-768.png` | 768×1024 |

Regenerate with `BASE_URL=http://127.0.0.1:3010 node scripts/qa-home-rebuild-screenshots.mjs`.

## Remaining weaknesses

- Swarm Protocol’s current capture is a tiny ship on near-black. The stage goes orange, but the subject stays a speck. A denser combat frame would do more than another crop.
- Idle rail tiles for Swarm / Velocity / Territory still read dark. The games are dark. Brightness on tiles helps only a little.
- Play is a chamfered accent slab. It wins the hierarchy, but it can still be read as a colored pill.
- Neon / Swarm still leave a large empty field because that is the real gameplay image. We did not invent key art.
- Friend avatars on tiles are easy to miss at 22px.
- Header chrome (search / settings / inbox) is still website-like.
- Today is two event panels, not one spectacular composition.
- Existing gameplay JPGs were re-cropped, not recaptured.
- Playwright visual snapshots for the home must be updated with this layout or CI visual tests will fail.
