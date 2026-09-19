# Art-direction polish closeout

## Branch / SHA

- Branch: `cursor/art-direction-polish-c08e`
- Base: `cursor/platform-visual-closeout-c08e` @ `327e7865d6ce1466515dea7d6d4fd96f3e967a01`
- SHA: `090e8557de1680db20d0742cda41e9f4fb4c376f`
- PR: https://github.com/kazkazmdk/gamesweb/pull/15

Aucun merge. Home n’a pas été redesigné. Pas de nouvelle marque, pas de nouveau design system.

## Screens changed

Profile, Friends, Leaderboards, Achievements, Arcade, Daily, Grand Prix, Hub, Crew, Inbox, Party, Challenges, Results, Pause, Settings (focus / nav only). Huit mondes de jeu. Home inchangé (mêmes JPG / même layout).

Les fonds plateforme (Arcade, Hub, Daily, GP, Profile, LB, Crew) utilisent `PlatformScene` (SVG auteur). Home continue d’utiliser `GameArt` JPG.

## Exact design errors fixed

### Profile

- `SETTINGS` orphelin → bouton icône géométrique attaché en haut à droite (`aria-label="Settings"`).
- `LEVEL PROGRESS` vide → barre réelle dans la carte: `Lv n`, `n / m XP`, marqueur `Next · Lv n`.
- Demi-écran mort compressé (`min-h` 200/240).
- Carte: cadre avatar, scène Neon auteur, hiérarchie chiffre > label.

### Friends

- Empty state n’est plus un rectangle géant + titre doublon.
- Objet social compact: identité + siège vide + VS + Challenge / Compare / Rival / Activity + invite crème.
- Aucune donnée fake.

### Leaderboards

- Sélecteur jeu: tiles 12.75×7.75rem (10rem mobile) + nom + scène auteur + frame de sélection.
- Mode / board: chips géométriques.
- 1 score réel: podium honnête « Set the pace. » Pas de joueurs inventés.

### Achievements

- Featured Beacon ancré à gauche: plinthe, icône matériau, silhouette trophée, rail d’étagère.
- Plus un bloc texte dans un vide 3 colonnes.
- Filtres en chips secondaires. Grille en rangées trophée.

## CTA semantics

Trois familles seulement.

| Famille | Traitement | Exemples |
| --- | --- | --- |
| **Platform** | Crème `#f3f1ec`, chanfrein | Invite, Copy link, Create party, Find a rival, Share challenge, Play (profile empty) |
| **Game** | `--accent` du jeu actif | Play / Continue, Retry, Play again, Continue Endless |
| **Event / competitive** | `--accent` événement / jeu courant | Enter today, Enter stage, Race this round, Answer, Rematch |

Score 0: état `Attempt`, CTA dominant = Retry (jeu), secondaire = Share challenge (platform). Pas de célébration.

## Art direction improvements

| Surface | Polish |
| --- | --- |
| Arcade | Scène Swarm auteur (arène, tours, vaisseau) à la place de la capture gameplay. Grain / haze / inner edge. |
| Hub | Layout intact. Route + skyline + eau + lampes, plus une route vide. |
| Daily / GP | Mêmes routes; tuiles = scènes auteur; current spotlight conservé. |
| Results | Count-up, Attempt silencieux, Retry / Share. |
| Pause | Rail, hint Enter / ↑↓ / Esc, jeu visible. |
| Crew | Emblème, scène territoire, arène d’activité (pas de faux feed). |
| Inbox / Party | Labels réduits. CTA platform. |

Matérialité: inner edge, grain, haze d’accent. Pas de glassmorphism global.

## Games

| Jeu | World | Clarity |
| --- | --- | --- |
| Neon Drift | Tablier visible, buildings trackside dans le cadre caméra, zoom un peu plus large, lampes / gate / HOLD DRIFT | HOLD → COMBO → BANK intact |
| Velocity Run | Shaft / immeubles plus contrastés, bande énergie | Player / hazard inchangés |
| Knockout | Usine lisible: colonnes, pipes, lumières, sol | Obstacles ancrés |
| Territory | Plateau cadré, damier de lecture, glow de capture | Grille toujours lisible |
| Swarm | Anneaux + dalles + tours près du joueur | Joueur jamais perdu |
| Crowd | Masse + ombre de contact | Camera pack-aware intacte |
| Pocket | Cadre / feutre / profondeur | Playfield libre |
| Sky Stack | Halo / ombre / ciel | Simplicité conservée |

## Performance

`next build` après polish:

| Route | Size | First Load |
| --- | --- | --- |
| Home `/` | 8.46 kB | 157 kB |
| Play slug | 9.14 kB | 155 kB |
| Shared | 102 kB | |

Avant closeout visuel: Home 8.46/157, play 9.12/154, shared 102. Pas de PNG lourds, pas de lib 3D, pas de vidéo. SVG inline + draw Phaser.

## QA

| Check | Result |
| --- | --- |
| typecheck | pass |
| lint | pass (warning `GameArt` `<img>` préexistant) |
| unit | 99/99 |
| build | pass |
| Playwright fonctionnel | 48/48 |
| Playwright visual | 13/13 (baselines Arcade / Profile / Achievements revues) |
| QA_MATRIX | 4/4 → `docs/qa-art-direction-polish/` (+ `before/` utile) |
| GitHub CI `check` | pass on `090e855` — [run 35444406923](https://github.com/kazkazmdk/gamesweb/actions/runs/35444406923) |
| GitHub CI `database` | pass |
| Vercel preview | Ready — `dpl_2AynSExJWowQKGR9WryFRrUfhcoH` |

## Remaining issues

### P0

Vide (critères A–L traités).

### P1

- Les scènes SVG restent géométriques: plus des captures gameplay, pas de peinture.
- Neon in-game: buildings / tablier visibles, le vide n’est plus accidentel, mais la densité Trackmania n’est pas là.
- Velocity reste un platformer lisible plus que des landmarks mémorables.
- Territory: plateau plus assumé, encore une grille (voulu pour la lecture).
- Achievements: le featured est un cabinet; la liste basse reste un catalogue honnête.
- Home utilise toujours les JPG gameplay (voulu).
- Settings reste utilitaire.

### P2

- Parallax souris non ajouté (drift CSS, `prefers-reduced-motion` respecté).
- Recapture JPG Home si on veut aligner Home sur les nouveaux mondes.
- Icônes trophées encore simples (langage géométrique unique, pas un set peint).
