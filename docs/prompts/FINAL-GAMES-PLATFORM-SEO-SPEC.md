# FINAL GAMES + PLATFORM + SEO SYSTEM

## Branch / base

Work only on:

`cursor/final-games-platform-seo-c08e`

Base:

`cursor/game-art-direction-rebuild-c08e` @ `c7e307cceec8d876b5f6e65134ba318e735fc222`

Do not merge.

This is a final integrated pass with three missions:

1. close the remaining game-art/gameplay P1 gaps;
2. close the remaining platform UX/visual gaps without redesigning the Home;
3. build a real search/discovery surface around the eight first-party games.

The objective is not to ship hundreds of thin SEO pages.
The objective is to turn Gamesweb into:

**a coherent gaming platform + eight recognizable games + a crawlable first-party game knowledge graph.**

---

# 0. READ FIRST

Before editing:

- read `docs/prompts/GAME-ART-DIRECTION-REBUILD-SPEC.md`;
- read `docs/GAME-ART-DIRECTION-REBUILD.md`;
- inspect `docs/qa-game-art-direction/`;
- inspect the current app routes;
- inspect `packages/game-sdk/src/manifests.ts`;
- inspect level/map/layout data for every game;
- inspect current SEO code:
  - `apps/web/lib/seo.ts`
  - `apps/web/app/sitemap.ts`
  - `apps/web/app/robots.ts`
  - `apps/web/app/layout.tsx`
  - `apps/web/app/games/[slug]/page.tsx`
  - `apps/web/app/play/[slug]/page.tsx`.

Do not trust prior "done" claims.
Use current code + screenshots as truth.

---

# 1. CURRENT VERIFIED SEO PROBLEMS

These are not hypothetical.

## P0 — wrong SEO title classification

Current:

`gameSeoTitle(title, genre)`

only explicitly understands:

- Driving -> Drift Game
- Platformer -> Parkour Game
- everything else -> Survival Game

That means titles for Sky Stack, Knockout Circuit, Pocket Striker, Territory Rush and Crowd Control can be semantically wrong.

Fix this first.

Use a proper taxonomy driven by manifest data / explicit SEO config, not an `else = survival` fallback.

No game may receive a genre title that is not true.

## P0 — play routes have no explicit search policy

`/play/[slug]` is an application/game runtime URL.

The canonical public content URL should be:

`/games/[slug]`

Make runtime play routes:

- `noindex, follow`;
- canonical to the corresponding game hub where appropriate;
- excluded from sitemap.

Do NOT block them in robots.txt merely to noindex them: crawlers need to be able to see the noindex directive.

## Surface problem

Current sitemap exposes basically:

- home
- arcade
- about
- privacy
- terms
- 8 game hubs

There is no real public `/games` catalog route.
There are no search-facing guide/index surfaces.
The authored tracks/courses/maps/tables do not have crawlable public URLs.
The platform contains rich first-party game data that search engines cannot currently discover as distinct content.

## Content architecture problem

Important game information currently lives low in GameHub, much of it inside a collapsed `<details>` section.

Do not build SEO by stuffing more hidden copy there.

Create clear user-facing public content surfaces.

---

# 2. SEO PRINCIPLES

Follow current Google Search Central principles:

- helpful, reliable, people-first content;
- descriptive titles/headings;
- crawlable HTML links;
- one useful URL per meaningful content unit;
- server-render / pre-render important content;
- correct canonicals;
- only index pages that provide distinct value;
- do not create scaled-content or doorway-style pages.

No keyword stuffing.

No fake "best X online" claims.

No scraped third-party game descriptions.

No AI-padding.

No auto-generating hundreds of near-identical pages.

No city/location pages.

No pages whose only purpose is to forward to `/play`.

Every indexable page must remain useful even if the Play CTA were temporarily removed.

---

# 3. SEO ARCHITECTURE

Build a search-facing layer separate from personalized application surfaces.

## Search-facing public surfaces

### A. Games catalog

Create:

`/games`

This becomes the canonical public catalog.

It must be SSR/static, crawlable and useful without JS.

Include:

- strong H1;
- short explanation of Gamesweb;
- all 8 games;
- genre/type;
- session length;
- input/device info;
- single-player / async/social capabilities truthfully;
- crawlable links to every game hub;
- links to useful collections;
- links to guides.

