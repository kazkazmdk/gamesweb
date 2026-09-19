# Platform visual closeout

## Branch

- Branch: `cursor/platform-visual-closeout-c08e`
- Base: `cursor/home-final-closeout-c08e` @ `9fd62bff7c35034f713cbdc2ddec510f2b8ebef9`
- SHA: `PENDING` (remplacé par le commit qui inclut ce fichier)

Aucun merge. Home n’a pas été redesigné.

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

- Neon: plot + chevrons sur la ligne, lampes des deux côtés.
- Swarm: 6 ennemis dès l’ouverture, spawn plus proche les 8 premières secondes.
- Crowd: cadrage lié au pack (gros au départ, masse lisible à 80+).
- Pocket: rails / spectateurs / plaque score.
- Territory: flash de capture plus local.
- Velocity / Knockout / Sky: polish limité, mécaniques intactes.

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
| Friends | Liste / copy roadmap | `friends-1440.png` | Empty stage + invite. Pas un carnet d’adresses. |
| Inbox | — | `inbox-1440.png` | File d’actions vide assumée. |
| Challenges | 3 cartes égales | `challenges-1440.png` | Courante en 2 cols. |
| Party | Formulaire centré | `party-1440.png` | Lobby d’entrée, async dit clairement. |
| Crew | Texte / liste | `crew-1440.png` | Emblème + art + XP. Feed encore mince. |
| Leaderboards | Sélecteurs type formulaire | `leaderboards-1440.png` | Art + onglets jeu + podium. Tabs encore petits. |
| Profile self | `profile-populated-1440-chromium-linux.png` (avatar rond + 3 records vides possibles) | `profile-self-1440.png` | Carte géométrique, records réels only. |
| Profile public | Texte plat « not found » | `profile-public-1440.png` | Empty stage + CTA. Pas de profil public peuplé à capturer (personne réelle absente). |
| Achievements | Catalogue + 2 rangées de filtres | `achievements-1440.png` | Étagère récente en tête. Grille encore catalogue. |
| Settings | Cartes/pills | `settings-1440.png` | Nav accent, formulaire `gw-stage`. Utilitaire. |
| Results | Score + pills | `neon-results-1440.png` / `neon-results-390.png` | Score dominant, 1 CTA. Un finish debug à 0 reste visuellement creux. |
| Pause | Modale rounded | `neon-pause-1440.png` | Rail + jeu visible + Resume. |

## Games

| Jeu | Visuel | Clarté | Screenshots |
| --- | --- | --- | --- |
| Neon Drift | Chevrons / lampes / barrières sur la ligne | Tutoriel scoring | `neon-drift-{open,mid,peak,result}-1440.png`, `neon-drift-play-390.png` |
| Velocity Run | Gate de départ, landmarks existants | Inchangé | `velocity-run-*` |
| Swarm Protocol | Ennemis dès la 1re seconde | Pression d’ouverture | `swarm-protocol-*` |
| Knockout Circuit | Thème FACTORY déjà là | Lisibilité OK, monde encore abstrait | `knockout-circuit-*` |
| Pocket Striker | Rails + spectateurs + plaque | Surface jouable libre | `pocket-striker-*` |
| Territory Rush | Flash de capture | Encore un peu « grille » à l’ouverture | `territory-rush-*` |
| Sky Stack | Halo / impact, peu touché | Déjà le plus propre | `sky-stack-*` |
| Crowd Control | Cadrage pack-aware | Masse lisible 12 vs 86 | `crowd-control-{open,mid,peak}-1440.png` |

## Neon Drift

**Pourquoi c’était illisible:** le tagline « Hold the slide. Bank the score. » est de la marque, pas une leçon. Le score total mélangeait drift live + banked. Un joueur pouvait glisser, voir un nombre, crasher, et ne pas comprendre le bank.

**Nouveau loop (premier run, `gw:neon-tutorial`):**

1. Premier virage — `HOLD DRIFT` + mètre.
2. Pendant le drift — `COMBO ×n` visible.
3. Relâchement — `BANK IT` + floater BANKED. BANKED = total − live, LIVE = unbanked.
4. Collision plus tard: flash combo, pas d’échec forcé dans le tutoriel.

Après un bank réussi, le hint disparaît. Pas de modal. Mécanique de score inchangée.

## Crowd Control

Pas de `setZoom` Phaser. C’est un faux scroll Z.

- Pack &lt; 16: zoom ~1.68, silhouettes ~7×, 1–2 portes.
- Pack moyen: recul modéré.
- Pack ≥ 72: zoom ~0.96, ellipse de masse + plus de corps.
- Clash / payoff: recadrage temporaire.
- `setPack` (debug QA) snap le cadrage.

Open `crowd-control-open-1440.png` (12, gros) vs peak `crowd-control-peak-1440.png` (86, masse). Ce n’est plus le même pixel cluster.

## Testing

Local, HEAD de ce closeout:

```text
pnpm typecheck                         # pass
pnpm lint                              # pass (warning existant GameArt <img>)
pnpm test                              # 99 passed / 7 files
pnpm build                             # pass
pnpm exec playwright test e2e/smoke.spec.ts e2e/platform.spec.ts e2e/gameplay.spec.ts e2e/progression.spec.ts e2e/security.spec.ts
                                       # 48 passed
QA_MATRIX=1 pnpm exec playwright test e2e/qa-matrix.spec.ts
                                       # 4 passed (66 PNG)
pnpm exec playwright test e2e/visual.spec.ts
                                       # 13 passed after reviewing Arcade + Profile actuals
```

Snapshots visuels mis à jour **après** revue manuelle, uniquement Arcade + Profile (redesign voulu). Home Swarm: le test attend maintenant Velocity avant le 2e ArrowRight (flaky focus, pas un redesign Home).

## Performance

`next build` First Load JS:

- Home `/` 8.46 kB / 157 kB
- `/play/[slug]` 8.79 kB / 154 kB
- shared 102 kB

Pas de lib d’images. Art existant + CSS/SVG. Pas de régression de bundle notable vs Home final.

## Remaining issues

### P0

Vide pour les 10 critères, avec les nuances ci-dessous. Rien n’est « fake product ».

### P1

- Leaderboards: onglets jeu trop petits; podium à 1 ligne réelle (données honnêtes) a l’air seul.
- Crew: feed vide encore plat sous le hero.
- Achievements: sous l’étagère, ça reste un catalogue.
- Results à score 0 (finishRun QA) n’est pas un « reward moment » fort.
- Knockout / Territory: thèmes là, mais encore proches d’une lecture technique.
- Crowd peak: lisible, mais la masse pourrait occuper plus de largeur.
- Friends empty: titre « Friends » + empty stage = un peu de double hiérarchie.

### P2

- Settings volontairement utilitaire.
- Hub: le SEO existe toujours en bas (voulu).
- Neon hors ligne de course encore mince.
- Velocity reste silhouette / plateforme.
- Pas de profil public peuplé à photographier sans inventer un joueur.

Ne pas lire « tout est parfait ». Le cliff SaaS / launcher a surtout disparu sur Daily, GP, Arcade, Hub, Pause, Party, Results. Social vide est maintenant *designé*, pas *oublié*. La densité monde des jeux 2D reste le vrai chantier suivant.
