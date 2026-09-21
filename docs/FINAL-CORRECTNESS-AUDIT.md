# Audit de correction backend — constat avant correctif

Branche : `cursor/production-social-closure-032a`  
HEAD audité : `9002c9485d5b2d42dd113589e8d9653a776ca14e`  
Date : 2026-09-21

Chaque ligne a été lue dans le code ou dans le journal CI. Rien ici n’est un correctif.

Politique de confiance retenue pour la suite (une seule) :

- Party : un run `flagged` est refusé (`invalid_score`). Aucun point.
- Challenge create et attempt : un run `flagged` est refusé (`invalid_score`).
- `verified` et `unverified` sont acceptés, stockés tels quels. Un run non vérifié n’est jamais promu `verified`.
- Le seed de challenge stocké (`${gameId}:${runId}`) n’est pas un seed de partie. Il n’est pas comparé. `seed_mismatch` ne s’applique que si les deux côtés portent un seed de partie non vide.

| ISSUE | CURRENT | EXPECTED | MEMORY | SUPABASE | TEST | SEVERITY | FIX |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Scoring Party | `submitPartyRound` appelle `rankScores` sur un seul joueur et ajoute 10 points tout de suite (`memory.ts` ~934, `supabase.ts` ~1052) | Aucun point tant que le roster du round n’est pas complet ; ensuite `rankScores` sur toutes les tentatives, `PARTY_POINTS` | Oui, même bug | Oui, même bug | `tests/social-arcade.test.ts` ne vérifie pas les points | P0 | `rankPartyRound` + `applyRoundPoints` uniquement à la clôture |
| Source du round | Le classement part du joueur courant, pas des tentatives | `party_round_attempts` (ou équivalent mémoire) est la vérité ; `submitted` n’est qu’un cache | `submitted` seulement | insert puis update séparé | aucun | P0 | tentatives puis ranking |
| Mode Party | seul `run.gameId === slot.gameId` | `run.mode === slot.mode`, erreur `mode_mismatch` | absent | absent | absent | P0 | `validateCompetitiveRunTarget` |
| Mode Challenge | `attemptChallengeFromRun` compare le jeu seulement | jeu et mode ; seed seulement s’il est réel | absent | absent | jeu seulement | P0 | même helper |
| Atomicité Party | Supabase : insert attempt, update members, update `submitted`/`standings`/`state` en allers-retours | RPC `submit_party_round_attempt` avec `FOR UPDATE` | `withLock` JS, pas de course DB | course last-write-wins sur `submitted` | `pnpm test:db` n’atteint pas les checks | P0 | migration `0008` |
| Lower-is-better | `lowerIsBetter` existe mais le classement d’un seul score donne toujours 10 | Velocity / Knockout / Pocket : plus petit = 1er | helper ignoré dès qu’il n’y a qu’un score | idem | `rankScores` unitaire seulement | P0 | ranking du round complet |
| `pnpm test:db` | `scripts/db/run-integration.ts` exige exactement `0001`–`0006` puis throw | découvrir et appliquer `0001`…`0008` ; échouer sur erreur SQL, pas sur le nombre | n/a | 0 checks exécutés | CI job `database` | P0 | runner + checks RPC |
| Rivals Supabase | `select("*")` puis `row.challenge_attempts` non chargé ; `score > challenger_score` ; `lastMatch: Date.now()` ; `void inbox` | requêtes explicites, `challengeOutcome`, `created_at`, streak reconstruit | `touchRival` incrémental, outcome correct, date = maintenant à l’écriture | faux pour lower-is-better | memory seulement | P1 | `deriveRivalRows` des deux côtés |
| Unicité SQL | `unique(challenge_id, player_id)` ignore les guests `NULL` ; pas d’unicité globale de `run_id` | `challenger_run_id` unique ; `run_id` de tentative unique ; `unique(challenge_id, player_actor)` ; `party_round_attempts.run_id` global | `usedRuns` | partiel | absent | P1 | index dans `0008` |
| Type de challenge | cast aveugle `type as ChallengeType` / `type ?? "beat-score"` | `getManifest` + `challengeCompatible`, sinon `defaultChallengeType` ; incompatible → `type_mismatch` | cast | cast | absent | P1 | `resolveChallengeType` |
| CI `check` | run `35590847624` sur `940bdac` : 4 failed, 1 flaky | workflow vert sur le HEAD final | n/a | n/a | Playwright | P0 | gameplay, neon shots, visuels, canonical |
| Neon `assertAlive` | exige `tick > start + 8` en 6 s | le headless fait ~1 fps (`+6/+7`) ; le tick monte aussi en pause | n/a | n/a | `e2e/gameplay.spec.ts` | P0 | signal « boucle vivante et non frozen », pas un quota de fps |
| Velocity mort | `timeMs` reste à la valeur de mort (~5149) jusqu’à `dying <= 0` ; `dying` baisse de 33 ms max par frame | le compte à rebours de 220 ms doit suivre l’horloge murale ; le test doit voir une nouvelle tentative, timer reset, `sessionDeaths++`, `runState=playing` | n/a | n/a | flaky `gameplay.spec.ts:148` | P0 | `dying -= delta` + `attemptEpoch` |
| Neon screenshots | 3 pistes × 4 moments × (page + canvas) + planche contact ; timeout 180 s sur `page.screenshot` | opening, mid, distinctive ; canvas pour l’unlabeled ; une page par piste | n/a | n/a | `e2e/neon-tracks.spec.ts` | P0 | moins de captures |
| Snapshots home | `home-swarm-1440` (heading puis pixels) et `home-neon-activities-1440` (pixels, les deux essais) | diffs réels, pas du « bruit » | n/a | n/a | `e2e/visual.spec.ts` | P0 | attendre le H1 et les images ; caler « Today » en haut du viewport ; mettre à jour le snapshot seulement si le rendu stable diffère |
| Canonical QA | `e2e/rendered-seo.spec.ts` accepte `/^https?:\/\//` ; CI build avec `NEXT_PUBLIC_APP_URL=http://127.0.0.1:3010` | canonical exact `https://gamesweb.example` + pathname ; sitemap même origine ; 65 indexables | n/a | n/a | rendered SEO | P1 | env de build + assertions |

CI observé pendant l’audit :

- Run `35651648410` (HEAD `9002c94`) : job `database` en échec (`unexpected migrations: …0007`, 0 checks).
- Run `35590847624` (HEAD `940bdac`) : job `check` avec Neon tick, timeout screenshots Neon, snapshots Swarm et activities, Velocity `timeMs < 50` flaky (reçu ~5149).

`SupabaseBackend` parle au client HTTP Supabase (`createSupabaseAdmin`). Un Postgres nu n’héberge pas PostgREST. Le chemin DB prouvé sera la RPC SQL et les contraintes, pas un faux « SupabaseBackend testé ».