Do not make this a clone of the interactive Arcade screen.

`/arcade` remains the immersive platform/product discovery surface.

If `/arcade` substantially duplicates `/games`, either:
- differentiate it strongly as a product/app surface and noindex it,
or
- canonicalize appropriately.

Do not leave two near-identical indexable catalogs.

### B. Game hubs

Keep:

`/games/[slug]`

for all 8.

These are primary canonical landing pages.

Each hub should visibly contain, below the hero:

- what the game is;
- how the scoring/win condition works;
- controls;
- session length;
- modes/content count;
- meaningful tips;
- screenshots;
- related game links;
- links to deeper guides/content.

The page should still feel like Gamesweb, not an SEO article template.

Do not bury all informational value in a collapsed section.

### C. Game guides

Create two substantial first-party guide types per game:

`/games/[slug]/how-to-play`
`/games/[slug]/strategy`

= up to 16 pages.

They must be authored from actual mechanics.

How-to-play pages:
- objective;
- controls;
- first 30 seconds;
- scoring or win condition;
- common failure;
- mode differences;
- mobile/desktop behavior where relevant;
- FAQ based on real mechanics.

Strategy pages:
- intermediate/advanced decisions;
- routes/builds/combos/gates/angles depending on game;
- concrete game-specific examples;
- links to authored subcontent;
- no invented optimal claims without code/data support.

If a game does not have enough depth for a separate strategy page, do NOT pad it.
Keep the strategy material on the hub and mark the thin route non-indexable or do not create it.

### D. Authored content units

This is the strongest scalable SEO surface because these are OUR actual game levels/content, not generic articles.

Build public pages only where there is real distinct data.

#### Neon Drift

`/games/neon-drift/tracks/[track]`

Expected: 3 real tracks.

Each page should expose actual track-specific information:
- track name/id;
- visual environment;
- driving character;
- relevant sectors;
- scoring opportunities;
- practical drift advice;
- screenshot;
- playable CTA.

#### Velocity Run

`/games/velocity-run/courses/[course]`

Current manifest exposes 12 authored course modes.

Create pages for real authored courses only.

Each should have:
- course name;
- world;
- route identity;
- medal targets if available;
- checkpoint/split information;
- hazards/shortcuts grounded in level data;
- screenshot;
- strategy;
- related courses.

Do not publish 12 copies with only a number changed.

#### Knockout Circuit

`/games/knockout-circuit/maps/[map]`

Current manifest exposes 8 authored maps.

Each page should reflect real map data:
- environment/family;
- hazards;
- route;
- timing;
- shortcut if one truly exists;
- screenshot;
- related maps.

#### Pocket Striker

`/games/pocket-striker/tables/[table]`

Current manifest says 18 authored tables across Workshop / Garden / Arcade Lab.

Expose real layouts only if code/data can substantiate them.

Each page:
- layout identity;
- theme;
- par if it exists;
- obstacles;
- bank-shot opportunities;
- screenshot;
- tactical notes.

If only IDs exist with no meaningful data, enrich the game's first-party level metadata before indexing.

#### Other games

Swarm / Territory / Sky / Crowd may expose deeper content pages only if there is enough real first-party data.

Examples:
- Swarm build/upgrade families;
- Territory arenas;
- Sky modes;
- Crowd route families.

Do not manufacture page counts.

### E. Collections

Create a small number of useful cross-game collections.

Route:

`/collections/[slug]`

Start with approximately 5–8 collections, only where at least 3 games honestly fit.

Candidate intents:
- browser-games
- skill-games
- quick-games
- mobile-games
- competitive-games
- one-thumb-games
- time-attack-games
- chill-games

Do NOT publish a collection with one game.
Do NOT invent "multiplayer" if the games are async/ghost/party rather than live multiplayer; label accurately.

Each collection needs:
- a unique explanation of the play intent;
- why the included games fit;
- comparison by session/input/style;
- crawlable game links;
- no generic 600-word filler.

### F. Guides index

Create:

`/guides`

This is a browseable directory of all first-party guides.

Optionally add a small set of mechanics guides, but only when they add value beyond branded pages.

Examples:
- drift scoring and combo banking;
- parkour time-trial routing;
- survivor build decisions;
- territory loop risk;
- crowd gate math;
- bank-shot physics.

