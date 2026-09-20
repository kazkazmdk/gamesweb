# Games / platform / SEO closeout

- Branch: `cursor/games-platform-seo-closeout-c08e`
- Base: `cursor/game-art-direction-rebuild-c08e` @ `c7e307cceec8d876b5f6e65134ba318e735fc222`
- SHA: `8aaea065284d055a80c7d29c1d526930a0a56471`
- PR: https://github.com/kazkazmdk/gamesweb/pull/17
- Aucun merge.

Cette passe n’est pas « SEO complete » et ne prétend aucun trafic.

## Games

Captures: `docs/qa-game-art-direction/` (open / mid / peak / payoff / 390 + cas spéciaux). Contact sheets: `contact-sheet-open-1440.png`, `contact-sheet-peak-1440.png`.

### Neon Drift

**Changé:** roadside plus dense par track (Harbour service, District tunnel, Ridge touge) ; marks / smoke / near-edge plus lourds. Tutoriel `gw:neon-tutorial-v2` inchangé.

**Captures:** `neon-drift-open-1440.png`, `hold`, `combo`, `bank`, `break`, `peak`, `payoff`, `play-390`.

**Reste:** la capture `combo` montre encore HOLD / LIVE +0 — `setDrive` n’a pas produit un gros drift photographiable. Le roadside existe mais un no-HUD peak n’a pas été isolé. P1: le drift doit encore gagner le frame contre le décor.

### Velocity Run

**Changé:** trois familles (HVAC day, transit amber, comms indigo) + `setCourse`.

**Captures:** `velocity-run-hvac-1440.png`, `transit`, `comms`, plus open/mid/peak.

**Reste:** les ciels se lisent en 0,5 s. Les kits (HVAC / crane / antenna) restent encore du dressing 2D, pas une architecture urbaine dense. Velocity ≠ Knockout sur le ciel, oui. P2: densifier les props sans toucher aux collisions.

### Swarm Protocol

**Changé:** silhouettes skitterer / swarmer / spore / tank / elite + `seedPeak` (36 hostiles mixés).

**Captures:** `swarm-protocol-peak-1440.png` vs open.

**Reste:** peak est plus dense, mais les familles se lisent encore comme des formes. Opening ≠ peak, oui. « Mon build est puissant » n’est pas encore évident (HUD / deck peu spectaculaire). P1 restant: lisibilité des familles + framing boss.

### Knockout Circuit

**Changé:** bras / rollers / pistons / crushers / fans habillés ; ciel toy cyan distinct de Velocity.

**Captures:** `knockout-circuit-open-1440.png` (bras rose + convoyeur).

**Reste:** la signature spinner se voit. Open ≈ peak sur Starter Gates. Pas encore un plateau télévisé (audience / scoreboard trop discrets dans le frame). P2.

### Pocket Striker

**Changé:** diorama par thème (lampe, cartes, plaque, foule).

**Captures:** open/mid/peak/payoff.

**Reste:** le plateau est plus meublé. Open ≈ peak (table statique). P2: variantes Workshop / Garden / Arcade encore trop proches dans un screenshot 1440.

### Territory Rush — P1

**Changé:** moins de maisons ; ribbon ; fill wave ; `closeLoop` inonde une grande zone.

**Captures:** `territory-rush-fill-1440.png` / `peak` — le magenta domine, `+37%`, bots étiquetés.

**Reste:** la capture de territoire gagne le frame. Texture de settle / punch caméra encore courts. P2: Plaza vs Toy City peu distincts au peak.

### Sky Stack

**Changé:** dawn → day → gold → lavender ; `stackTo(48)` pour dusk.

**Captures:** `sky-stack-peak-1440.png` — lavande, HEIGHT 48.

**Reste:** zen et lisible. Matériaux ceramic/glass encore subtils. P2.

### Crowd Control — P1

**Changé:** arches + labels énormes ; `seekGate` ; pack 12 vs 86.

**Captures:** `crowd-control-gate-before-1440.png` (`×2` / `+5` / `+6` / `+4`) ; `gate-after` PACK 86.

**Reste:** un screenshot Count-Masters-like se lit. Small/medium/huge se distinguent. P2: compression avant passage et punch caméra encore discrets.

## Platform

