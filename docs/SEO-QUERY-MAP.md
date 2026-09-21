# SEO query map

Branch: `cursor/final-platform-games-seo-c08e`  
Source of truth: `apps/web/content/`  
Language: English only. No `/fr` clones in this pass.

This map records **why a page exists**. Lexical variants that do not change intent (`free X game`, `X game online`) share a page.

---

## Core

| URL | Intent | Primary queries | Secondary | Why it exists | Parents | Children | Source | Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/` | Product home | gamesweb, browser arcade | play first keep going | The product, not a doorway | — | `/games`, hubs | brand + 8 manifests | INDEX |
| `/games` | Public catalog | browser games, gamesweb games | free online games catalog | Discovery shelf distinct from `/arcade` | Home | hubs, collections, guides | GAME_MANIFESTS | INDEX |
| `/guides` | Guide directory | gamesweb guides, how to play browser games | [game] guide | Browse by game/need, not a blog dump | Home, `/games` | 8 guides | editorial + howToPlay | INDEX |
| `/collections` | Collection directory | browser game collections | skill games, quick games | Index of 7 curated shelves | Home, `/games` | 7 collections | COLLECTIONS | INDEX |
| `/about` `/privacy` `/terms` | Legal/trust | gamesweb about/privacy/terms | guest progress | Required public trust pages | Home / footer | each other | brand copy | INDEX |
| `/arcade` | Product command center | — | — | Personalized; not the catalog | chrome | — | player store | **NOINDEX follow** |
| `/play/[slug]` | Play session | — | — | Transient runtime. Canonical = hub | hub / guides | — | GameView | **NOINDEX follow** |

---

## Per-game cluster

Created only from live manifests + `GAME_EDITORIAL`. Sky Stack has no strategy page (the how-to already is the whole verb). Neon adds tracks + scoring. Velocity adds courses + scoring.

| URL pattern | Intent | Primary | Secondary | Why | Parents | Children | Source | Index |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `/games/[slug]` | Canonical landing | [game] online, [game] browser | [kind] game | One public landing per title | `/games`, collections | cluster + related | manifest + editorial | INDEX |
| `/games/[slug]/guide` | Master guide | [game] guide | how [game] works | Distinct overview linking the cluster | hub, `/guides` | how-to, controls, strategy | editorial.run + whyDistinct | INDEX |
| `/games/[slug]/how-to-play` | First-run instructions | [game] how to play | [game] tutorial | Exact `howToPlay` + FAQ from code | hub, guide | hub, play | manifest.howToPlay / faq | INDEX |
| `/games/[slug]/controls` | Input map | [game] controls, [game] keys | keyboard / touch | Exact `controls[]` | hub, guide | hub, play | manifest.controls | INDEX |
| `/games/[slug]/strategy` | Skill advice | [game] tips, [game] strategy | medals / gates / builds | Concrete lines from scoring/courses/upgrades | hub, guide | hub, siblings | editorial.strategy | INDEX (7 games) |
| `/games/[slug]/achievements` | Trophy list | [game] achievements | trophies XP | Exact achievement defs | hub, guide | hub | manifest.achievements | INDEX |
| `/games/neon-drift/tracks` | Track list | neon drift tracks | Harbour Loop, Hairpin, Ridge | 3 authored circuits in `TRACKS` | hub, guide | hub | games/neon-drift track.ts | INDEX |
| `/games/neon-drift/scoring` | Score rules | neon drift scoring | combo, bank | `SCORE` constants + DriftScore | hub, guide | hub | neon config + scoring.ts | INDEX |
| `/games/velocity-run/courses` | Course list | velocity run courses | Gate A, Needle, Rushline | 12 authored courses | hub, guide | hub | velocity worlds 1–3 | INDEX |
| `/games/velocity-run/scoring` | Medal rules | velocity run medals | platinum times | medalFor + authored targets | hub, guide | hub | courses.ts medals | INDEX |

No `/modes` pages: Neon modes are the three tracks; Velocity modes are the twelve courses; Swarm `survival`/`seed` is not a separate reader need.

---

## Collections (7)

Each requires ≥3 real games and a unique rationale. No tag pages with one game.

| URL | Intent | Primary | Games | Index |
| --- | --- | --- | --- | --- |
| `/collections/quick-games` | short sessions | quick browser games | Sky, Pocket, Crowd, Velocity | INDEX |
| `/collections/skill-games` | mechanical skill | skill browser games | Neon, Velocity, Knockout, Swarm | INDEX |
| `/collections/score-attack-games` | higher-is-better | score attack browser games | Neon, Sky, Swarm, Territory, Crowd | INDEX |
| `/collections/keyboard-games` | WASD/arrows | keyboard browser games | Neon, Velocity, Swarm, Knockout, Territory, Crowd | INDEX |
| `/collections/mobile-games` | thumbs-first | mobile browser games | Sky, Crowd, Pocket, Neon | INDEX |
| `/collections/competitive-games` | ghosts / async | competitive browser games | Velocity, Knockout, Neon, Territory | INDEX |
| `/collections/arcade-games` | retry spectacle | arcade browser games | Neon, Sky, Crowd, Knockout | INDEX |

Parents: `/collections`, `/games`, Home. Children: listed hubs.

---

## Explicitly not created

- Per-level `/tracks/[id]`, `/courses/[id]`, `/maps/[id]`, `/tables/[id]`
- City/location doorways
- `free X game` / `X game online` duplicates
- Swarm `/builds` as a separate index (upgrades live in the guide/strategy)
- Sky strategy
- Indexed Daily / GP / Friends / Profiles / Leaderboards / Achievements app / Party / Crew