These must be grounded in Gamesweb mechanics and demonstrate them with first-party examples.

Do not create a generic gaming blog full of unrelated third-party topics.

### G. Updates

Create:

`/updates`

only as a framework for real release notes.

Do not fabricate historical updates.
Do not generate empty monthly pages.

Index an update only when a real shipped change has meaningful content.

---

# 4. TARGET URL COUNT

Do not optimize for arbitrary scale.

Expected first pass:

- 1 home
- 1 games catalog
- 8 game hubs
- up to 16 how-to/strategy guides
- ~41 authored level pages if all underlying data is genuinely distinct:
  - 3 Neon tracks
  - 12 Velocity courses
  - 8 Knockout maps
  - 18 Pocket tables
- 5–8 collections
- 1 guides index
- about / legitimate public support pages

This gives roughly 50–80 high-value indexable URLs depending on quality gates.

That is enough.

Do not expand to 500 URLs unless the product itself later contains hundreds of distinct levels/games/content entities.

---

# 5. SEO DATA MODEL

Do not scatter SEO copy through React components.

Create a typed first-party SEO/content layer.

Example architecture:

`apps/web/lib/content/`
- `games.ts`
- `guides.ts`
- `collections.ts`
- `content-units.ts`
- `seo.ts`

or equivalent.

Each indexable entity should expose something similar to:

```ts
type IndexableEntity = {
  slug: string;
  title: string;
  description: string;
  canonical: string;
  indexable: boolean;
  indexReason: string;
  updatedAt: string;
  image?: string;
  breadcrumbs: ...;
  relatedLinks: ...;
}
```

For content units also expose actual game-backed facts.

Build a quality gate.

A page is not automatically indexable because a route exists.

---

# 6. INDEXABILITY / QUALITY GATE

Create a deterministic SEO truth gate.

Every generated page gets:

- INDEXABLE
- NOINDEX_THIN
- NOINDEX_DUPLICATE
- NOINDEX_APP
- NOINDEX_PLACEHOLDER

Indexable requires:

1. unique search intent;
2. unique title/H1;
3. meaningful first-party information;
4. meaningful internal links;
5. no duplicate canonical target;
6. actual underlying game data;
7. no placeholder copy;
8. no lorem;
9. no empty screenshot slot;
10. no contradictory game facts.

Do not use word count as the only metric.

A concise page with unique track data is better than 1,000 words of filler.

Add tests for the gate.

---

# 7. METADATA SYSTEM

Replace the current fragile `gameSeoTitle()` logic.

Create explicit SEO classification.

Example concepts:

- Neon Drift -> free browser drift game
- Velocity Run -> free browser parkour / time-trial game
- Swarm Protocol -> free browser arena survival game
- Sky Stack -> free browser stacking arcade game
- Knockout Circuit -> free browser obstacle race game
- Pocket Striker -> free browser physics / precision game
- Territory Rush -> free browser territory / area-control game
- Crowd Control -> free browser crowd runner game

Use natural language, not keyword concatenation.

All indexable pages require:

- unique title;
- unique meta description;
- canonical;
- Open Graph;
- Twitter card;
- appropriate image.

Avoid titles that all follow an obviously spammy template.

---

# 8. STRUCTURED DATA

Keep valid first-party structured data.

## Game hubs

Use Schema.org `VideoGame` where truthful.

Include only known properties.

Do not invent:
- ratings;
- review count;
- aggregateRating;
- live player counts.

## Site

Keep WebApplication / Organization-style brand data if valid.

## Nested pages

Add `BreadcrumbList`.

## Catalog / collection pages

Use `ItemList` only when it accurately represents the visible list.

Do not add structured data merely because a schema type exists.

Do not expect unsupported schema to create a Google rich result.

Do not add fake FAQ rich-result markup.

Visible FAQs are fine.

---

# 9. INTERNAL LINK GRAPH

This matters as much as sitemap generation.

Every indexable page must be reachable via crawlable `<a href>` links.

Required graph:

Home
→ Games
→ Game hub
→ How to play / Strategy
→ Track/course/map/table pages

Game hub
→ related guides
→ authored content units
→ related games
→ relevant collections

Content unit
→ parent game
→ previous/next sibling
→ strategy guide
→ relevant collection

Collections
→ games
→ relevant guides

Guides
→ relevant game
→ relevant content units