Home non redesignée. Nav desktop reste Games + Arcade. Footer produit: Games, Collections, Guides, Learn, About, Privacy, Terms. Home expose un nav catalogue `sr-only` crawlable.

### Surfaces fixées

| Surface | Fix | Capture |
| --- | --- | --- |
| Friends empty | Stage + invite + 3 cartes honnêtes, pas de faux joueurs | `docs/qa-games-platform-seo-closeout/friends-empty-1440.png` |
| Leaderboards empty | Art + first-score + contexte PB local, pas de podium fake | `leaderboards-empty-1440.png` |
| Achievements | 0/67, shelf vide honnête, featured locked | `achievements-empty-1440.png` |
| Game Hub | Editorial visible sous le produit | `hub-neon-editorial-1440.png` |
| Results | `zeroResultCopy()` déjà game-aware (Neon seul « banked ») | e2e gameplay |
| Pause | inchangé, visuel Home OK | visual spec |
| Noindex | daily, GP, party, play, profile public, `/c/[code]` | smoke + seo e2e |

### Régressions

`e2e/visual.spec.ts` (Home 1440/1920/390, Arcade, Profile, Achievements, Settings, Hub Neon) : **pass** sans `--update-snapshots`.

## SEO

Voir `docs/SEO-SURFACE.md`.

- **98 URLs indexables** (quality gate: 0 title/desc/H1/relation/orphan blockers)
- Sitemap = registry `indexable === true`, `lastModified` = `updatedAt`
- `/arcade` et `/play/*` absents du sitemap
- JSON-LD: WebSite, VideoGame, BreadcrumbList, ItemList, Article — pas de notes/reviews
- Guides / collections / learn : **107 kB** first-load, pas de Phaser (e2e)
- Game hubs : 163 kB (player chrome). Play : 155 kB
- `/games`, `/collections`, `/guides`, `/learn` restent `ƒ` dynamiques à cause du root layout `headers()` ; les pages `[slug]` sont SSG

## Validation

| Commande | Résultat |
| --- | --- |
| `pnpm typecheck` | pass |
| `pnpm lint` | pass (warning `no-img-element` préexistant sur `GameArt`) |
| `pnpm test` | 110 pass (dont 9 SEO) |
| `pnpm build` | pass, 143 pages |
| `e2e/smoke.spec.ts` | pass |
| `e2e/platform.spec.ts` | pass |
| `e2e/gameplay.spec.ts` | pass |
| `e2e/progression.spec.ts` | pass |
| `e2e/security.spec.ts` | pass |
| `e2e/visual.spec.ts` | pass, **aucun update de snapshot** |
| `e2e/seo.spec.ts` | pass |
| `QA_MATRIX=1` art-direction + seo-closeout-qa | pass |

Bundles: une page guide/collection ne charge pas Phaser. Le runtime joueur reste sur `/play/[slug]` et le hub.

### Vercel

Projet lié: `prj_6myfSW55ydOMzlVGnsicj2jCAgVk` (gamesweb). Preview de `d2493b2` : **ERROR** (`dpl_7R5SnNog7jNihSD7jhMeC7WrVyxJ`) — import barrel `components/visual` depuis une page SEO (hooks client). Corrigé en important `GameBackdrop` directement. Relire le preview après ce push. Aucun chiffre Search Console.

## Remaining

### P0

Aucun bloquant build / e2e / indexation.

### P1

- Neon: le gros drift n’est pas encore prouvé par la capture combo (LIVE reste 0 sur le shot `setDrive`).
- Swarm: peak dense mais familles encore trop « formes » ; boss framing faible.
- Copy catalogue `/games`: hero adouci (« public catalog ») dans ce commit. Vérifier le recapture n’a pas été refait.

### P2

- Velocity / Knockout / Pocket : dressing encore kit.
- Sky matériaux encore subtils.
- Indexes SEO (`/games`, `/collections`, `/guides`, `/learn`) dynamiques à cause du nonce layout.
- Pas de Search Console, pas de volume réel.
- Collections volontairement non créées (solo / keyboard / mobile / no-download / high-score / replayable).

## End state

Gamesweb a huit mondes distincts, une plateforme qui ne ment plus sur le vide, et **98 pages publiques** reliées autour des jeux réellement shippés — pas seulement huit hubs isolés. Ce n’est pas un classement. Ce n’est pas « SEO complete ».
