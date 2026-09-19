# Art-direction polish closeout

## Branch / SHA

- Branch: `cursor/art-direction-polish-c08e`
- Base: `cursor/platform-visual-closeout-c08e` @ `327e7865d6ce1466515dea7d6d4fd96f3e967a01`
- SHA: *(stamped after the matrix commit)*

Aucun merge. Home n’a pas été redesigné. Pas de nouvelle marque, pas de nouveau design system.

## CTA semantics

Trois familles seulement. Pas cinq couleurs.

| Famille | Traitement | Exemples |
| --- | --- | --- |
| **Platform** | Crème `#f3f1ec`, forme chanfreinée, contraste élevé | Invite, Copy link, Create party, Find a rival, Share challenge |
| **Game** | `--accent` du jeu actif | Play / Continue, Retry, Play again, Continue Endless |
| **Event / competitive** | `--accent` de l’événement ou du jeu courant | Enter today, Enter stage, Race this round, Answer, Rematch |

`ChamferButton` `tone="platform"` = crème. `tone="primary"` = accent courant (jeu ou event via `useAccent`). Ghost / quiet restent secondaires.

## Screens changed

Profile, Friends, Leaderboards, Achievements, Arcade, Daily, Grand Prix, Hub, Crew, Inbox, Party, Challenges, Results, Pause, Settings (nav only). Huit mondes de jeu. Home inchangé (mêmes JPG / même layout).

## Exact design errors fixed

### Profile

- `SETTINGS` orphelin → bouton icône géométrique attaché à la carte (`aria-label="Settings"`).
- `LEVEL PROGRESS` vide → barre réelle dans la carte: `Lv n`, XP current / next, marqueur next level.
- Demi-écran mort compressé (`min-h` 200/240 au lieu de 280/360).
- Carte: cadre avatar, profondeur de backdrop, hiérarchie chiffre > label.

### Friends

- Empty state n’est plus un rectangle géant + titre doublon.
- Objet social: identité + siège vide + VS + ce que l’amitié ouvre (Challenge / Compare / Rival / Activity) + invite. Aucune donnée fake.

### Leaderboards

- Sélecteur jeu: tiles 10.5×6.5rem + nom visible + frame de sélection.
- Mode / board: chips géométriques, plus des underlines.
- 1 score réel: podium honnête « Set the pace. » Pas de joueurs inventés.
- ≥3: podium avec échelle de rang.

### Achievements

- Featured Beacon n’est plus un bloc texte dans un vide 3-col.
- Hero trophy + plinthe + motif, puis étagère à slots, filtres secondaires.
- Grille: rangées trophée, pas des cartes catalogue.

## Art direction improvements

| Surface | Polish |
| --- | --- |
| Arcade | Atmosphere / grain / vignette / enrichissement de scène sur le hero existant. Label Progression retiré. |
| Hub | Layout intact. Genre en texte discret. Même traitement matériel sur l’art. |
| Daily / GP | Route plus contrastée (done / current / locked). Kickers meta retirés. |
| Results | Count-up, état 0 silencieux (`Attempt`), CTA jeu + share platform. |
| Pause | Rail matériel, hint clavier, divider. Resume toujours sélectionné. |
| Crew | Emblème plus grand, strip membres, zone activité en arène (pas de faux feed). |
| Inbox / Party | Labels réduits. CTA platform. |

Matérialité: inner edge, grain, haze lié à l’accent, pas de glassmorphism global.

## Games

| Jeu | World | Clarity |
| --- | --- | --- |
| Neon Drift | Bordures, panneaux, overpass, skyline plus dense, lampes / chevrons conservés | HOLD → COMBO → BANK intact |
| Velocity Run | Shaft / corridor / ascent distincts, foreground silhouettes | Contraste player / hazard inchangé |
| Knockout | Usine: pipes, vents, warning, plateformes ancrées | Obstacles lisibles |
| Territory | Fill + lueur de bord + sweep de capture | Grille toujours lisible |
| Swarm | Sol, structures lointaines, trails plus nets | Joueur jamais perdu |
| Crowd | Masse + ombre de contact plus large | Camera pack-aware intacte |
| Pocket | Cadre / feutre / profondeur / spectateurs discrets | Playfield libre |
| Sky Stack | Halo / ombre de dalle / ciel | Simplicité conservée |

## Performance

Mesuré au `next build` de cette passe (à tamponner). Pas de PNG lourds, pas de lib 3D, pas de vidéo. CSS + SVG overlay + draw Phaser existant.

## QA

Tamponné après exécution.

## Remaining issues

### P0

Vide (critères A–L).

### P1

- Les JPG hero restent des captures gameplay: plus riches après le monde, mais ce n’est pas de l’illustration peinte.
- Home utilise toujours ces JPG (voulu).
- Settings reste utilitaire.

### P2

- Parallax souris non ajouté (drift CSS seulement, `prefers-reduced-motion` respecté).
- Recapture hero JPG optionnelle si on veut aligner Home sur les nouveaux mondes.