Do not use button-only JS navigation for search-critical paths.

Build a graph validation test that finds orphan indexable pages.

Zero orphan indexable URLs allowed.

---

# 10. SITEMAP

Rewrite sitemap generation from the same indexability source of truth.

Sitemap must contain ONLY canonical indexable public URLs.

Exclude:
- play routes;
- auth;
- settings;
- inbox;
- me;
- personalized profile states;
- challenge invite codes;
- party codes;
- API;
- temporary/debug pages;
- noindex content units;
- duplicate catalog/app surfaces.

Use meaningful `lastModified` values based on content/game versions, not a single stale hardcoded global date for everything.

Current `MANIFEST_UPDATED = "2026-09-14"` should not remain the universal update date.

---

# 11. ROBOTS / APP-SURFACE POLICY

Create an explicit route policy.

Search-facing:
- index, follow.

Application/private/personalized:
- noindex, follow where crawlable;
- auth/private states noindex.

Likely NOINDEX candidates:
- `/play/*`
- `/settings`
- `/me`
- `/friends`
- `/inbox`
- `/party/*`
- `/crew` if personalized
- challenge invite/code URLs
- auth URLs.

Assess:
- `/leaderboards`
- `/achievements`
- `/daily`
- `/grand-prix`
- `/arcade`

If they are primarily personalized/product surfaces, noindex them instead of trying to make every app page rank.

Search surface and app surface are different things.

---

# 12. PUBLIC GAME HUB CONTENT

Refactor GameHub architecture if needed.

The current hero/product portions can remain interactive.

But meaningful editorial/search content should be server-renderable where practical.

Create a public content component that can render:

- overview;
- objective;
- scoring;
- controls;
- modes;
- tips;
- screenshots;
- FAQ;
- deep links.

Do not make all critical copy dependent on client state.

Keep personalized components (PB, friends, rank) client-side.

Think:

```
<GamePublicHero />
<GamePersonalState client />
<GamePublicOverview />
<GamePublicGuides />
<GamePersonalBoard client />
<GamePublicRelated />
```

or equivalent.

Do not sacrifice platform feel for SEO.

---

# 13. SCREENSHOT / IMAGE SURFACE

Use the new distinct game art direction to improve search/share surfaces.

For every game hub create or curate:

- hero image;
- at least 2 useful gameplay screenshots;
- descriptive alt text based on what is actually visible;
- deterministic OG image.

For content-unit pages use a relevant real screenshot where possible.

Do not reuse exactly the same hero image across 20 pages.

If generating screenshots via QA/debug:
- ensure they show the actual relevant track/course/map/table;
- no debug overlay;
- no fake score;
- no hidden copyrighted reference art.

Optimize images.

---

# 14. GAME FIX CLOSEOUT — DO NOT SKIP

SEO does not replace game quality.

Close the current art-direction P1s.

## Territory Rush — P1

Current issue:
paint still does not dominate peak state.

Required:
- capture event must visibly transform the map;
- stronger fill wave;
- ownership area should become the visual subject;
- exposed trail must be obvious;
- before/after must read in one screenshot pair;
- keep high-key toy-city direction.

Do not simply add more houses.

## Crowd Control — P1

Current issue:
gates are still green bars rather than major decision objects.

Required:
- large gate structures/signs;
- clear +N / ×N / tax semantics;
- decision framing;
- crowd compression through gate;
- dramatic re-expansion;
- pack 10 / 30 / 80+ visibly distinct.

## Neon Drift — P1

Current issue:
roadside still sparse; navy margins still large.

Required:
- at least three authored visual corner families:
  - roadside/touge;
  - tunnel/service area;
  - built-up/harbour or equivalent;
- place dressing inside actual default camera;
- visible wet/asphalt material;
- sodium light pools;
- drift smoke/marks/feedback must dominate more than empty margins.

Preserve tutorial v2.

## Swarm Protocol — P1

Current issue:
peak still does not feel like a survivor power-fantasy.

Required:
- much stronger open → mid → peak density escalation;
- more enemy silhouette differentiation;
- deaths/pickups/projectile fields;
- readable player contrast pocket;
- performance-aware caps.

Do not hide everything in particles.

## Velocity Run — P1

Current issue:
course worlds still share too much one roof kit.

