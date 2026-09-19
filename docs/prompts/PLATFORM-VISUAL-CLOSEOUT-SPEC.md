# Cursor Spec — Gamesweb Platform Visual Closeout

Repository: `kazkazmdk/gamesweb`

Branch: `cursor/platform-visual-closeout-c08e`

Baseline:
- base branch: `cursor/home-final-closeout-c08e`
- reference head: `9fd62bff7c35034f713cbdc2ddec510f2b8ebef9`

IMPORTANT: this specification has already been substantially implemented on this branch. Treat it as the acceptance spec for QA and gap-closing. Do not restart completed work, do not redesign Home, and do not revert working closeout changes.

## Mission

Gamesweb must feel like one coherent gaming platform, not two products where Home is premium and secondary screens fall back to dark SaaS/dashboard UI.

The target is:
> a gaming platform whose interface itself feels like part of the arcade.

Reference influence:
- PS5 Home / Game Hub: 35%
- Xbox Cloud Gaming / Game Pass: 25%
- Discord Activities / social gaming: 20%
- Riot client: 10%
- Steam Big Picture: 10%

Competitive/event references:
- Trackmania
- modern tournament/racing event UIs

Game references:
- Neon Drift → Absolute Drift + Trackmania
- Velocity Run → Celeste + Super Meat Boy + Trackmania
- Swarm Protocol → Vampire Survivors + Brotato + 20 Minutes Till Dawn
- Knockout Circuit → Fall Guys / Stumble Guys obstacle readability
- Pocket Striker → tactile tabletop / 8 Ball Pool-style clarity
- Territory Rush → Paper.io readability
- Sky Stack → Stack / Helix simplicity
- Crowd Control → crowd-runner readability, original art direction

Reference principles, not branded assets.

## Hard constraints

Do NOT:
- redesign Home from scratch
- introduce a new brand direction
- turn the product into a generic SaaS dashboard
- default to purple neon
- hide weak hierarchy behind gradients/glassmorphism/blur
- use rounded cards and pills everywhere
- fabricate social state, players, lobbies, rankings, challenges, achievements, rooms, tournament progress, or unlocks
- imply multiplayer semantics that do not exist
- blindly regenerate visual snapshots

Preserve Home as the design-system source:
- selected-game dominance
- art-first composition
- chamfered CTA language
- rail focus behavior
- game-specific accents
- selection ticks / geometric frames
- geometric avatar treatment
- Daily / Grand Prix event language

## Visual-system goals

Extract and consistently use:
- game-native primary CTA with chamfered/directional geometry
- visible selected state without reading text
- event surfaces with artwork, progress, deadline, score/status, opponent context and one dominant next action
- social surfaces with avatars, presence, game context, comparison and challenge actions
- game-specific backdrops/motifs
- progressive disclosure instead of every object becoming a card

Reduce:
- `rounded-2xl` everywhere
- `rounded-full` everywhere
- bordered dark cards
- equal-weight panels
- generic form-first composition
- long dashboard stacks
- redundant buttons

## Platform surfaces

### Arcade
Must be a player command center, not analytics/dashboard UI.

Prioritize one current meaningful situation:
- Daily
- active challenge
- Grand Prix round
- rival score
- rank/division progress
- streak
- waiting challenge

Then show progression, competition, event rail, and a small trophy/achievement teaser.

### Game Hub
Above fold:
1. game art
2. title/identity
3. ONE dominant Play/Continue CTA
4. current mode
5. personal best
6. rank/division where relevant
7. rival/friend comparison
8. Daily/Challenge state

SEO explanatory content can remain lower on the page, lower-emphasis/collapsible where appropriate. Do not duplicate Play CTAs.

### Results
Hierarchy:
1. RESULT
2. performance / PB / medal / placement
3. progression / XP / unlocks if real
4. social comparison if real
5. one dominant CTA + max two secondary actions

Should feel like a payoff moment, not score + pill stack.

### Pause
Console-style overlay:
- gameplay stays visible
- strong game identity
- clear selected menu item
- Resume dominant
- Restart secondary
- Exit lower priority
- keyboard/controller focus obvious

### Daily Arcade
True 3-stage event chain:
- countdown/reset
- completion progress
- Game 1 → Game 2 → Game 3
- current/completed/not-started states
- art/objective/PB
- rival/friend result only if real

Never expose raw seed IDs. Use product copy like “Same run for everyone today”.

### Grand Prix
Must visually communicate:
- route
- rounds
- current/locked/completed states
- points
- position
- opponents where real
- current game
- next game
- event deadline

Do not render five equal cards.

### Social OS
Treat Friends, Inbox, Party, Crew, Challenges, Rivals, Profile social blocks, Leaderboards social blocks and Results social blocks as one visual system.

Friends:
- Playing now
- Challenges
- Rivals
- friend list lower priority
- remove roadmap/dev copy
- truthful “Play this game” semantics if no real joinable room exists

Inbox:
- action queue, not email list

Party:
- lobby entry/state, not centered form
- truthful capability boundaries

Crew:
- identity/emblem
- members
- real progress/activity only

### Leaderboards
- game artwork/context
- game switcher
- mode switcher
- Global/Friends/Rivals
- true visual top 3
- current player clearly visible
- mobile remains scannable

### Profile
Top half should feel like a player identity card:
- avatar
- username
- level
- division
- XP
- main game
- streak
- rank
- title/badge if real
- trophies/highlight

Public profile should be at least as polished as self profile while respecting privacy.

