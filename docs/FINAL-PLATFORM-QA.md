# Final platform QA

Base: `cursor/final-platform-games-seo-c08e` @ `f24d352`  
Head: `cursor/final-product-seo-qa-032a`

## IA kept

| URL | Role |
| --- | --- |
| `/` | Product / home |
| `/arcade` | Personalized command center, noindex |
| `/games` | Public SEO catalog |

Desktop nav: Games → `/`, **Catalog → `/games`**, Arcade → `/arcade`.  
Home now has a visible public catalog block (not sr-only).

## Surfaces

| Surface | State |
| --- | --- |
| Party create / join | Server code, 2s poll, ready toggle, honest "not on this instance" |
| Challenge magic | Fetches by code; payload optional hydrate |
| Inbox | Hydrates from `/api/inbox`; mark-read hits server |
| Crew | Empty until the player starts a **local preview** house |
| Friends / presence | Unchanged, already backend |
| Daily / GP | Still local, copy already honest |
| Pause | Resume, Restart, Controls, Settings, Exit to hub |
| Results | Result / score / PB / Retry / rematch or share / next game |
| Hubs | Visible Learn the game cluster |

## Social tests

- Unit: `tests/social-arcade.test.ts` — two identities, party + challenge + inbox
- E2E: `e2e/social.spec.ts` — two Playwright contexts

## Persistence caveat

Same Next process = shared social objects. A second serverless isolate will not see the first party's code until `0006_social_arcade.sql` is applied.