Required:
at least three unmistakable environment kits corresponding to actual authored course groups:
- HVAC/service roof;
- crane/transit/glass canyon;
- communications/high-rise finish.

Need screenshots where title can be hidden and environment still identifies the section.

## Knockout Circuit — P1

Current issue:
brighter, but still bars/spinners.

Required:
- improve obstacle identity;
- foam/plastic material cues;
- game-show signage;
- 2–3 large signature obstacle silhouettes;
- spectator/light/finish payoff;
- distinguish visual family further from Velocity.

## Pocket Striker — P1/P2

Increase tactile diorama density carefully:
- table edge;
- rails;
- lamp;
- cards/stickers;
- physical scoreboard;
- theme-specific furniture for Workshop/Garden/Arcade Lab.

Do not obstruct aim readability.

## Sky Stack — P1/P2

Preserve simplicity.

Improve:
- height-based sky evolution;
- ceramic/stone/glass material feel;
- horizon/parallax;
- distinct high-altitude state.

Do not add feature clutter.

---

# 15. PLATFORM FINAL CLOSEOUT

Do NOT redesign Home.

Audit platform at 1440 / 1366 / 768 / 390.

Prioritize remaining weak states from prior QA:

- Friends empty state;
- Leaderboards empty/sparse state;
- Achievements spacing/collectibility;
- Crew empty feed;
- zero-score Results semantics;
- public profile parity;
- Arcade / GameHub consistency after new game art;
- mobile readability.

Specific expectations:

## Friends

No giant dead lower half.
Empty state should feel intentional and useful.

## Leaderboards

When data is sparse/empty:
- keep game identity;
- explain how to set first score;
- retain competitive framing;
- avoid a giant blank page.

## Achievements

Make trophies feel collectible:
- stronger density rhythm;
- clearer featured/recent state;
- locked vs unlocked differentiation.

## Results

Game-aware zero-state text already exists; verify all 8.
No Neon vocabulary leaks into other games.

## Platform/game boundary

The shell remains Gamesweb.
The game canvas remains game-specific.

Do not recolor the entire platform per game until it loses identity.

---

# 16. SEO COPY QUALITY

Do not write generic content like:

"Neon Drift is an exciting and fun game where players can enjoy drifting."

Every paragraph must convey actual mechanics or decisions.

Good:
"Neon Drift only banks the points accumulated during a live slide after the car regains grip. Crashing before the bank loses the live combo."

Bad:
"Master your drifting skills in this exciting browser game."

Use code/manifests as facts.

If unsure whether a mechanic exists, verify it.

---

# 17. CONTENT DATA FROM CODE

Do not manually type facts that can drift from source data.

Where reasonable, derive from:

- manifests;
- track definitions;
- course definitions;
- map definitions;
- table/layout definitions;
- achievement definitions;
- scoring constants;
- mode definitions.

But do not expose raw developer/debug data to users.

Create user-facing descriptors layered over source entities.

Tests should catch:
- missing referenced content unit;
- duplicate slug;
- broken canonical;
- missing related parent;
- orphan page;
- contradictory genre.

---

# 18. SEARCH INTENT MAP

Create:

`docs/seo/SEARCH-SURFACE-MAP.md`

For every planned indexable route list:

- URL pattern;
- page type;
- primary intent;
- supporting intent;
- source of truth;
- indexable yes/no;
- reason;
- internal-link parents;
- expected unique value.

Do not pretend to know keyword volume unless actual external data was queried.

This is architecture, not fake keyword research.

---

# 19. SEO QA REPORT

Create:

`docs/SEO-CLOSEOUT.md`

Include:

- indexable URL count;
- noindex URL count;
- page type counts;
- sitemap count;
- orphan count;
- canonical conflicts;
- duplicate title count;
- duplicate description count;
- missing H1 count;
- missing OG count;
- missing screenshot count;
- thin/noindex gate outcomes;
- structured-data validation notes;
- screenshots of main SEO surfaces.

Do not claim impressions/clicks without Search Console data.

---

# 20. AUTOMATED SEO TESTS

Add deterministic tests.

At minimum verify:

- every indexable route has a canonical;
- every indexable route has unique title;
- every indexable route has unique H1 intent;
- no game is misclassified;
- `/play/*` is noindex;
- no private/personalized routes in sitemap;
- no orphan indexable pages;
- no duplicate slugs;
- all sitemap URLs are indexable;
- all indexable content units map to real game data;
- all collection pages have >= 3 games;
- no collection contains false capability claims.

