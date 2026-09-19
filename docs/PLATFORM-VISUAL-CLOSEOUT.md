# Platform visual closeout

## Branch

- Branch: `cursor/platform-visual-closeout-c08e`
- Base: `cursor/home-final-closeout-c08e` @ `9fd62bff7c35034f713cbdc2ddec510f2b8ebef9`
- SHA: `c5f1ccf` (P1 QA pass; stamp after this commit)

Aucun merge. Home n’a pas été redesigné. Cette passe ne recommence pas le closeout : elle ferme les P1 encore visibles.

## What changed

### Foundation

- Grammaire extraite de Home: `.gw-cta` chanfreiné, `.gw-frame` / ticks, `.gw-route`, `.gw-versus`, `.gw-podium`, `.gw-pause-item`, `.gw-stage`.
- Primitives: `ChamferButton`, `GameBackdrop`, `EventRoute`, `EmptyStateStage`, `PlayerVersus`, `ProgressionStrip`, `PlayerIdentity`, `RankPodium`, `TrophyShelf`.
- Crop mobile/laptop via `--gw-crop-*` sur `GameBackdrop` (composition, pas un scale desktop).

### Social OS + events

- **Daily Arcade**: hero de l’étape courante + route 1→2→3 dans le premier viewport. Copy produit: « Same run for everyone today ». Plus de seed brut.
- **Grand Prix**: round courant dominant + route 5 étapes (current / locked / done). Pas cinq cartes égales.
- **Friends**: Playing / Challenges / Rivals d’abord. Empty stage honnête. Copy roadmap retirée. Join = « Play this game ».
- **Inbox**: file d’actions, pas un mailer.
- **Party**: entrée de lobby (Create party dominant + code en secondaire). Pas un formulaire centré.
- **Crew**: emblème + art Territory + XP / objectif semaine. Feed réel seulement.
- **Challenges**: quête courante en 2 colonnes, les autres reculent.

### Gameplay loop UI

- **Results**: score énorme, métriques de jeu, 1 CTA dominant + 2 secondaires max.
- **Pause**: rail gauche, jeu visible, Resume sélectionné en chanfrein.
- **Neon Drift**: tutoriel HOLD DRIFT → COMBO → BANK IT. HUD BANKED / LIVE / COMBO.

### Platform

- **Arcade**: command center (situation du jour + progression dans le premier écran).
- **Game Hub**: art + 1 CTA Play/Continue. SEO dans `<details>` plus bas (`The game` conservé).
- **Leaderboards**: art de jeu + onglets visuels + podium + Rivals.
- **Profile**: carte joueur + jeux avec records réels seulement.
- **Achievements**: compteur + étagère récente, filtres secondaires.
- **Settings**: même langue de focus, reste utilitaire.
- **Play Index**: « All eight games » (plus de « Three ways to play »).

### Eight games

- Neon: plot + chevrons, lampes, immeubles / panneaux roadside. HUD BANKED / LIVE / COMBO. Tuto HOLD DRIFT → COMBO → BANK IT avec LIVE vs BANKED dans le playfield (hors chrome).
- Swarm: 6 ennemis dès l’ouverture, spawn plus proche les 8 premières secondes.
- Crowd: cadrage pack-aware ; à 86 la masse occupe presque toute la largeur de voie.
- Pocket: rails / spectateurs / plaque score.
- Territory: quartiers en damier + rues, bord joueur plus marqué.
- Knockout: usine (lampes, caisses, bandes, tuyaux). Spinner toujours lisible.
- Velocity: arche de départ dans le premier viewport + tour / lampadaire. Toujours une lecture plateforme.
- Sky: inchangé.

## Design system

Réutilisé depuis Home, pas une nouvelle marque:

| Primitive | Rôle |
| --- | --- |
| `ChamferButton` / `.gw-cta` | Une action dominante |
| `.gw-frame` / ticks | Sélection visible sans lire |
| `EventRoute` | Daily / GP / Party playlist |
| `GameBackdrop` | Identité du jeu courant |
| `EmptyStateStage` | Vide intentionnel |
| `PlayerVersus` | Challenges / rivals |
| `ProgressionStrip` | Niveau, pas 4 widgets |
| `RankPodium` | Top 3 |
| `TrophyShelf` | Collectibles |
| `PlayerIdentity` | Carte joueur |
| `.gw-pause-item` | Overlay console |

Anti-patterns réduits: `rounded-2xl` / pills égales / cartes SaaS partout. Pas de néon violet par défaut.

## Before → After

