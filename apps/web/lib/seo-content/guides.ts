import type { GuideRecord, SeoEntry } from "./types";

const DAY = "2026-09-20";

function hub(
  gameId: string,
  title: string,
  h1: string,
  description: string,
  summary: string,
  sections: SeoEntry["sections"],
): SeoEntry {
  return {
    id: `guide-hub:${gameId}`,
    kind: "guide-hub",
    path: `/guides/${gameId}`,
    slug: gameId,
    title,
    description,
    h1,
    intent: `All ${gameId} guides`,
    summary,
    sections,
    relatedGameIds: [gameId],
    relatedGuideIds: [],
    relatedCollectionIds: [],
    publishedAt: DAY,
    updatedAt: DAY,
    indexable: true,
    image: `/art/${gameId}-hero.svg`,
    gameId,
  };
}

function guide(
  gameId: string,
  slug: string,
  title: string,
  h1: string,
  description: string,
  intent: string,
  summary: string,
  collections: string[],
  related: string[],
  sections: GuideRecord["sections"],
  faqs?: GuideRecord["faqs"],
): GuideRecord {
  return {
    id: `guide:${gameId}:${slug}`,
    kind: "guide",
    path: `/guides/${gameId}/${slug}`,
    slug,
    title,
    description,
    h1,
    intent,
    summary,
    sections,
    faqs,
    relatedGameIds: [gameId],
    relatedGuideIds: related,
    relatedCollectionIds: collections,
    publishedAt: DAY,
    updatedAt: DAY,
    indexable: true,
    image: `/art/${gameId}-hero.svg`,
    gameId,
  };
}

export const GUIDE_HUBS: SeoEntry[] = [
  hub("neon-drift", "Neon Drift Guides | Gamesweb", "Neon Drift guides", "Beginner path, scoring, combo, tracks, and ghost notes for the midnight touge score-attack.", "HOLD → COMBO → BANK. Everything else is a variation of that sentence.", [
    { heading: "Beginner path", body: "Play Harbour. Hold the first corner. Watch LIVE climb. Straighten on a straight to bank. Then read scoring and combo." },
    { heading: "What these pages cover", body: "Drift feel, live versus banked, handbrake versus grip, combo, the three tracks, beginner mistakes, ghosts and PB." },
  ]),
  hub("velocity-run", "Velocity Run Guides | Gamesweb", "Velocity Run guides", "Movement, coyote time, medals, courses, and ghost splits for the rooftop parkour time-attack.", "Milliseconds are the sport. Death closes the attempt.", [
    { heading: "Beginner path", body: "Finish Gate A. Learn the jump buffer. Then read medals and the three course families." },
    { heading: "What these pages cover", body: "Movement, jump timing, coyote time, HVAC / transit / comms kits, medals, checkpoints, speedrun basics, ghosts." },
  ]),
  hub("swarm-protocol", "Swarm Protocol Guides | Gamesweb", "Swarm Protocol guides", "Survival, upgrades, dash i-frames, enemy families, the Core, and same-seed strategy.", "Positioning and the build, not aim.", [
    { heading: "Beginner path", body: "Survive two minutes. Dash the first elite telegraph. Then read upgrades and enemy types." },
    { heading: "What these pages cover", body: "Opening, upgrades, dash, silhouettes, Core, same-seed, high-score." },
  ]),
  hub("knockout-circuit", "Knockout Circuit Guides | Gamesweb", "Knockout Circuit guides", "Signature obstacles, timing, recovery, routes, mistakes, and ghosts on the toy game-show.", "Reach the banner. Faster is better.", [
    { heading: "Beginner path", body: "Finish Starter Gates. Learn the giant arm. Then read routes and recovery." },
    { heading: "What these pages cover", body: "Obstacles, timing, recovery, map types, route choice, mistakes, ghosts." },
  ]),
  hub("pocket-striker", "Pocket Striker Guides | Gamesweb", "Pocket Striker guides", "Aim, banks, obstacles, scoring, and precision on the tabletop.", "Fewer strokes win. Aces and banks are bragging rights.", [
    { heading: "Beginner path", body: "Drag short. Pocket once. Then read banks and par." },
    { heading: "What these pages cover", body: "Aim, rebounds, layout obstacles, scoring, precision, advanced shots." },
  ]),
  hub("territory-rush", "Territory Rush Guides | Gamesweb", "Territory Rush guides", "Loops, trail risk, capture size, bots, and percentage strategy.", "Paint is the game. Houses are the table.", [
    { heading: "Beginner path", body: "Close a small loop. Watch the percent. Then read trail risk." },
    { heading: "What these pages cover", body: "Rules, safe loops, trail risk, large versus small, BRICK/NEEDLE/SWEEP, percentage." },
  ]),
  hub("sky-stack", "Sky Stack Guides | Gamesweb", "Sky Stack guides", "Perfect placement, streaks, timing, and high-stack strategy.", "One tap. Keep the width.", [
    { heading: "Beginner path", body: "Place ten slabs. Then chase a five-perfect streak." },
    { heading: "What these pages cover", body: "Placement, streaks, timing, high stacks, atmosphere." },
  ]),
  hub("crowd-control", "Crowd Control Guides | Gamesweb", "Crowd Control guides", "Gates, multipliers, preservation, routes, clashes, and high-population finishes.", "Steer. Read the sign. Cash the finish.", [
    { heading: "Beginner path", body: "Take + gates. Avoid −. Then read multipliers." },
    { heading: "What these pages cover", body: "Gates, multipliers, preservation, routes, clash, parade finishes." },
  ]),
];