If possible create a generated route manifest for tests.

---

# 21. TECHNICAL SEO / RENDERING

Important public content should exist in initial server output where practical.

Google can render JS, but do not make search-critical content unnecessarily client-only.

Use Next metadata APIs correctly.

Ensure:
- valid 200/404 semantics;
- notFound() for invalid content;
- static params where finite;
- no duplicate canonicals;
- no localhost canonical in production;
- crawlable anchor links.

Do not overuse dynamic rendering for static first-party game content.

---

# 22. PERFORMANCE

SEO pages must be fast.

Do not load Phaser/game runtime on informational pages.

The game hub may link to Play, but it should not boot the full game engine.

Guide/content pages:
- mostly server/static;
- minimal client JS;
- optimized images.

Track bundle size before/after.

---

# 23. RESPONSIVE / UX

All new public surfaces must work at:

- 1920
- 1440
- 1366
- 768
- 390

No generic blog template disconnected from Gamesweb.

Public SEO pages should still feel premium/gaming:
- game art;
- strong hierarchy;
- simple content rail;
- readable type;
- related games.

Avoid a SaaS documentation aesthetic.

---

# 24. VALIDATION COMMANDS

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

Also add and run SEO-specific tests.

Example:

```bash
pnpm exec playwright test e2e/seo.spec.ts
```

or equivalent.

Do not update visual baselines blindly.

---

# 25. REQUIRED SCREENSHOTS

Create:

`docs/qa-final-closeout/`

Platform:
- home 1440 + 390
- games catalog 1440 + 390
- game hub 1440 + 390
- guides index
- one how-to guide
- one strategy guide
- one collection
- one authored content page
- Friends empty
- Leaderboards empty
- Achievements

Games:
for every game:
- opening
- peak
- payoff
- mobile

Special:
- Territory before/after capture
- Crowd before/after gate
- Neon authored corner families
- Swarm peak
- Velocity 3 environment families
- Knockout signature obstacles

Inspect screenshots manually.

---

# 26. FINAL CONTACT SHEETS

Keep/update:

- 8-game opening contact sheet;
- 8-game peak contact sheet.

Add:

- public SEO surface contact sheet:
  - /games
  - game hub
  - guide
  - content-unit page
  - collection

This is to ensure SEO pages do not devolve into generic articles.

---

# 27. DONE DEFINITION

Do not call the project finished unless all of these are true:

## Games

- eight games are visually identifiable without titles;
- Territory capture visually transforms the arena;
- Crowd gates are major objects;
- Swarm peak reads as a power escalation;
- Velocity has multiple authored places;
- Knockout has signature obstacle identity;
- Neon world feels authored around the road;
- Pocket feels tactile;
- Sky remains clean but has vertical atmospheric progression.

## Platform

- no obvious SaaS/dashboard cliff;
- empty states look intentional;
- no broken mobile states;
- Home remains strong;
- platform/game art separation remains intact.

## SEO

- genre title bug fixed;
- /play routes noindex;
- /games exists;
- public content architecture exists;
- sitemap generated from the indexability truth source;
- zero orphan indexable pages;
- no thin page is indexed;
- every indexable page has distinct user value;
- no private/personalized URLs leak into sitemap;
- no fake third-party content;
- no scaled-content abuse;
- technical tests pass.

---

# 28. FINAL REPORT

Create:

`docs/FINAL-GAMES-PLATFORM-SEO-CLOSEOUT.md`

Include:

- branch;
- final SHA;
- major files changed;
- remaining unresolved P0/P1/P2;
- game QA summary;
- platform QA summary;
- SEO architecture;
- exact indexable page counts by type;
- sitemap count;
- noindex policy;
- tests;
- performance impact;
- screenshot/contact-sheet paths.

Do not use "perfect", "AAA", or "SEO complete" language.

State remaining weaknesses exactly.

---

# 29. OPERATING PRINCIPLE

Do not choose between product quality and SEO.

The correct architecture is:

**great game**
→ **great public game hub**
→ **useful first-party guide/content pages**
→ **crawlable internal graph**
→ **Play**

Search should expose the product's real depth.

It must not manufacture fake depth to attract search traffic.
