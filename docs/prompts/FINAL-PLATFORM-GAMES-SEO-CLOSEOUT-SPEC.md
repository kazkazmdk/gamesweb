# FINAL PLATFORM + GAMES + SEO CLOSEOUT

## Branch / base

Work on:

`cursor/final-platform-games-seo-c08e`

Base:

`cursor/game-art-direction-rebuild-c08e` @ `c7e307cceec8d876b5f6e65134ba318e735fc222`

Do not merge.

This is the final consolidation pass for:
1. remaining game-art P1 fixes,
2. remaining platform polish / QA,
3. SEO architecture and useful public discovery surfaces.

Do not restart finished work.

---

# 0. Mission

Gamesweb should leave this branch as:

- a coherent premium platform,
- eight visually distinct browser games,
- no major P0/P1 visual regressions,
- a crawlable public content graph around those games,
- enough useful indexable surfaces for Google to understand Gamesweb as a browser-games platform,
- no thin / doorway / scaled-content abuse.

We currently have only a very small SEO surface:
- Home,
- Arcade,
- About / Privacy / Terms,
- 8 game hubs.

That is technically clean but insufficient for broad organic discovery.

The answer is NOT to create hundreds of near-duplicate pages.

The answer is to build useful topical clusters around each real game and a small number of curated collection hubs.

---

# 1. Hard rules

## Do not

- redesign Home from scratch;
- undo the current platform visual language;
- undo the 8-game art-direction split;
- create fake social content;
- create fake reviews/ratings;
- generate 500 thin SEO pages;
- create city/location doorway pages;
- create dozens of tag pages with one game each;
- auto-generate generic AI copy for keyword coverage;
- create pages whose only purpose is to funnel to /play;
- index private/user-specific routes;
- index URL parameter variants;
- create fake FAQ schema / rating schema / video schema;
- hide essential SEO copy exclusively behind client-only rendering;
- update snapshots blindly.

## Do

- preserve current mechanics;
- close the remaining admitted P1 art gaps;
- QA all important platform states;
- make public content server-rendered and crawlable;
- use actual game mechanics as the source of editorial value;
- link every indexable page into a navigable hierarchy;
- keep canonical rules explicit;
- keep sitemap limited to real indexable URLs;
- keep user utility stronger than keyword targeting.

---

# 2. PHASE A — FINISH THE GAMES

The previous art-direction rebuild was a major improvement, but its own report admits these remaining P1s.

Close them before moving to SEO.

## A1 — Territory Rush

Current remaining failure:
- peak still does not show map-dominating paint transformation;
- debug fill grows only a small area;
- toy houses can dominate more than ownership state.

Fix:

- make trail risk more visually obvious;
- loop closure must trigger a strong visible fill wave;
- captured region should visibly settle into ownership;
- use a brief camera / pulse / score payoff without obscuring play;
- at medium/peak state, territory color must dominate the map;
- environment dressing must recede behind ownership state;
- capture screenshots for:
  - exposed trail,
  - loop closing,
  - fill wave,
  - 25%+ ownership state,
  - peak.

Acceptance:
A nameless screenshot should immediately communicate "territory capture game", not "toy city grid".

## A2 — Crowd Control

Current remaining failure:
- gates are readable but still simple green bars;
- road/buildings remain flat;
- arithmetic decision is not the visual composition.

Fix:

- turn gates into huge saturated readable signs;
- gate values must dominate the decision frame;
- use distinct positive / multiplier / risk gate treatments;
- compress crowd entering gates and re-expand after;
- make +N / xN before→after physically obvious;
- add stronger boulevard/plaza/festival depth without obscuring crowd;
- show 10 / 30 / 80 / 120+ pack states.

Acceptance:
A +30 or x2 choice should be understandable from one screenshot without text explanation.

## A3 — Neon Drift

Current remaining failure:
- roadside remains sparse at default camera;
- navy margins too empty;
- no truly authored corners / zones.

Fix:
Create at least three recognizable environmental beats visible during normal driving:
1. sodium-lit service area / pit turnout,
2. tighter vegetation / mountain touge corner,
3. tunnel / underpass / dense roadside zone.

