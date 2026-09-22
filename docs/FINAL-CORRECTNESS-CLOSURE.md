# Clôture correctness backend et CI

Branche : `cursor/production-social-closure-032a`  
Base de la PR : `cursor/final-product-seo-qa-032a` @ `d7a22e3`  
Début de cette passe : `9002c9485d5b2d42dd113589e8d9653a776ca14e`

| SHA | Run | Rôle | `check` | `database` |
| --- | --- | --- | --- | --- |
| `73d80e183bbc5a5cf8154db05c27a8fc6d282f02` | [35656016061](https://github.com/kazkazmdk/gamesweb/actions/runs/35656016061) | correctifs e2e | 106519776517 success | 106519776248 success |
| `66aa7fda83003c7eb23a2c0eb37e0c051338dcd5` | [35656709498](https://github.com/kazkazmdk/gamesweb/actions/runs/35656709498) | même code, docs seulement | 106522060229 success | 106522059966 success |

Les deux runs : typecheck, lint, `pnpm test` (136 passed), build, Playwright (91 passed, 9 skipped, 0 failed), `pnpm test:db` (43 checks passed). Le run `35654295700` sur `a39bedf` était vert, puis `35654976916` sur `f25eaee` a raté trois flakes e2e (canvas Neon jamais stable, grâce du recap, carousel avant hydratation). `73d80e1` corrige ces flakes. `66aa7fd` réexécute le workflow entier, vert. Pas de merge `main`. Pas de deploy.

## Politique de confiance

- Party : `flagged` → `invalid_score`, aucun point.
- Challenge create et attempt : `flagged` → `invalid_score`.
- `verified` et `unverified` sont acceptés et stockés tels quels. Rien n’est promu `verified`.
- Le seed enregistré sur un challenge (`${gameId}:${runId}`) n’est pas un seed de partie. Il n’est pas comparé. `seed_mismatch` ne part que si les deux côtés ont un seed non vide.

## Ce qui a été corrigé

- Classement Party : aucune attribution avant la fin du roster, puis `rankPartyRound` (`rankScores` + `PARTY_POINTS` + `lowerIsBetter`).
- Memory tient les tentatives et ne pose les points qu’à la clôture, sous `withLock`.
- Postgres : `0008_party_round_atomicity.sql`, fonction `submit_party_round_attempt` (`FOR UPDATE`). `SupabaseBackend.submitPartyRound` appelle cette RPC et n’écrit plus les standings en JavaScript.
- `validateCompetitiveRunTarget` pour Party et Challenge (`mode_mismatch`).
- `resolveChallengeType` : type incompatible → `type_mismatch` (409).
- Rivals : requêtes explicites, `challengeOutcome`, `created_at`, streak recalculé dans l’ordre des tentatives. Plus de `Date.now()` à la lecture.
- Index : `challenger_run_id`, `challenge_attempts.run_id`, `unique(challenge_id, player_actor)`, `party_round_attempts.run_id` global.
- `pnpm test:db` applique `0001`…`0008` et exécute les checks. `pnpm test:db-social` lance le même runner.
- Neon : la boucle vivante n’exige plus +8 ticks en 6 s. Le respawn Velocity suit l’horloge murale et publie `attemptEpoch`.
- Captures Neon : opening, mid, distinctive. Activities calées sur la région « Today ». Snapshots Swarm et activities remplacés par le rendu stable.
- Canonical QA : `NEXT_PUBLIC_APP_URL=https://gamesweb.example`.

`SupabaseBackend` n’a pas été exécuté contre PostgREST. Le chemin DB prouvé est la RPC et les contraintes, dans le job `database`.

## Tableau

| BEFORE | FIX | TEST | STATUS |
| --- | --- | --- | --- |
| `rankScores` d’un seul joueur, 10 points tout de suite | points seulement roster complet | Memory `tests/backend-social-contract.test.ts` ; SQL higher B10/A7 dans le job `database` | CLOSED |
| writes Party séparés, course sur `submitted` | RPC `FOR UPDATE` | `Promise.all` A+B : 2 tentatives, state `results`, 10 et 7 | CLOSED |
| mode non vérifié | `mode_mismatch` | Memory + SQL `MODE01` | CLOSED |
| lower-is-better ignoré dès qu’un seul score est classé | `lowerIsBetter(gameId)` | Velocity A32 bat B41 (Memory) ; SQL 30/40 → A10/B7 | CLOSED |
| cumul non testé | deux rounds | Memory et SQL : 17 et 17 | CLOSED |
| `pnpm test:db` throw sur `0007`, 0 checks | découverte ordonnée des migrations | job `database`, 43 PASS | CLOSED |
| Rivals `score >` et `Date.now()` | `rivalsFromChallenges` | Memory contract ; client Supabase non exécuté sur Postgres | CORRECTED |
| type de challenge casté | `challengeCompatible` / défaut | Memory `beat-time` sur Sky → `type_mismatch` | CLOSED |
| flagged accepté côté challenge | refus des deux côtés | Memory + RPC `invalid_score` | CLOSED |
| `assertAlive` +8 ticks | tick ou simulation, pas frozen | Playwright du job `check` | CLOSED |
| Velocity `timeMs` ~5149 | `dying` en ms murale + `attemptEpoch` | gameplay du job `check` | CLOSED |
| timeout screenshots Neon | 3 moments, canvas sauf l’opening | `neon-tracks` du job `check` | CLOSED |
| snapshots Swarm et activities appelés « noise » | rendu stable recopié | les deux `toHaveScreenshot` du job `check` | CLOSED |
| canonical `^https?:` et build `127.0.0.1` | `https://gamesweb.example` + pathname, sitemap 65 | `rendered-seo` 65/65 du job `check` | CLOSED |

## P2 encore ouverts

- Crew, Daily et Grand Prix restent locaux.
- Aucun projet Supabase Gamesweb n’est provisionné. Le client HTTP `SupabaseBackend` n’a pas de test d’intégration PostgREST.
- Le seed synthétique d’un challenge n’est pas un seed de partie.
- Annotation GitHub : les actions ciblent encore Node 20. Le run reste vert.