export const GUIDES: GuideRecord[] = [
  guide("neon-drift", "how-to-drift", "How to Drift in Neon Drift | Gamesweb", "How to drift", "Hold throttle into the corner, steer in, then countersteer. Space is the handbrake, not the whole sport.", "Teach the slide without turning it into a sim lecture.", "Harbour teaches the first slide. District asks for tighter hands. Ridge is the touge.", ["skill-games", "score-attack-games"], ["guide:neon-drift:combo", "guide:neon-drift:live-vs-banked"], [
    { heading: "The input", body: "W or ↑ keeps speed. A/D or arrows set the angle. Space adds handbrake slip. Touch gets a small steer assist. R retries the same track." },
    { heading: "The feel", body: "A small drift is a short mark and pale smoke. A committed drift fattens the marks, brightens the smoke, and lights the LIVE meter. Near the curb, amber sparks mean you are close without eating grass." },
    { heading: "When it dies", body: "Straighten out, drop below drift speed, or hit a wall. The combo fades. BANK IT only appears after a real slide." },
  ], [{ q: "Is this a simulator?", a: "No. It is an arcade slide with weight and grip transitions." }]),
  guide("neon-drift", "scoring", "How Scoring Works in Neon Drift | Gamesweb", "How scoring works", "Score comes from drift value, combo, near-miss, and boosts — and only the banked total is kept.", "Explain the number the board stores.", "The HUD shows BANK / LIVE / combo on purpose.", ["score-attack-games"], ["guide:neon-drift:live-vs-banked", "guide:neon-drift:combo"], [
    { heading: "What counts", body: "While you slide, LIVE grows with speed, slip, and time in drift. Near-miss curb and boost ribbons add. Combo multiplies the live pot." },
    { heading: "What the board stores", body: "The result screen stores the banked total. A crash with a huge LIVE and 0 banked is a hollow run: No score banked." },
    { heading: "Trophies that prove it", body: "Heat 5 is a 5× combo. Pink Line is 25,000. Night Apex is 60,000. Paint Swap is a near-miss bonus." },
  ]),
  guide("neon-drift", "live-vs-banked", "Live vs Banked Score in Neon Drift | Gamesweb", "Live vs banked", "LIVE is the pot. BANKED is the score. Straighten on a safe straight to cash it.", "This is the tutorial returning players must see.", "The v2 tutorial key is gw:neon-tutorial-v2 so an old gw:neon-tutorial flag cannot hide HOLD → COMBO → BANK.", ["score-attack-games"], ["guide:neon-drift:scoring", "guide:neon-drift:beginner-mistakes"], [
    { heading: "HOLD", body: "The first seconds write HOLD DRIFT over the tarmac. If you already had the old localStorage key, you still see this once — the key was versioned." },
    { heading: "COMBO", body: "A held slide turns the hint to COMBO and LIVE starts climbing. BANKED stays 0 until you exit the drift." },
    { heading: "BANK", body: "Release the slide after a real drift. BANK IT flashes, LIVE dumps into BANKED, and the hint can retire." },
  ]),
  guide("neon-drift", "combo", "Neon Drift Combo Guide | Gamesweb", "Combo guide", "Combo grows while the slide stays alive and dies when you grip up or hit a wall.", "Keep the angle through a sector, not a single corner.", "COMBO BROKE is a playfield flash, not a modal.", ["skill-games"], ["guide:neon-drift:how-to-drift", "guide:neon-drift:scoring"], [
    { heading: "How it stacks", body: "Stay in drift across sector paint. A 5× combo unlocks Heat 5. Quiet Hands asks for a lap without a wall." },
    { heading: "How it breaks", body: "A wall bounce shakes the camera and can dump the combo. A timid straighten on exit also fades it. The break is subtle on purpose — the next corner is the recovery." },
  ]),
  guide("neon-drift", "tracks", "Neon Drift Track Guide | Gamesweb", "Track guide", "Harbour is service/industrial, District is tunnel/urban edge, Ridge is mountain touge. Scoring does not change.", "Pick a roadside, not a new rulebook.", "1 / 2 / 3 switch tracks. Two laps finish any of them.", ["score-attack-games"], ["guide:neon-drift:how-to-drift", "guide:neon-drift:ghost-pb"], [
    { heading: "Harbour — service", body: "Sodium lamps, containers, a crane, painted barriers. The first camera already sees a place, not a void." },
    { heading: "District — urban edge", body: "Concrete walls, cooler lamps, tunnel collar, building windows. Tighter hands." },
    { heading: "Ridge — touge", body: "Sparse sodium, guardrails, rocks, bushes, mountain horizon. Lights are farther apart on purpose." },
  ]),
  guide("neon-drift", "beginner-mistakes", "Neon Drift Beginner Mistakes | Gamesweb", "Beginner mistakes", "Banking too late, treating LIVE as the score, and hugging grass are the usual first-night errors.", "Fix the three ways a new run looks busy and scores nothing.", "The result copy for a zero is No score banked — only on this game.", ["skill-games"], ["guide:neon-drift:live-vs-banked", "guide:neon-drift:combo"], [
    { heading: "LIVE is not the score", body: "If you crash at +800 LIVE and 0 BANKED, the overlay will not pretend you scored." },
    { heading: "Grass", body: "Rejoin asphalt after grass for Dirt Warning. Staying in dirt is not a line." },
    { heading: "Handbrake spam", body: "Space is a tool. A grip drift through a long sweeper often banks more than a locked slide into the wall." },
  ]),
  guide("neon-drift", "ghost-pb", "Neon Drift Ghost and PB Guide | Gamesweb", "Ghost and PB", "G toggles the last tape. Challenges can share a seed. The board wants a banked number, not a pretty LIVE.", "Race a recording, then beat your own bank.", "Ghost support is on. Daily support is on.", ["ghost-race-games", "competitive-browser-games"], ["guide:neon-drift:scoring", "guide:neon-drift:tracks"], [
    { heading: "Ghost", body: "The ghost is your recorded car, not a lobby racer. Toggle G if the tape distracts." },
    { heading: "PB", body: "Personal best is the banked total on that track mode. Evening Line is the daily trophy." },
  ]),

  guide("velocity-run", "beginner-movement", "Velocity Run Beginner Movement | Gamesweb", "Beginner movement", "A/D to run, Space or ↑ to jump, S or ↓ to fast-fall. R retries. 1/2/3 switch course families.", "Get to the beacon on Gate A before you hunt medals.", "Safe ledges sit low. Fast ledges sit high.", ["precision-games", "time-attack-games"], ["guide:velocity-run:jump-timing", "guide:velocity-run:courses"], [
    { heading: "The body", body: "The runner has coyote time and a jump buffer. You can press jump slightly early or slightly late and still leave the ledge." },
    { heading: "Fast-fall", body: "S / ↓ commits down. The Commit trophy asks you to use it mid-run." },
  ]),
  guide("velocity-run", "jump-timing", "Velocity Run Jump Timing | Gamesweb", "Jump timing", "The expensive jump is the one off a thin fast ledge, not the start pad.", "Learn when to leave ivory concrete.", "Expert skips are optional. They are labeled in the course solids.", ["precision-games"], ["guide:velocity-run:coyote-time", "guide:velocity-run:speedrun-basics"], [
    { heading: "Read the stripe", body: "Orange safety paint marks the top of a platform. Spikes and lasers use the danger red. Do not jump into a piston because it looked like a ledge." },
    { heading: "Death", body: "A death closes the attempt. The clock does not pause. One More is a 10-retry trophy." },
  ]),
  guide("velocity-run", "coyote-time", "Coyote Time in Velocity Run | Gamesweb", "Coyote time explained", "A few milliseconds after leaving a ledge, a jump still counts. The buffer also stores an early press.", "This is why the game feels fair on a 30–90 second course.", "It is not a double jump.", ["precision-games"], ["guide:velocity-run:jump-timing", "guide:velocity-run:beginner-movement"], [
    { heading: "What it is", body: "Coyote time is a short grounded memory. Jump buffer is a short queued press. Together they make rooftop edges readable instead of frame-perfect." },
    { heading: "What it is not", body: "You cannot jump twice in the air. Fast-fall is the air control you actually have." },
  ]),
  guide("velocity-run", "courses", "Velocity Run Course Families | Gamesweb", "Course families", "Training is HVAC roofs, transit is construction steel, ascent is communications towers. A no-HUD shot should tell you which one.", "Stop treating twelve courses as one pale kit.", "Hub lists all 12 authored courses.", ["time-attack-games"], ["guide:velocity-run:medals", "guide:velocity-run:beginner-movement"], [
    { heading: "HVAC — training", body: "Ivory concrete, orange safety, pale day sky, rooftop units and ducts. Gate A lives here." },
    { heading: "Construction — transit", body: "Amber dust sky, cranes, steel columns, work lights. Needle and its variants." },
    { heading: "Communications — ascent", body: "Indigo dusk, antennas, glass facades, a colder horizon. Rushline and the vertical set." },
  ]),
  guide("velocity-run", "medals", "Velocity Run Medals | Gamesweb", "Medals", "Bronze, Silver, Gold, Platinum sit on each course. First finishes often land bronze or silver. Platinum is a clean ghost.", "The HUD shows the next medal target while you run.", "Author is the platinum trophy.", ["time-attack-games", "competitive-browser-games"], ["guide:velocity-run:speedrun-basics", "guide:velocity-run:ghost-runs"], [
    { heading: "How they award", body: "Each course has millisecond gates. Sub-40 on Course 1 unlocks Rush. Clean Air is a no-death finish." },
    { heading: "What they are not", body: "They are not Knockout decorations. Knockout only stores finish time." },
  ]),
  guide("velocity-run", "checkpoints", "Velocity Run Checkpoints and Splits | Gamesweb", "Checkpoints and splits", "A checkpoint prints a split versus your ghost. It does not save the run.", "Read the flag. Do not treat it as a respawn.", "Death always closes the attempt.", ["time-attack-games"], ["guide:velocity-run:ghost-runs", "guide:velocity-run:medals"], [
    { heading: "Splits", body: "The flag pulses. The split text compares this attempt to the tape. Split Hunter asks you to beat a course PB twice." },
    { heading: "No save", body: "If you wanted a mid-run continue, this is the wrong game. That honesty is why the clock is the sport." },
  ]),
  guide("velocity-run", "speedrun-basics", "Velocity Run Speedrun Basics | Gamesweb", "Speedrun basics", "Pick a family, learn one expert skip, use fast-fall, and race the ghost — not all twelve courses at once.", "A first speedrun is one course, one tape.", "Three Gates is finish all three families, not all medals.", ["time-attack-games"], ["guide:velocity-run:courses", "guide:velocity-run:jump-timing"], [
    { heading: "Route", body: "Safe is the stairs. Fast is the high line. Expert skips stairs. Learn safe, then steal one skip." },
    { heading: "Reset", body: "R is free. Ten retries in a session is a trophy, not a failure." },
  ]),
  guide("velocity-run", "ghost-runs", "Velocity Run Ghost Runs | Gamesweb", "Ghost runs", "G toggles the recorded runner. The tape is yours. Challenges share a seed and a time to beat.", "Race a pale orange body, not a lobby.", "Ghost support is on.", ["ghost-race-games"], ["guide:velocity-run:checkpoints", "guide:velocity-run:medals"], [
    { heading: "Reading the ghost", body: "If it takes a high ledge you are still on the stairs, you just learned the skip." },
    { heading: "When to hide it", body: "Toggle G if the extra silhouette hides a spike. The clock does not care." },
  ]),

  guide("swarm-protocol", "beginner-survival", "Swarm Protocol Beginner Survival | Gamesweb", "Beginner survival", "Move, let auto-fire work, dash the first telegraph, pick any upgrade. Survive two minutes.", "Warm Protocol is the 2-minute trophy. Deep Protocol is five.", "The opening already seeds six hostiles.", ["survival-and-arena"], ["guide:swarm-protocol:dash-iframes", "guide:swarm-protocol:enemy-types"], [
    { heading: "Opening", body: "WASD or arrows. The weapon tracks. You are not asked to aim yet." },
    { heading: "The clock", body: "Most runs resolve in five to eight minutes. The Core ends the story. Endless is a button on the result, not the default." },
  ]),
  guide("swarm-protocol", "upgrades", "Swarm Protocol Upgrades | Gamesweb", "Upgrades", "A level offers three cards. Orbit, chain, blade, and fire-rate change the sixth minute more than the first.", "Builds rewrite the run. That is the point.", "1 / 2 / 3 pick a card.", ["score-attack-games"], ["guide:swarm-protocol:high-score", "guide:swarm-protocol:same-seed"], [
    { heading: "How a pick works", body: "Cores grant XP. A level pauses the arena and shows three upgrades. Synergy text appears when a pick likes your current list." },
    { heading: "Trophies", body: "Orbit and Cascade are named picks. Rewritten is player level 8." },
  ]),
  guide("swarm-protocol", "dash-iframes", "Swarm Protocol Dash and I-Frames | Gamesweb", "Dash and i-frames", "Shift dashes. The i-frames are visible. Through is a kill during that window.", "Dash is a timing tool, not a sprint key.", "Elites telegraph before they commit.", ["survival-and-arena"], ["guide:swarm-protocol:beginner-survival", "guide:swarm-protocol:enemy-types"], [
    { heading: "When to dash", body: "Through a spore shot, through an elite lunge, off a tank shoulder. Not as a travel habit." },
    { heading: "What you see", body: "The body flashes. If you expected an invisible invuln, this is clearer than that." },
  ]),
  guide("swarm-protocol", "enemy-types", "Swarm Protocol Enemy Types | Gamesweb", "Enemy types", "Skitterer, dart, swarmer, spore, shell tank, splitter, elite, warden, Core — different silhouettes on purpose.", "Stop reading them as recolored circles.", "Radii and speeds stay as designed. Art sits on top.", ["survival-and-arena"], ["guide:swarm-protocol:core-boss", "guide:swarm-protocol:beginner-survival"], [
    { heading: "Families", body: "Chasers are skitterers with legs. Darts are wedges. Swarmlings clump. Spitters bloom a spore sac. Tanks wear a rust shell. Splitters crack into more. Elites carry a crown ring." },
    { heading: "Pressure", body: "Peak is density plus those families, not one color of dots. Quality tier still caps particles." },
  ]),
  guide("swarm-protocol", "core-boss", "Swarm Protocol Core Boss | Gamesweb", "The Core", "The Core arrives late. Killing it is victory. A warden can appear in Endless.", "CORE DOWN is a banner, not a fade to a generic win screen.", "finishRun in debug forces that victory for QA.", ["survival-and-arena"], ["guide:swarm-protocol:enemy-types", "guide:swarm-protocol:high-score"], [
    { heading: "The fight", body: "The Core is larger, telegraphs, and has a visible hull bar. Missiles and drones you built matter here." },
    { heading: "After", body: "The result can offer Endless. That is optional. Daily and challenges can still compare the Core kill score." },
  ]),
  guide("swarm-protocol", "same-seed", "Swarm Protocol Same-Seed Strategy | Gamesweb", "Same-seed strategy", "A challenge can lock the seed so two builds meet the same waves.", "Compare decisions, not luck.", "survive-seed and beat-build are listed challenge types.", ["competitive-browser-games"], ["guide:swarm-protocol:upgrades", "guide:swarm-protocol:high-score"], [
    { heading: "Why seed", body: "The same opening hostiles and the same Core clock. Your upgrade order is the variable." },
    { heading: "How to use it", body: "Share the challenge link. Do not invent a rival on the page." },
  ]),
  guide("swarm-protocol", "high-score", "Swarm Protocol High-Score Strategy | Gamesweb", "High-score strategy", "Kills, time, elites, and a Core bonus make the number. Greed after the Core is Endless, not the default score.", "Clearance is 200 kills in one run.", "HULL / SALVAGED / DECK is the HUD, not the board formula.", ["score-attack-games"], ["guide:swarm-protocol:upgrades", "guide:swarm-protocol:core-boss"], [
    { heading: "During the protocol", body: "Stay moving. Pickup cores. Do not tank a warden zone for one salvage." },
    { heading: "When to stop", body: "A Core kill is a finish. Endless is a second story if you still have hull." },
  ]),

  guide("knockout-circuit", "obstacles", "Knockout Circuit Obstacle Guide | Gamesweb", "Obstacle guide", "Giant rotating arms, foam rollers, punch pistons, conveyors, crushers, fans, and a finish gate — collision boxes stay the same.", "See the hazard before you jump it.", "Eight authored maps across Factory, Skyworks, and Signal.", ["arcade-games"], ["guide:knockout-circuit:timing", "guide:knockout-circuit:common-mistakes"], [
    { heading: "Signatures", body: "Spinners are long foam arms. Beams are rollers. Spikes are pistons. Movers carry arrows. Gates crush. Falls read as fans. The banner is the finish." },
    { heading: "Why they look loud", body: "A child should see “avoid that giant spinning thing.” That is the art goal, not a new hitbox." },
  ]),
  guide("knockout-circuit", "timing", "Knockout Circuit Timing | Gamesweb", "Obstacle timing", "Jump and dash have a rhythm. The arm tells you when, the conveyor tells you where.", "Faster is better, but early dash into an arm is a restart.", "Shift dashes. Space jumps.", ["time-attack-games"], ["guide:knockout-circuit:obstacles", "guide:knockout-circuit:recovery"], [
    { heading: "Read the period", body: "Spinners advertise their period with the yellow tip. Rollers stripe. Crushers pulse." },
    { heading: "Dash", body: "Dash is a commit through a gap, not a panic button on every platform." },
  ]),
  guide("knockout-circuit", "recovery", "Knockout Circuit Recovery | Gamesweb", "Recovery", "A hazard hit is not always a void. Learn which maps let you land and which ones dump you.", "Untouched is a no-hit finish.", "R retries the same map.", ["arcade-games"], ["guide:knockout-circuit:timing", "guide:knockout-circuit:common-mistakes"], [
    { heading: "After a hit", body: "Some maps leave you on a foam pad. Some drop you. The ragdoll is short. Get the next jump instead of watching it." },
    { heading: "When to reset", body: "If the ghost is already at the banner, R is cheaper than a limping finish." },
  ]),
  guide("knockout-circuit", "routes", "Knockout Circuit Route Choice | Gamesweb", "Map route choice", "Safe, fast, and expert pads are colored. Greedy is the expert-shortcut trophy.", "The high line is optional.", "1 / 2 / 3 switch the first maps.", ["time-attack-games"], ["guide:knockout-circuit:obstacles", "guide:knockout-circuit:ghosts"], [
    { heading: "Read the pad", body: "Expert foam is a hotter orange. Fast is a shorter, higher pad. Safe is the wide yellow walk." },
    { heading: "Maps", body: "Starter Gates teaches the arm. Risk Line is Skyworks. Hammer Run is a pink factory. Disc Yard and later maps add fans and crushers." },
  ]),
  guide("knockout-circuit", "common-mistakes", "Knockout Circuit Common Mistakes | Gamesweb", "Common mistakes", "Jumping the arm’s hub, treating ghosts as live players, and ignoring the finish banner height.", "The other runners are recordings.", "Circuit is finish all eight maps.", ["arcade-games"], ["guide:knockout-circuit:obstacles", "guide:knockout-circuit:ghosts"], [
    { heading: "The hub is not safe", body: "The spinner’s center still occupies the box. Jump the tip window." },
    { heading: "Ghosts", body: "They are recorded runs. They will not wait for you." },
  ]),
  guide("knockout-circuit", "ghosts", "Knockout Circuit Ghosts | Gamesweb", "Ghosts", "Recorded rivals sit on the course as extra runners. They are not a lobby.", "A solo heat still looks like a race.", "Ghost support is on.", ["ghost-race-games"], ["guide:knockout-circuit:routes", "guide:knockout-circuit:timing"], [
    { heading: "How to use them", body: "If three ghosts take the high pad, the low pad is probably slower." },
    { heading: "How not to use them", body: "Do not wait for a ghost to jump. They already did, in another run." },
  ]),

  guide("pocket-striker", "aiming", "Pocket Striker Aiming | Gamesweb", "Aiming", "Drag back from the ball to set angle and power. Release to strike. A short pull is usually the first table.", "The aim line and rebound dots are the sport.", "Keyboard is not the aim. The pointer is.", ["precision-games"], ["guide:pocket-striker:rebounds", "guide:pocket-striker:precision"], [
    { heading: "Power", body: "The farther you drag, the faster the strike. Over-power on a small Garden hole is how you learn cushions the hard way." },
    { heading: "Preview", body: "The dotted path previews the first cushion. Use it. Do not decorate around it." },
  ]),
  guide("pocket-striker", "rebounds", "Pocket Striker Rebound Shots | Gamesweb", "Rebound shots", "A bank is a cushion then the pocket on the same stroke. That is a trophy.", "Cushion is the bank achievement.", "Walls are wood, garden, or neon depending on the table theme.", ["precision-games"], ["guide:pocket-striker:aiming", "guide:pocket-striker:advanced"], [
    { heading: "When to bank", body: "If the hole is hidden behind a bumper, the preview should kiss a rail first." },
    { heading: "When not to", body: "A visible hole wants a straight ace. Banks are for geometry, not style points — except they are also style points." },
  ]),
  guide("pocket-striker", "obstacles", "Pocket Striker Obstacles | Gamesweb", "Obstacles", "Interior walls, bumpers, and gates sit on 18 authored tables across Workshop, Garden, and Arcade Lab.", "The felt stays playable. Furniture stays off the collision.", "Par lives on the layout.", ["arcade-games"], ["guide:pocket-striker:aiming", "guide:pocket-striker:scoring"], [
    { heading: "Themes", body: "Workshop is wood and tools. Garden is felt green and shrubs. Arcade is darker felt and neon rails. The hole rule does not change." },
    { heading: "Bumpers", body: "They return the ball harder than a rail. Aim past them or use them on purpose." },
  ]),
  guide("pocket-striker", "scoring", "Pocket Striker Scoring | Gamesweb", "Scoring", "Lower strokes win. A 1-stroke hole is an Ace. Twelve slow strokes sink the table as a miss.", "Par is the conversation, not a hidden multiplier.", "Daily uses the same stroke rule.", ["time-attack-games"], ["guide:pocket-striker:precision", "guide:pocket-striker:obstacles"], [
    { heading: "What the board stores", body: "Strokes. Result copy for a zero is No points scored — never banked." },
    { heading: "Par", body: "Table Manners is par or better. The plaque on the rail reminds you which table you are on." },
  ]),
  guide("pocket-striker", "precision", "Pocket Striker Precision | Gamesweb", "Precision", "A one-pixel drag changes the first bounce. Short pulls teach more than full-power slams.", "This is the quiet skill game.", "Touch and mouse both aim.", ["precision-games"], ["guide:pocket-striker:aiming", "guide:pocket-striker:advanced"], [
    { heading: "Short first", body: "On an open Garden hole, a half-power straight beat a full-power tour of the rails." },
    { heading: "Stop rolling", body: "The hole only accepts a slow enough ball. A rocket over the cup is a wasted stroke." },
  ]),
  guide("pocket-striker", "advanced", "Pocket Striker Advanced Shots | Gamesweb", "Advanced shots", "Plan two cushions, use a bumper as a second cue, and stop when par is safe.", "Aces are rare. Banks are the craft.", "18 tables is enough variety without a generator.", ["precision-games"], ["guide:pocket-striker:rebounds", "guide:pocket-striker:scoring"], [
    { heading: "Two-cushion", body: "If the preview only shows one bounce, you are not yet seeing the shot you think you are." },
    { heading: "Leave", body: "If the ball dies on the lip, do not slam the retry into the same full-power line." },
  ]),

  guide("territory-rush", "how-territory-works", "How Territory Rush Works | Gamesweb", "How territory works", "Leave your color, trail, return, fill. The flood-fill is the score.", "Paint percentage is the headline.", "90 seconds. WASD or a stick.", ["survival-and-arena"], ["guide:territory-rush:trail-risk", "guide:territory-rush:percentage"], [
    { heading: "The fill", body: "Re-entering your own cells with a trail runs a flood fill. Interior empty cells become yours. Blocked buildings stay blocked." },
    { heading: "The number", body: "Score is roughly percent × 400 plus cuts, largest capture, and combo. Majority is 50% of the floor." },
  ]),
  guide("territory-rush", "safe-loops", "Territory Rush Safe Loops | Gamesweb", "Safe loops", "A small loop next to your home is how you learn the fill without feeding BRICK.", "Stake is the first-claim trophy.", "Home is a 5×5 paint at spawn.", ["score-attack-games"], ["guide:territory-rush:large-vs-small", "guide:territory-rush:trail-risk"], [
    { heading: "Stay close", body: "Walk three cells out, two along, home. The ribbon should be obvious. The percent tick should be obvious." },
    { heading: "Then grow", body: "Each safe loop is a new border. Do not cross your own ribbon." },
  ]),
  guide("territory-rush", "trail-risk", "Territory Rush Trail Risk | Gamesweb", "Trail risk", "The white ribbon is a live claim. A bot that touches it ends you. A self-cross ends you.", "This is the Paper.io tension without copying Paper.io.", "Shield and speed pickups exist. They are not a third game.", ["survival-and-arena"], ["guide:territory-rush:opponents", "guide:territory-rush:how-territory-works"], [
    { heading: "While exposed", body: "You are not on your color. The ribbon pulses harder as it lengthens. That is the danger read." },
    { heading: "Cuts", body: "If you cross a bot trail you eliminate them (Shears). They can do the same to you." },
  ]),
  guide("territory-rush", "large-vs-small", "Large vs Small Captures in Territory Rush | Gamesweb", "Large vs small captures", "A small loop is safe. A large loop is the spectacle — wipe, punch, percent banner.", "Peak screenshots should be paint, not houses.", "Largest capture is stored in the result metadata.", ["score-attack-games"], ["guide:territory-rush:safe-loops", "guide:territory-rush:percentage"], [
    { heading: "Small", body: "Teaches the rule. Good when NEEDLE is nearby." },
    { heading: "Large", body: "A closed rectangle that swallows empty cream is the moment the map changes teams. Take it when the bots are elsewhere." },
  ]),
  guide("territory-rush", "opponents", "Territory Rush Opponents | Gamesweb", "Opponents", "BRICK, NEEDLE, and SWEEP are deterministic bots. They are labeled. They are not fake players.", "The FAQ on the hub says the same thing.", "Revenge banners appear when you cut them.", ["survival-and-arena"], ["guide:territory-rush:trail-risk", "guide:territory-rush:percentage"], [
    { heading: "Tells", body: "BRICK patrols a blocky path. NEEDLE stabs. SWEEP combs. Their homes sit on the right side of Toy City." },
    { heading: "Honesty", body: "Metadata marks bots: true. We will not draw a human name on them." },
  ]),
  guide("territory-rush", "percentage", "Territory Rush Percentage Strategy | Gamesweb", "Percentage strategy", "The HUD is PAINT %. A +N% banner fires on a real gain. Half the floor is a trophy.", "Chase borders, not decoration.", "Toy City and Plaza share the percent rule.", ["score-attack-games"], ["guide:territory-rush:large-vs-small", "guide:territory-rush:how-territory-works"], [
    { heading: "How to climb", body: "String safe loops until a bot is out of position, then take a large bite. Cuts are extra, not the plan." },
    { heading: "When to stop", body: "The clock is 90 seconds. A greedy trail at 85s is how a 40% run becomes 0." },
  ]),

  guide("sky-stack", "perfect-placement", "Sky Stack Perfect Placement | Gamesweb", "Perfect placement", "Tap when the moving slab covers the top. Perfect keeps the width. A miss ends the climb.", "Clean Five is five perfects in a row.", "Space, click, or tap.", ["one-thumb-games", "precision-games"], ["guide:sky-stack:streaks", "guide:sky-stack:timing"], [
    { heading: "The window", body: "The traveling piece is the only timer. Place early and you overhang. Place late and you lose a slice." },
    { heading: "Leftovers", body: "Missed width becomes scraps that fall. The next slab is already thinner." },
  ]),
  guide("sky-stack", "streaks", "Sky Stack Streaks | Gamesweb", "Streaks", "A long perfect streak is fever: pitch up, score up, sky warmer.", "Fever is a trophy and a state.", "It is not a second mode.", ["score-attack-games"], ["guide:sky-stack:perfect-placement", "guide:sky-stack:high-stack"], [
    { heading: "How fever starts", body: "Keep overlapping perfectly. The halo and particles confirm it. A miss dumps the streak." },
    { heading: "Why it matters", body: "High stacks without fever are possible. High scores without fever are unlikely." },
  ]),
  guide("sky-stack", "timing", "Sky Stack Timing | Gamesweb", "One-tap timing", "The slab speed is readable. Your job is one tap, not a mash.", "Placed is the first-slab trophy.", "R retries instantly.", ["one-thumb-games"], ["guide:sky-stack:perfect-placement", "guide:sky-stack:atmosphere"], [
    { heading: "Watch, then tap", body: "Mashing Space will clip edges. The zen read is the point." },
    { heading: "Phone", body: "Tap anywhere. The control is the whole screen, not a hidden button." },
  ]),
  guide("sky-stack", "high-stack", "Sky Stack High-Stack Strategy | Gamesweb", "High-stack strategy", "Floor 30 is High Air. Floor 67 is Sixty Seven. The sky should be dusk, not black.", "Height is a place.", "Daily uses the same climb.", ["score-attack-games", "daily-challenge-games"], ["guide:sky-stack:streaks", "guide:sky-stack:atmosphere"], [
    { heading: "Protect width", body: "A greedy late tap at floor 28 is how a tower dies. Take a safe overlap and keep fever another ten floors." },
    { heading: "Same seed", body: "A challenge can share the first slabs. Beat their floor, not a random tower." },
  ]),
  guide("sky-stack", "atmosphere", "Sky Stack Atmosphere | Gamesweb", "Dawn to dusk", "The climb walks dawn peach, day blue, golden hour, then lavender dusk. Materials shift ceramic to glass.", "This is not decoration on a black stack screen.", "HUD is HEIGHT.", ["one-thumb-games"], ["guide:sky-stack:high-stack", "guide:sky-stack:timing"], [
    { heading: "Why the sky changes", body: "So a mid screenshot and a peak screenshot are different places. Dusk stays high-key." },
    { heading: "What does not change", body: "One tap. Instant retry. No new button at height." },
  ]),

  guide("crowd-control", "gates", "Crowd Control Gates | Gamesweb", "Gates", "Left and right signs apply add, multiply, subtract, or divide. The label is the decision.", "A +30 must read in half a second.", "Through the gate is the first trophy.", ["arcade-games", "one-thumb-games"], ["guide:crowd-control:multipliers", "guide:crowd-control:preservation"], [
    { heading: "How a gate resolves", body: "Your X position picks the side when the pack reaches the segment. Green is usually + or ×. Red is − or ÷." },
    { heading: "After", body: "The pack respawns to the new count. A multiply should feel like a parade, not a +1 tick." },
  ]),
  guide("crowd-control", "multipliers", "Crowd Control Multipliers | Gamesweb", "Multipliers", "×2 on a large pack is the run. +8 on a large pack is a consolation. Crowd Surge is a ×4.", "Finish multiplier also scales with pack size.", "Do the math before the arch.", ["score-attack-games"], ["guide:crowd-control:gates", "guide:crowd-control:high-population"], [
    { heading: "Order", body: "A ×2 then +10 is not +10 then ×2. Steer for the multiply while the pack is already big." },
    { heading: "Taxes", body: "−20 or ÷2 can erase a parade. If both sides are bad, pick the smaller wound." },
  ]),
  guide("crowd-control", "preservation", "Crowd Control Crowd Preservation | Gamesweb", "Crowd preservation", "A 0 pack ends the run. Clashes, minus gates, and the Guardian all spend people.", "12, 30, 80, 120 should look like different masses.", "Dash (Shift) is speed, not armor.", ["arcade-games"], ["guide:crowd-control:clash", "guide:crowd-control:gates"], [
    { heading: "Keep a floor", body: "Do not take a stylish ÷2 because the sign was closer. The finish multiplier wants bodies." },
    { heading: "Camera", body: "Small packs zoom in. Huge packs pull back. That is framing, not a new map." },
  ]),
  guide("crowd-control", "routes", "Crowd Control Route Choice | Gamesweb", "Lane route choice", "Hidden left routes can be faster. Right routes can be richer. Ghosts remember the side.", "YOU TOOK LEFT · GHOST TOOK RIGHT is a real retry hint.", "Cut In is the shortcut trophy.", ["ghost-race-games"], ["guide:crowd-control:gates", "guide:crowd-control:high-population"], [
    { heading: "Shortcut", body: "A gold notch on the left is a speed bump, not a gate. It raises speed and unlocks Cut In." },
    { heading: "Ghost", body: "A pale marker shows the tape’s lane. Use it as an argument, not as a live rival." },
  ]),
  guide("crowd-control", "clash", "Crowd Control Clash Strategy | Gamesweb", "Clash strategy", "An enemy cluster on your lane starts a clash. You keep the leftover pack.", "PUSHED THROUGH or ROUTE BROKEN.", "Boss routes add a Guardian with a hull bar.", ["survival-and-arena"], ["guide:crowd-control:preservation", "guide:crowd-control:routes"], [
    { heading: "Lane", body: "If the cluster is left, steer right unless you are huge. A 12-pack does not win every fight." },
    { heading: "Guardian", body: "The red block is a DPS check. Pack size is the weapon." },
  ]),
  guide("crowd-control", "high-population", "Crowd Control High-Population Runs | Gamesweb", "High-population runs", "Parade is a finish with 80 or more. The road should fill. The gates should still be readable.", "96 is a finish-banner bucket, not a hard cap on the sim.", "Quality caps how many bodies draw, not how many you have.", ["score-attack-games"], ["guide:crowd-control:multipliers", "guide:crowd-control:preservation"], [
    { heading: "How to get there", body: "Stack multiplies, skip taxes, survive clashes, cash the finish. A late ÷2 is how 90 becomes 45." },
    { heading: "How it looks", body: "Open is a dozen large silhouettes. Peak is a wide ellipse of mixed festival colors." },
  ]),
];