### Achievements
Make achievements feel collectible:
- icon/trophy treatment
- rarity only if real
- completion states
- progress
- recently unlocked prominence
- filters secondary

### Settings
Keep utility-first but propagate Gamesweb focus/shape language.

### Play Index
No semantic mismatch such as “Three ways to play” while showing all eight games.

## Neon Drift — P0 comprehension

Real player feedback: the game was playable but the scoring objective was not understood.

Current brand copy like “Hold the slide. Bank the score.” is not sufficient onboarding.

The first 10–20 seconds must teach through play:

DRIFT → BUILD COMBO → BANK SCORE → AVOID LOSING COMBO

No giant tutorial modal.

Suggested first-run sequence:
1. first forgiving corner: HOLD DRIFT
2. live combo visibly grows
3. BANK IT on successful release/transition
4. visually distinguish LIVE/unbanked vs BANKED score
5. later collision visibly communicates combo loss without forced failure

After success, guidance fades.

HUD priority:
1. drift state
2. combo
3. unbanked score
4. banked score
5. immediate road/turn context

Also improve racing-line world density:
- barriers
- chevrons
- signs
- distant structures
- lights
- landscape geometry
- turn anticipation

## Game visual closeout

### Velocity Run
Readable precision first, but add authored landmarks, architectural themes, depth, start/finish identity and memorable locations.

### Swarm Protocol
Opening must immediately promise pressure/power fantasy. Improve early enemy density, danger and feedback without artificially making it unfair.

### Sky Stack
Preserve simplicity. Only polish impact, perfect placement, depth, combo/game-over/result transitions.

### Knockout Circuit
Reduce abstract “bars + spinners” feeling. Create themed environments while preserving obstacle readability.

### Pocket Striker
Make the tabletop feel authored/tactile with rails, frame construction, lighting, physical response and environmental density while keeping the playable surface clean.

### Territory Rush
Territory capture must feel continuous and rewarding:
- trail
- enclosure
- fill animation
- contested edge
- ownership hierarchy
- danger readability

### Crowd Control
Structural issue: huge crowds must not still read as tiny stick pixels.

Camera/framing must respond to crowd size:
- closer when small
- moderate pull-out when medium
- wider when huge while preserving collective mass
- payoff/battle framing where appropriate

The player must feel crowd growth, not just see a number increase.

## Responsive

Explicitly validate:
- 1920
- 1440
- 1366
- 768
- 390

Mobile is a recomposition, not desktop scaling.

## Accessibility

Preserve/improve:
- keyboard navigation
- visible focus
- touch targets
- contrast
- reduced motion
- aria labels
- semantic headings
- screen reader support

## Architecture

Prefer reusable primitives over page-specific spaghetti. Existing/appropriate examples:
- ChamferButton
- GameBackdrop
- EventRoute
- EmptyStateStage
- PlayerVersus
- ProgressionStrip
- PlayerIdentity
- RankPodium
- TrophyShelf
- PauseOverlay

Do not over-abstract.

## Performance

Protect:
- lazy loading
- route-level splitting
- game loading
- canvas/WebGL performance
- image sizes
- responsive assets
- JS bundle size

No giant visual dependency just for decoration.

## Visual QA

Inspect existing before references:
- `docs/qa-closeout/**`
- `docs/qa-home-art-closeout/**`
- `docs/qa-home-final/**`
- `e2e/visual.spec.ts-snapshots/**`

Current closeout screenshots:
- `docs/qa-platform-visual-closeout/**`

For each material change:
1. capture actual screen
2. inspect composition manually
3. compare to target hierarchy/reference principles
4. fix issues
5. only then update expected snapshot

A green visual test is not itself visual QA.

Minimum QA concerns:
- clear anchor within one second
- unmistakably Gamesweb, not generic Tailwind
- selected/relevant game identity visible
- one dominant next action
- empty space intentional
- mobile genuinely recomposed
- product semantics truthful
- no orphan labels, weird wrapping, generic pills, bad crops, tiny avatars, weak contrast, accidental one-item grids

## P0 acceptance gates

Do not close while any remain:
1. Daily looks like generic card stack
2. Grand Prix looks like round list
3. Friends/Party/Crew look like unfinished forms/lists
4. Results looks like score + generic pill stack
5. Pause looks like generic rounded modal
6. Game Hub reads primarily like SEO landing page above fold
7. Arcade reads like dashboard
8. Neon Drift scoring loop remains unclear in first session
9. Crowd Control does not visually distinguish small vs huge pack
10. secondary surfaces still feel unrelated to Home

## Required validation

Run:
- typecheck
- lint
- unit tests
- build
- Playwright
- visual regression suite
- QA screenshot matrix

Do not update baselines blindly.

## Current closeout report

Use `docs/PLATFORM-VISUAL-CLOSEOUT.md` as the current implementation report.

Do not trust its “P0 empty” claim automatically. Re-audit the actual screenshots and code against this spec.

Current known P1s in that report include:
- Leaderboards tabs too small / sparse podium with honest data
- Crew feed too flat when empty
- Achievements still catalog-like below trophy shelf
- zero-score Results weak as payoff
- Knockout/Territory still technically visual
- Crowd peak could occupy more width
- Friends empty has double hierarchy
- Neon world density still thin
- Velocity remains silhouette/platform-like

The next pass should close visible P1s that materially improve the experience without regressing truthful state or Home.

## Final principle

Do not add more UI for its own sake.

Make the existing product feel designed.

Use the current branch as the working state, audit against this spec, fix only the remaining gaps, capture evidence, run tests, and report exact unresolved issues.