Avant = baselines Home final (`e2e/visual.spec.ts-snapshots/*` @ `9fd62bff`, captures `docs/qa-closeout`, `docs/qa-home-final`). Après = `docs/qa-platform-visual-closeout/`.

| Surface | Before | After | Amélioration réelle |
| --- | --- | --- | --- |
| Home Neon | `e2e/visual.spec.ts-snapshots/home-neon-1440-chromium-linux.png` | `docs/qa-platform-visual-closeout/home-neon-1440.png` | Inchangé à dessein. |
| Arcade | Snapshot dashboard @ `9fd62bff` (player card + 3 widgets Daily) | `arcade-1440.png` / `arcade-390.png` | Situation du jour + Lv dans le fold. Plus un tableau de bord. |
| Daily | Stack de cartes étroites (QA closeout) | `daily-1440.png` / `daily-390.png` | Route 3 étapes, current plus grand, desktop horizontal / mobile vertical. |
| Grand Prix | Liste de rounds | `grand-prix-1440.png` / `grand-prix-390.png` | Carte de coupe: current vs locked. |
| Hub Neon | `hub-neon-1440-chromium-linux.png` (Play + Play) | `hub-neon-1440.png` | Un Continue. SEO plus bas. |
| Friends | Liste / copy roadmap | `friends-1440.png` | Une hiérarchie : Friends + body + invite. |
| Inbox | — | `inbox-1440.png` | File d’actions vide assumée. |
| Challenges | 3 cartes égales | `challenges-1440.png` | Courante en 2 cols. |
| Party | Formulaire centré | `party-1440.png` | Lobby d’entrée, async dit clairement. |
| Crew | Texte / liste | `crew-1440.png` | Emblème + roster + empty stage. Quiet house encore sous le fold. |
| Leaderboards | Sélecteurs type formulaire | `leaderboards-1440.png` | Tuiles jeu titrées + standing featured. 1 score honnête, pas 3 fantômes. |
| Profile self | `profile-populated-1440-chromium-linux.png` (avatar rond + 3 records vides possibles) | `profile-self-1440.png` | Carte géométrique, records réels only. |
| Profile public | Texte plat « not found » | `profile-public-1440.png` | Empty stage + CTA. Pas de profil public peuplé à capturer (personne réelle absente). |
| Achievements | Catalogue + 2 rangées de filtres | `achievements-1440.png` | Étagère récente + shelf collectible. Filtres secondaires. |
| Settings | Cartes/pills | `settings-1440.png` | Nav accent, formulaire `gw-stage`. Utilitaire. |
| Results | Score + pills | `neon-results-1440.png` / `neon-results-390.png` | Score dominant. À 0 : « No score banked » + Play again + loop. |
| Pause | Modale rounded | `neon-pause-1440.png` | Rail + jeu visible + Resume. |

## Games

| Jeu | Visuel | Clarté | Screenshots |
| --- | --- | --- | --- |
| Neon Drift | Chevrons / lampes / roadside | HOLD → COMBO/LIVE → BANK photographié | `neon-drift-{open,hold,combo,bank,break}-1440.png` |
| Velocity Run | Arche de départ dans le fold | Inchangé (précision) | `velocity-run-*` |
| Swarm Protocol | Ennemis dès la 1re seconde | Pression d’ouverture | `swarm-protocol-*` |
| Knockout Circuit | Lampes / caisses / bandes / tuyaux | Lisibilité obstacles OK | `knockout-circuit-*` |
| Pocket Striker | Rails + spectateurs + plaque | Surface jouable libre | `pocket-striker-*` |
| Territory Rush | Quartiers + rues | Encore une lecture carte/grille | `territory-rush-*` |
| Sky Stack | Halo / impact, peu touché | Déjà le plus propre | `sky-stack-*` |
| Crowd Control | Cadrage pack-aware | 12 gros vs 86 largeur de voie | `crowd-control-{open,mid,peak}-1440.png` |

## Neon Drift

**Pourquoi c’était illisible:** le tagline « Hold the slide. Bank the score. » est de la marque, pas une leçon. Le score total mélangeait drift live + banked. Un joueur pouvait glisser, voir un nombre, crasher, et ne pas comprendre le bank. Le HUD Phaser était aussi sous le chrome HTML (Back / Invite).

**Loop vérifié en play réel (captures `neon-drift-{open,hold,combo,bank}-1440.png`):**

1. 0.5s — `HOLD DRIFT` + `LIVE +0  BANKED 0` au centre du playfield.
2. 1.6s — voiture en slide, `COMBO ×1.0` + `LIVE +31  BANKED 0`.
3. 2.7s — LIVE continue de monter (`+361`), BANKED reste 0. Distinction unbanked / banked lisible.
4. 3.2s — `BANK IT` + `LIVE +557 → BANKED`.
5. Collision plus tard: flash `COMBO BROKE` (pas forcé dans le tuto). La drive QA de 4s n’a pas percuté un mur ; la perte de combo n’est donc pas sur la photo `break`.