Do not alter the track collision logic unless required.

Also:
- keep tutorial v2;
- verify returning player with old v1 key sees v2 exactly once;
- reduce tutorial overlay obstruction if it hides the road;
- improve smoke / marks / bank payoff, not generic neon.

Acceptance:
Three gameplay screenshots from different track sections must look like different places.

## A4 — Swarm Protocol

Current remaining failure:
- peak state is not yet survivor-density spectacle;
- enemy silhouettes remain too abstract.

Fix:
- increase visible escalation without destroying performance;
- expand enemy silhouette families;
- improve drop / hit / death readability;
- make player power create visible space in the horde;
- keep a clear contrast pocket around the player;
- preserve quality tiers.

Capture:
opening, 15s, medium density, peak density, payoff / elite or boss.

Acceptance:
Peak must look dramatically stronger and more dangerous than opening.

## A5 — Velocity Run vs Knockout Circuit

Current remaining failure:
- both occupy daylight / blue-sky territory and can still feel related.

Push them farther apart.

Velocity:
- architectural, restrained, ivory/cobalt/orange;
- real rooftop location kits;
- create at least 3 visibly different route zones:
  HVAC roof / crane-transit zone / comms ascent.

Knockout:
- saturated toy-show;
- stronger warm/yellow/coral/cyan;
- foam/plastic/rubber material feeling;
- larger obstacle silhouettes;
- spectator/signage/event language.

Acceptance:
No one should confuse a Velocity screenshot with Knockout after titles are hidden.

## A6 — Pocket Striker / Sky Stack

Do not over-redesign these.

Pocket:
- add enough authored tabletop context to avoid empty felt;
- preserve aim clarity.

Sky:
- strengthen sky progression / horizon identity;
- preserve one-action simplicity.

---

# 3. PHASE B — FINAL PLATFORM QA

Do not redesign the platform. Close consistency and state-quality gaps.

Audit:

- Home
- Arcade
- every Game Hub
- Results
- Pause
- Daily
- Grand Prix
- Challenges
- Friends
- Inbox
- Party
- Crew
- Leaderboards
- Profile self
- Profile public/empty
- Achievements
- Settings
- Play index

Check at:
- 1920
- 1440
- 1366
- 768
- 390

## Platform acceptance

### Home
- preserve current design;
- no regression from game art changes;
- all eight new game worlds still crop well in launcher art.

### Game Hubs
- one dominant Play CTA;
- actual game art/world identity above fold;
- no duplicate primary CTA;
- related games useful;
- content below fold readable;
- SEO copy should not feel bolted on.

### Results
- game-aware zero-state copy;
- score / PB / medal / comparison / progression hierarchy;
- one dominant next action;
- max two secondary actions;
- no generic "banked" language outside Neon.

### Social / empty states
- no invented activity;
- empty states intentional, not giant dead screens;
- no developer-copy tone.

### Leaderboards
- useful even when honest dataset is small;
- no fake rows.

### Achievements
- trophy/collectible feeling retained;
- no return to SaaS catalog.

### Platform visual test
Use screenshots, not code inspection only.

Create:
`docs/qa-final-closeout/platform/`

and record unresolved issues honestly.

---

# 4. PHASE C — SEO AUDIT FIRST

Before creating routes, audit the existing SEO implementation.

Current known files include:
- `apps/web/app/layout.tsx`
- `apps/web/app/robots.ts`
- `apps/web/app/sitemap.ts`
- `apps/web/lib/seo.ts`
- `apps/web/app/games/[slug]/page.tsx`

Document findings in:
`docs/SEO-SURFACE-AUDIT.md`

## Known issue to verify immediately

Current `gameSeoTitle()` appears to map:
- Driving → Drift Game
- Platformer → Parkour Game
- every other genre → Survival Game

That is not acceptable.

Do not let Pocket Striker / Knockout / Territory / Sky / Crowd receive a generic "Survival Game" SEO title.

