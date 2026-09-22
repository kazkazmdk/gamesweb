# Clôture state machine sociale et intégrité des shares

Branche : `cursor/production-social-closure-032a`  
Base de la PR : `cursor/final-product-seo-qa-032a`  
Document manquant de la passe state-machine, complété par la micro-passe share/fallback.

| SHA | Run | Rôle | `check` | `database` |
| --- | --- | --- | --- | --- |
| `b1f7bb7846bd3940fa2399c07d9958b37def1428` | [35707950756](https://github.com/kazkazmdk/gamesweb/actions/runs/35707950756) | Party / Challenge SM (base de cette passe) | success | success |
| `088bc85fe5776f747772714b9f66f678fe910807` | [35720385024](https://github.com/kazkazmdk/gamesweb/actions/runs/35720385024) | isolation share + fallback métier | [106721649356](https://github.com/kazkazmdk/gamesweb/actions/runs/35720385024/job/106721649356) success | [106721648938](https://github.com/kazkazmdk/gamesweb/actions/runs/35720385024/job/106721648938) success |

Base SHA : `b1f7bb7846bd3940fa2399c07d9958b37def1428`  
Final SHA (code) : `088bc85fe5776f747772714b9f66f678fe910807`  
Workflow run ID (code) : `35720385024`

Sur `088bc85` : typecheck, lint, `pnpm test` (147 passed), build, Playwright (94 passed, 9 skipped, 0 failed), `pnpm test:db` (61 checks passed). Ce document est un commit docs-only au-dessus de ce HEAD. Pas de merge `main`. Pas de deploy.

## Périmètre

Cette passe n’a pas touché Party, le ranking, le SEO, les 65 URLs, les jeux, ni le design. `0009_social_state_machine.sql` n’a pas été modifié.

## Caveat Supabase

PostgreSQL schema/RPC path tested.

Supabase PostgREST client integration has not yet been exercised against a provisioned Gamesweb Supabase project.

L’index unique « une tentative par challenge » de `0009` suppose que la migration est appliquée avant des données multi-attempt historiques. Aucun projet Supabase Gamesweb n’est provisionné : pas de data migration.

## Isolation local / serveur

`encodeChallengePayload()` reste JSON → base64url. Ce n’est pas une signature. Le client le nomme `untrusted share` / `local-share`. `trust` hydraté depuis `?p=` est toujours `unverified`.

- Challenge serveur = ligne backend. Créé uniquement depuis `runId` via POST.
- Share local = payload portable. GET `/api/challenges` est lookup-only : 404 même si `?p=` est fourni. Aucun `putChallenge` depuis le payload.
- `completeChallenge` / `createChallenge` classent les échecs via `planChallengeAttempt` / `planChallengeCreate` : erreur métier → reject ; 404 + share local + pas server-backed → local ; réseau + server-backed → `server_unavailable` ; create offline reste local.

## Tableau

| ISSUE | FIX | TEST | RESULT |
| --- | --- | --- | --- |
| Party `results → start` relançait le même round | `startParty` lobby-only ; RPC `start_party` / `advance_party` sous `FOR UPDATE` | Memory contract + SQL `0009` | CLOSED |
| Join capacité non atomique (course à 6) | RPC `join_party` + verrou partagé avec `start_party` | Memory + concurrence SQL | CLOSED |
| Challenge 1v1 : second adversaire / course réécrivait le vainqueur | RPC `submit_challenge_attempt`, une tentative valide, puis `challenge_closed` | Memory + SQL concurrent | CLOSED |
| `PartyMember.score` Memory ≠ Supabase | contrat `points` + `lastRoundScore` | contract Memory | CLOSED |
| GET `?p=` non signé créait un challenge serveur (`putChallenge`) | GET lookup-only, 404 si absent, `?p=` ignoré côté API | `e2e/security-social.spec.ts` `FAKE1` : GET+`p` = 404, GET seul = 404 après visite `/c/FAKE1?p=` | CLOSED |
| `!remote.ok` tombait en fallback local (`challenge_closed`, `self_challenge`, `run_reuse`, …) | `challengeBusinessError` + `planChallengeAttempt` ; refresh serveur puis `{ok:false}` | `tests/challenge-share-integrity.test.ts` (closed / self / reuse / mismatch) ; e2e host `self_challenge` 403, challenge reste `open` | CLOSED |
| Share offline légitime cassé si on retire tout fallback | create/attempt local si 404 + payload local + pas server-backed ; metadata `source: local-share` | planner + ArcadeStore : local attempt autorisé ; smoke `/c/7FQ2K?p=e30` affiche un h1 sans crash | CLOSED |
| Payload `trust: verified` ou expiré rejouable | hydrate force `unverified` ; `expiresAt` passé → `expired` | unit share integrity | CLOSED |
| Payload `{}` (`p=e30`) faisait crasher la page | garde de champs + try/catch hydrate | `e2e/smoke.spec.ts` heading `challenge not found\|challenged you` | CLOSED |
| CI final du HEAD code | run `35720385024` uniquement, pas `35707950756` | `check` + `database` | CLOSED |

Le système social est code-closed jusqu’au provisioning du vrai projet Supabase.