Après un bank réussi, le hint disparaît. Pas de modal. Mécanique de score inchangée (`setDrive` debug peut maintenant tenir un slide pour la QA).

## Crowd Control

Pas de `setZoom` Phaser. C’est un faux scroll Z.

- Pack &lt; 16: zoom ~1.68, silhouettes ~7×, 1–2 portes.
- Pack moyen: recul modéré.
- Pack ≥ 72: zoom ~0.96, ellipse de masse + plus de corps.
- Clash / payoff: recadrage temporaire.
- `setPack` (debug QA) snap le cadrage.

Open `crowd-control-open-1440.png` (12, gros) vs peak `crowd-control-peak-1440.png` (86, masse qui traverse presque toute la voie). Ce n’est plus le même pixel cluster.

## Testing

Local, passe P1 (après revue des captures QA) :

```text
pnpm typecheck                         # pass
pnpm lint                              # pass (warning existant GameArt <img>)
pnpm test                              # 99 passed / 7 files
pnpm build                             # pass — Home 8.46 kB / 157 kB, play 8.94 kB / 154 kB, shared 102 kB
pnpm exec playwright test e2e/smoke.spec.ts e2e/platform.spec.ts e2e/gameplay.spec.ts e2e/progression.spec.ts e2e/security.spec.ts e2e/visual.spec.ts
                                       # 61 passed
QA_MATRIX=1 pnpm exec playwright test e2e/qa-matrix.spec.ts
                                       # 4 passed (70 PNG, + neon hold/combo/bank/break)
```

Snapshots Playwright **non** régénérés à l’aveugle : `e2e/visual.spec.ts` est resté vert (Home / Arcade / Profile / Achievements / Settings / Hub). Les PNG QA dans `docs/qa-platform-visual-closeout/` ont été recapturés **après** inspection des P1.

## Performance

`next build` First Load JS:

- Home `/` 8.46 kB / 157 kB
- `/play/[slug]` 8.79 kB / 154 kB
- shared 102 kB

Pas de lib d’images. Art existant + CSS/SVG. Pas de régression de bundle notable vs Home final.

## Remaining issues

### P0

Toujours vides sur les 10 gates, revus sur les captures actuelles. Rien n’est fake product.

### P1 fermés dans cette passe (preuve QA)

- Leaderboards: tuiles `h-24 w-40` / `md:h-[7.5rem]` avec titre ; standing honnête en carte featured. `leaderboards-1440.png` / `leaderboards-390.png` — le standing est dans le premier viewport mobile.
- Friends empty: une seule hiérarchie (`Friends` + body). `friends-1440.png` / `friends-390.png`.
- Crew: roster maison + empty stage « Quiet house » (encore sous le fold du hero). `crew-1440.png`.
- Achievements: étagère collectible 5 cols, filtres secondaires. `achievements-1440.png`.
- Results 0: « No score banked » + Play again + `HOLD DRIFT → COMBO → BANK IT`. `neon-results-1440.png`.
- Crowd peak: masse large. `crowd-control-peak-1440.png`.
- Knockout: usine lisible. `knockout-circuit-open-1440.png`.
- Neon tuto: HOLD → COMBO/LIVE → BANK IT photographié. `neon-drift-{open,hold,combo,bank}-1440.png`.

### P1 / P2 encore vrais

- Crew: « Quiet house » commence sous le fold ; le hero + semaine + roster prennent le premier écran.
- Leaderboards à 1 score vérifié reste visuellement seul — honnête, pas un podium de 3 fantômes.
- Territory: damier / rues, mais ça lit encore « carte technique » plus que Paper.io.
- Velocity: arche de départ visible, le reste reste silhouette / plateforme.
- Neon hors ligne de course: immeubles et panneaux là, le void autour de l’asphalte reste large.
- Perte de combo Neon: code + flash `COMBO BROKE` OK ; pas de photo mur dans la drive QA de 4s.
- Settings utilitaire (voulu). Hub SEO en bas (voulu). Pas de profil public peuplé sans inventer un joueur.

Ne pas lire « tout est parfait ». Les P1 de surface (Leaderboards, Friends, Results 0, Crowd peak, tuto Neon) ont une preuve visuelle. La densité monde 2D (Territory / Velocity / hors-piste Neon) reste le chantier suivant, sans changer les collisions.