Create exhaustive game-/genre-aware search titles with no misleading fallback.

---

# 5. SEO STRATEGY — INITIAL INDEXABLE SURFACE

Initial target:

**approximately 55–80 high-quality public indexable URLs.**

Do NOT target 500 URLs in this pass.

Gamesweb has only 8 first-party games. A 500-page surface now would force repetition.

Scale later through:
- more games,
- real updates,
- genuinely new mechanics/modes,
- earned editorial content,
- user demand from Search Console.

Quality gate beats URL count.

---

# 6. PUBLIC INFORMATION ARCHITECTURE

Build a real browseable hierarchy.

Recommended public routes:

## Core catalog
- `/`
- `/games`
- `/games/[slug]`
- `/arcade`

## Per-game content cluster

For EACH of the 8 games, create only useful pages backed by real mechanics:

- `/games/[slug]/guide`
- `/games/[slug]/how-to-play`
- `/games/[slug]/controls`
- `/games/[slug]/strategy`
- `/games/[slug]/achievements`

Optional ONLY where truly distinct:
- `/games/[slug]/modes`
- `/games/[slug]/scoring`
- `/games/[slug]/tracks`
- `/games/[slug]/courses`

Do not force every optional subtype onto every game.

Examples:
- Neon can justify tracks + scoring.
- Velocity can justify courses + medals.
- Swarm can justify builds/upgrades only if actual build systems exist.
- Sky should NOT get five artificial pages if the content would repeat.

Each game cluster should have a master guide that links to the useful subpages.

## Curated collection hubs

Create a small number of collection pages where at least 3 games genuinely qualify.

Candidate families:
- `/collections/quick-games`
- `/collections/skill-games`
- `/collections/score-attack-games`
- `/collections/keyboard-games`
- `/collections/mobile-games`
- `/collections/single-player-games`
- `/collections/competitive-games`
- `/collections/arcade-games`

Only create a collection if:
- at least 3 real games qualify;
- the intro / selection rationale is unique;
- it is browsable from /games or /collections;
- it has actual utility beyond keyword matching.

Add:
- `/collections`

## Guides root

Add:
- `/guides`

This should browse by game and user need, not become an article dump.

---

# 7. CONTENT QUALITY RULES

Every indexable editorial page must answer a real user need.

## Do not use word count as the primary quality metric.

Instead require:

- direct answer above fold;
- accurate mechanics derived from source code/manifests;
- concrete controls / scoring / strategy where relevant;
- examples specific to the game;
- links to the exact playable experience;
- links to neighboring useful pages;
- no fluff introduction;
- no keyword stuffing;
- no paraphrased duplicate text.

## Per-game guide content

Use actual data from:
- manifests,
- controls,
- modes,
- scoring constants,
- achievement definitions,
- track/course definitions,
- game runtime behavior.

Editorial copy must reflect the actual implementation.

Do not invent:
- upgrades that do not exist,
- multiplayer that does not exist,
- difficulty modes that do not exist,
- progression that does not exist.

## Visual value

Where useful, include original:
- diagrams,
- annotated gameplay screenshots,
- control diagrams,
- scoring examples,
- route/track cards.

Do not scrape competitor screenshots.

---

# 8. QUERY / INTENT MAP

Before finalizing content, create:

`docs/SEO-QUERY-MAP.md`

For each indexable page family record:

- page URL,
- primary search intent,
- primary query family,
- secondary query family,
- why this page deserves to exist,
- internal-link parents,
- internal-link children,
- source-of-truth data,
- index / noindex decision.

Examples of query families:
- "[game] online"
- "[game] how to play"
- "[game] controls"
- "[game] tips"
- "[game] scoring"
- "free browser skill games"
- "quick browser games"
- "keyboard browser games"

Do not create pages for zero-value keyword variants.

Do not create separate pages for tiny lexical variations like:
- free X game,
- free online X game,
- X game online,
unless the user intent and content actually differ.

---

# 9. INDEX / NOINDEX MATRIX

Create:
`docs/SEO-INDEX-MATRIX.md`

Default principles:

## INDEX
- Home
- /games
- /arcade if public/static enough
- /games/[slug]
- useful per-game guide pages
- valid collection hubs
- /guides
- About
- legal pages if desired

## NOINDEX, FOLLOW
For personalized / utility / transient surfaces:
- /play/*
- /auth/*
- /me
- /settings
- /friends
- /inbox
- /party/*
- /crew
- challenge invitation variants
- personalized daily/session variants
- parameterized run URLs

Review:
- /leaderboards
- /achievements
- /profile/*
- /daily
- /grand-prix
- /challenges

Only index these if:
1. they are public,
2. content is stable,
3. SSR has substantive public value,
4. no user-specific leakage,
5. canonical behavior is clean.

Otherwise noindex/follow.

Do not block noindex pages in robots.txt in a way that prevents crawlers from seeing the noindex directive.

API routes should not be indexable.

---

# 10. CANONICAL RULES

One canonical public landing page per game:
`/games/[slug]`

`/play/[slug]` is NOT the SEO landing page.

For:
- challenge params,
- daily params,
- seed params,
- party params,
- campaign/tracking params,

use clean canonicals and/or noindex where appropriate.

No duplicate canonicals across unrelated content.

Every indexable page must self-canonicalize unless intentionally canonicalized elsewhere.

Add automated tests for:
- unique canonical,
- no localhost canonical in production config,
- no parameterized canonical leakage.

---

# 11. STRUCTURED DATA

Audit current JSON-LD.

Google supports software app structured data with `GameApplication`, and for web apps it supports `WebApplication`; if using `VideoGame`, co-type it with an eligible application type rather than relying on VideoGame alone.

Implement truthful structured data only.

## Game hub
Use a graph containing appropriate types such as:
- `VideoGame`
- `WebApplication` or compatible software-app type
- `BreadcrumbList`

Include only real fields:
- name,
- description,
- genre,
- URL,
- image,
- operatingSystem / gamePlatform,
- applicationCategory,
- offer price 0 when actually free.

No fake:
- AggregateRating
- reviewCount
- ratings
- downloads

## Collection pages
Use:
- `ItemList`
- `BreadcrumbList`

## Guide pages
Use:
- `Article` only when content actually behaves like an editorial guide;
- `BreadcrumbList`.

Do not add FAQPage markup merely because the page has FAQ text.

Do not add VideoObject unless a real indexable video exists.

---

# 12. METADATA

Create page-specific:

- title,
- description,
- canonical,
- Open Graph title,
- Open Graph description,
- OG image,
- Twitter metadata.

No template that produces misleading genre names.

Titles should be human-readable first.

Examples of intent, not exact copy:

- Neon Drift — Free Online Drift Game | Gamesweb
- Velocity Run — Free Browser Parkour Game | Gamesweb
- Pocket Striker — Free Physics Sports Game | Gamesweb
- Sky Stack — Free Stacking Game | Gamesweb

Do not overstuff "free online browser game" repeatedly.

---

# 13. GAME HUB SEO / UX

Current Game Hub contains useful descriptive content inside a `<details>`.

Accordions are acceptable, but the SEO layer should not feel hidden or bolted on.

Improve the lower hub so that after the gameplay / progression area there is a visible editorial block with:

- concise game description,
- why it is distinct,
- how a run works,
- core controls,
- links to guide / controls / strategy,
- related games.

Do not move a 1,500-word article above the Play CTA.

Product remains primary.
Editorial discovery remains below the product experience.

---

# 14. /GAMES INDEX

Create a strong public catalog page at `/games`.

It should:

- show all 8 games;
- expose their visual diversity;
- allow browse/filter without making filter URLs indexable by default;
- link via crawlable `<a href>` links to every game hub;
- include concise public description;
- link to useful collections.

Do not duplicate /arcade exactly.

Different role:

- /arcade = logged/product command center.
- /games = public discovery / browse / SEO catalog.

If /arcade is client-heavy/personalized, noindex it and make /games the public catalog.

Make this decision explicitly in SEO-INDEX-MATRIX.

---

# 15. INTERNAL LINK GRAPH

Every indexable URL must have crawlable inbound links.

Required graph:

Home
→ Games
→ Game hubs
→ Game guides
→ Controls / strategy / achievements

Games
→ Collections
→ Games

Game hubs
→ Related games
→ Relevant collections
→ Guides

Guides
→ Game hub
→ Play CTA
→ Sibling guide pages

No orphan pages.

Use real `<a href>` / Next Link links.

Do not rely on JS-only click handlers for crawlable navigation.

Add a graph test.

---

# 16. SITEMAP

Current sitemap is only core + 8 game hubs.

Rebuild it from the explicit indexable registry.

Requirements:

- include only canonical indexable pages;
- exclude noindex/private/parameter routes;
- stable lastModified from content data or code-defined update date;
- no fake daily lastModified;
- production base URL required in production;
- deterministic output;
- sitemap test count roughly matches the index matrix.

Do not let every internal app page leak into the sitemap.

---

# 17. ROBOTS

Audit `robots.ts`.

Keep it simple.

- sitemap reference correct;
- no accidental global disallow;
- API/auth crawl policy deliberate;
- remember that noindex pages generally need to remain crawlable enough for the noindex directive to be observed.

Do not use robots.txt as a substitute for route metadata.

---

# 18. PERFORMANCE / CRAWLABILITY

Public SEO pages should:

- render meaningful HTML on first response;
- not require login;
- not require localStorage for core content;
- keep JS low;
- reuse static data;
- not instantiate Phaser unless the user actually enters Play;
- use optimized images / existing game art;
- avoid layout shift.

Check:
- page HTML includes H1 and descriptive content;
- crawlable links exist server-side;
- metadata exists in rendered head.

---

# 19. CONTENT REGISTRY

Do not scatter SEO copy randomly across JSX files.

Create a typed source-of-truth, for example:

`apps/web/content/`
or
`packages/game-content/`

Suggested structures:
- gameEditorial
- gameGuides
- collections
- seoPageRegistry

Each record should define:
- slug,
- intent,
- title,
- description,
- sections,
- related games,
- indexable,
- updatedAt.

The registry should make:
- sitemap,
- metadata,
- internal links,
- static params,
- QA validation

derive from the same source where practical.

Do NOT over-engineer a CMS.

---

# 20. CONTENT QUALITY GATES

Add tests/scripts to fail if:

- duplicate SEO title,
- duplicate meta description,
- duplicate canonical,
- empty H1,
- indexable page with too little unique content,
- collection with <3 games,
- orphan indexable URL,
- indexable route missing sitemap entry,
- sitemap URL marked noindex,
- localhost appears in production SEO output,
- game guide claims a control/mechanic absent from source data when validation is possible.

Do not use a naive word-count threshold alone.

A useful controls page can be concise.
A strategy guide should be deeper.

Use semantic requirements by page type.

---

# 21. INTERNATIONALIZATION

Do NOT mass-translate in this pass.

Current site language is English.

Finish English quality first.

Only prepare architecture so future:
- /fr,
- /es,
- etc.

can use:
- real translated content,
- hreflang,
- localized canonicals.

No machine-translated indexable clones now.

---

# 22. ANALYTICS FOR SEO

Add/verify useful public events without creating invasive tracking:

- seo_landing_view
- game_hub_to_play
- guide_to_play
- collection_to_game
- internal_search if /games gets search
- related_game_click

The important product question:
Does organic discovery convert into:
1. play,
2. second run,
3. another game,
4. account/social return?

Do not optimize only for impressions.

---

# 23. SEO SURFACE TARGET

Expected initial shape after this pass:

- 8 game hubs,
- roughly 24–40 useful game-specific guide/support pages,
- 6–8 curated collection pages,
- Games index,
- Guides index,
- Collections index,
- core site pages.

Expected:
**~50–70 strong indexable URLs** is better than 500 weak ones.

Do not force the upper bound.

If a game only justifies 3 guide pages, create 3.

---

# 24. SEARCH QUALITY PRINCIPLE

Google explicitly treats large quantities of low-value automatically generated pages as scaled content abuse and substantially similar pages as doorway abuse.

Therefore:

- every page must help a human;
- page families must be browseable;
- content must be original to Gamesweb;
- real game data is the differentiator;
- do not scrape Poki/CrazyGames;
- do not clone competitor text;
- do not use competitor brand names in page titles to capture traffic.

---

# 25. QA SCREENSHOTS — FINAL GAMES

Create:

`docs/qa-final-closeout/games/`

For all 8:
- open 1440
- mid 1440
- peak 1440
- payoff 1440
- mobile 390

Special:
- Territory capture series
- Crowd gate before/after
- Neon three distinct track environments + tutorial
- Swarm density progression
- Velocity 3 course-location screenshots
- Knockout 3 obstacle/event screenshots

Create:
- final opening contact sheet,
- final peak contact sheet.

Compare to:
`docs/qa-game-art-direction/`

Do not just overwrite them.

---

# 26. QA SCREENSHOTS — SEO PUBLIC SURFACES

Create screenshots at 1440 + 390 for:

- /games
- /guides
- /collections
- one representative collection
- one representative game guide
- one controls page
- one strategy page
- one achievements page
- one final Game Hub lower editorial section

The SEO surface still needs Gamesweb quality.
Do not build a generic blog/template aesthetic.

---

# 27. REQUIRED TECHNICAL TESTS

Run:

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm build
pnpm exec playwright test e2e/smoke.spec.ts e2e/platform.spec.ts e2e/gameplay.spec.ts e2e/progression.spec.ts e2e/security.spec.ts e2e/visual.spec.ts
QA_MATRIX=1 pnpm exec playwright test e2e/qa-matrix.spec.ts
QA_MATRIX=1 pnpm exec playwright test e2e/game-art-direction.spec.ts
```

Add an SEO test suite, for example:

`e2e/seo.spec.ts`

Validate representative routes for:

- HTTP 200,
- title,
- description,
- H1,
- canonical,
- robots,
- JSON-LD validity,
- server-rendered content,
- crawlable internal links,
- no duplicate obvious metadata,
- noindex utility routes,
- sitemap presence,
- mobile render.

Also run a lightweight broken-link check across public indexable pages.

---

# 28. FINAL REPORT

Create:

`docs/FINAL-PLATFORM-GAMES-SEO-CLOSEOUT.md`

Include:

## Games
- remaining P1s fixed,
- screenshots,
- exact unresolved P2.

## Platform
- surfaces checked,
- responsive issues,
- remaining honest limitations.

## SEO
- indexable URL count,
- noindex route families,
- sitemap count,
- page families created,
- content registry,
- canonical rules,
- structured data,
- internal-link graph,
- representative metadata,
- query map,
- content-quality tests.

## Testing
- typecheck/lint/tests/build,
- Playwright counts,
- SEO tests,
- CI,
- Vercel preview.

Do not claim:
- "SEO finished forever",
- guaranteed rankings,
- 1M impressions,
- perfect indexing.

Report what is implemented and what Search Console must validate after deployment.

---

# 29. FINAL ACCEPTANCE QUESTIONS

## Games
- Are all 8 visually identifiable without titles?
- Are Territory/Crowd/Swarm peak states visually strong?
- Are Neon locations authored enough?
- Are Velocity and Knockout clearly separate?

## Platform
- Does the platform still feel like one premium product?
- Did SEO additions avoid turning the product into a generic content site?

## SEO
- Can Google discover useful pages beyond the 8 games?
- Does every indexable page answer a distinct user need?
- Is every page in the sitemap meant to rank?
- Are private/transient surfaces excluded?
- Is /games a real public catalog?
- Are game hubs canonical?
- Are guides based on actual game mechanics?
- Are there zero thin keyword-variant pages?
- Can the initial indexable surface stay around 50–70 high-quality URLs?

The desired result is:

**one coherent Gamesweb platform + eight distinct games + a useful first-party search surface around those games.**
