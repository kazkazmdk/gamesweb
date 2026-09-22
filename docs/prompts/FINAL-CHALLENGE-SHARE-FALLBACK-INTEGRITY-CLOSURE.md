# Gamesweb — Final Challenge Share & Fallback Integrity Closure

Tu travailles dans :

`kazkazmdk/gamesweb`

Branche de départ :

`cursor/production-social-closure-032a`

HEAD actuellement audité :

`b1f7bb7846bd3940fa2399c07d9958b37def1428`

Le HEAD est déjà vert :

- GitHub Actions run `35707950756`
- `check = success`
- `database = success`
- unit tests : `138 passed`
- DB integration : `61 passed`
- Playwright : `92 passed / 9 skipped / 0 failed`

Cette passe est une MICRO-PASSE.

NE PAS :

- redesign ;
- modifier Party ;
- modifier le ranking ;
- ajouter des features sociales ;
- toucher au SEO ;
- toucher aux 65 URLs ;
- toucher aux jeux ;
- refaire le backend ;
- modifier les systèmes déjà verts sans nécessité ;
- merge main ;
- deploy.

OBJECTIF :

FERMER LES DEUX DERNIERS TROUS DE SÉMANTIQUE/INTÉGRITÉ DU SYSTÈME CHALLENGE :

1. un payload `?p=` non signé ne doit jamais créer silencieusement un challenge serveur ;
2. une erreur métier serveur ne doit jamais provoquer un fallback local qui simule un autre résultat.

Puis produire le document final de clôture manquant.

---

## 1. AUDIT AVANT MODIFICATION

Inspecte :

`apps/web/app/api/challenges/route.ts`
`apps/web/app/c/[code]/page.tsx`
`apps/web/lib/social/arcade-store.ts`
`apps/web/lib/player-api.ts`
`apps/web/lib/backend/memory.ts`
`apps/web/lib/backend/supabase.ts`
`packages/game-sdk/src/arcade.ts`
`e2e/social.spec.ts`
`e2e/security-social.spec.ts`
`tests/backend-social-contract.test.ts`

Confirme d’abord les deux problèmes suivants.

---

## 2. P1 — `?p=` EST UN PAYLOAD NON SIGNÉ

Actuellement :

`encodeChallengePayload()`

fait seulement :

JSON
→ base64url.

Ce payload contient notamment :

- publicCode
- gameId
- mode
- seed
- type
- challengerName
- challengerScore
- gameVersion
- trust
- expiresAt
- challengerId

Mais il n’est pas authentifié cryptographiquement.

N’importe quel client peut donc construire un payload lui-même.

---

## 3. LE GET CHALLENGE NE DOIT PAS ÉCRIRE EN DB DEPUIS `?p=`

Aujourd’hui :

`GET /api/challenges?code=...&p=...`

peut faire :

decode payload
→ `putChallenge(...)`
→ créer un challenge serveur

si aucun challenge DB n’existe.

À supprimer.

Un GET ne doit pas convertir un payload non signé en vérité serveur.

Nouvelle règle :

SERVER CHALLENGE
= challenge présent dans le backend serveur.

OFFLINE / LEGACY SHARE
= payload local transportable.

Les deux sont distincts.

---

## 4. COMPORTEMENT ATTENDU DU GET

`GET /api/challenges?code=ABC123`

si challenge DB existe :

200
server challenge.

Si challenge DB n’existe pas :

404.

Même si `?p=` est fourni.

Le payload ne doit jamais déclencher :

insert
upsert
putChallenge
migration vers backend
création implicite.

---

## 5. LE PAYLOAD RESTE UTILISABLE LOCAL-FIRST

On ne veut pas nécessairement supprimer `?p=`.

Il peut rester utile pour :

- partage offline ;
- challenge local ;
- fallback non-server ;
- lien portable.

Mais sa sémantique devient explicitement :

UNTRUSTED LOCAL SHARE.

Donc :

`decodeChallengePayload()`

peut continuer à hydrater un Challenge local.

Mais :

`trust = unverified`

toujours.

Et :

aucun effet serveur.

---

## 6. NE FAIS PAS SEMBLANT DE SÉCURISER AVEC BASE64

N’appelle jamais ce payload :

signed
secure
verified
trusted.

Base64url ≠ signature.

Si tu décides de conserver le format actuel :

nomme-le clairement :

`legacy/local share payload`
ou
`untrusted share`.

---

## 7. OPTION SIGNATURE — NE L’IMPLÉMENTE PAS SAUF SI NÉCESSAIRE

On pourrait techniquement faire :

HMAC(payload, secret)

mais ce n’est PAS nécessaire pour cette passe si on sépare correctement local/server.

Préférence :

simple :

server challenge = DB only
local share = local only.

Pas besoin d’ajouter une infra de signature si aucune fonctionnalité n’en dépend.

---

## 8. P1 — FALLBACK LOCAL APRÈS ERREUR SERVEUR

Inspecte :

`arcadeStore.completeChallenge()`.

Aujourd’hui logique approximative :

remote attempt
↓
if remote.ok
  use server result
else
  fallback local
  applyChallengeAttempt(...)

C’est trop large.

Une vraie réponse serveur :

409 challenge_closed

n’est PAS une panne réseau.

Elle ne doit jamais déclencher :

`applyChallengeAttempt()` local.

---

## 9. CLASSIFIER LES ÉCHECS

Il faut différencier :

A. SERVER BUSINESS ERROR

Exemples :

challenge_closed
self_challenge
run_reuse
mode_mismatch
game_mismatch
invalid_score
expired
run_forbidden
not_found

→ NE PAS fallback local.

B. SERVER UNAVAILABLE / NETWORK FAILURE

Exemples :

fetch failed
timeout
backend 503 NOT_CONFIGURED
offline browser

→ fallback local autorisé uniquement SI le challenge est explicitement local/offline.

Pas si on sait qu’il s’agit d’un challenge serveur.

---

## 10. INTRODUIRE UNE NOTION DE SOURCE

Le client doit savoir si le challenge est :

`server`
ou
`local`.

Tu peux :

- stocker une metadata locale ;
- retourner `{ source: "server" | "local" }` ;
- ou utiliser `persistence`.

Évite une refonte lourde.

Objectif :

un challenge serveur ne doit jamais silencieusement basculer en local à cause d’une erreur métier.

---

## 11. `completeChallenge()` DOIT PROPAGER L’ERREUR

Exemple attendu :

```ts
const remote = await playerApi.attemptChallenge(...)

if (remote.ok) {
  return serverResult
}

if (remote.businessError) {
  return {
    ok: false,
    error: remote.error
  }
}

if (challengeIsServerBacked) {
  return {
    ok: false,
    error: "server_unavailable"
  }
}

return completeLocalChallenge(...)
```

Adapte aux types existants.

Ne copie pas cet exemple aveuglément.

---

## 12. UI CHALLENGE CLOSED

Si attempt retourne :

`challenge_closed`

l’UI doit :

1. refresh challenge serveur ;
2. afficher l’état closed ;
3. ne jamais afficher une victoire locale.

Même chose pour :

expired.

---

## 13. SELF CHALLENGE

Si serveur retourne :

`self_challenge`

pas de fallback.

Affiche état/message approprié.

Pas besoin de redesign.

---

## 14. MODE / RUN / TRUST ERRORS

Même règle :

`mode_mismatch`
`game_mismatch`
`run_reuse`
`invalid_score`
`run_forbidden`

sont des erreurs métier.

Jamais fallback local.

---

## 15. NOT_FOUND EST SPÉCIAL

Si le lien a :

`?p=`

et le serveur retourne 404 :

tu peux utiliser le payload comme challenge local.

C’est le cas explicitement supporté.

Mais :

il reste local.

Ne réessaie pas de le convertir en serveur.

---

## 16. SHARE FLOW ATTENDU

SERVER FLOW :

create from runId
→ stored backend
→ URL `/c/CODE`
→ remote GET succeeds
→ remote attempt
→ DB authoritative.

LOCAL SHARE FLOW :

create local
→ URL `/c/CODE?p=PAYLOAD`
→ remote GET = 404
→ decode payload
→ local challenge only
→ local attempt only.

Ne mélange pas les deux.

---

## 17. RETIRE `putChallenge()` DU FALLBACK GET

Si `putChallenge()` n’est plus utile ailleurs :

ne le supprime pas automatiquement du BackendStore si d’autres usages existent.

Mais retire son utilisation dans la route GET basée sur payload.

Si la méthode devient morte :

alors seulement nettoyer proprement types/implementations/tests.

---

## 18. TEST API : PAYLOAD NE PERSISTE PLUS

Ajoute test :

Construire un payload valide arbitraire :

code = `FAKE1`
challengerScore = 999999
challengerId = attacker

GET :

`/api/challenges?code=FAKE1&p=...`

Résultat attendu :

404 côté API serveur.

Puis :

GET `/api/challenges?code=FAKE1`

toujours :

404.

Prouve :

aucun challenge serveur n’a été créé.

---

## 19. TEST LOCAL SHARE

Côté client :

payload valide.

Backend 404.

Challenge doit quand même être affichable localement via :

`decodeChallengePayload`.

Mais :

source/local/persistence = local.

Et :

aucun server record.

---

## 20. TEST BUSINESS ERROR SANS FALLBACK

Créer vrai server challenge.

B termine.

C essaie.

Serveur :

409 challenge_closed.

Client :

doit retourner failure/closed.

Puis vérifier :

- aucun `applyChallengeAttempt` local ;
- winnerId inchangé ;
- targetId inchangé ;
- targetScore inchangé ;
- no fake local victory.

---

## 21. TEST SELF_CHALLENGE SANS FALLBACK

Host crée challenge.

Host essaie autre run.

Serveur :

403 self_challenge.

Client :

aucun fallback.

Challenge reste :

open.

---

## 22. TEST RUN_REUSE SANS FALLBACK

Même principe.

Une erreur :

run_reuse

ne doit jamais transformer l’action en challenge local.

---

## 23. TEST OFFLINE LOCAL FALLBACK

Conserve un vrai scénario où le fallback EST attendu.

Exemple :

challenge créé localement avec payload
et pas de backend server record.

Le joueur peut effectuer :

local attempt.

Cela prouve que tu n’as pas supprimé la fonctionnalité offline.

---

## 24. PAS DE FALLBACK SILENCIEUX SUR `remote.ok === false`

Cherche toutes les constructions du style :

```ts
if (!remote.ok) {
  useLocal()
}
```

dans le système Challenge.

Pour chaque cas :

distingue :

server rejection

vs

server unavailable/local mode.

---

## 25. PLAYER API RESULT TYPES

Si nécessaire, améliore les types de `playerApi` pour exposer :

status
error code
availability/network condition

Exemple conceptuel :

```ts
{
  ok: false,
  status: 409,
  error: "challenge_closed"
}
```

au lieu d’un simple :

`{ ok: false }`

Ne perds pas les codes métier de l’API.

---

## 26. PAS D’EXCEPTION POUR LE CONTROL FLOW NORMAL

`challenge_closed`
`self_challenge`
etc.

doivent rester des résultats métier typés.

Pas des exceptions JS génériques.

---

## 27. SHARE TRUST

Pour challenge local hydraté depuis payload :

force :

`trust = "unverified"`

même si payload contient autre chose.

Ne fais jamais confiance à :

`share.trust`

pour la sécurité.

Le payload peut afficher éventuellement la valeur originale comme metadata non authoritative si nécessaire, mais pas l’utiliser comme trust serveur.

---

## 28. EXPIRATION PAYLOAD

`decodeChallengePayload()` peut décoder un payload expiré.

La couche qui hydrate doit vérifier :

`expiresAt > Date.now()`

Sinon :

local challenge expired.

Ne permet pas un vieux share arbitraire de redevenir jouable.

---

## 29. GAME / TYPE VALIDATION DU PAYLOAD

Pour local share :

valide quand même :

known game
challenge type compatible
mode plausible si manifest permet validation
expiresAt valide
publicCode cohérent

Un payload arbitraire ne doit pas provoquer crash ou état incohérent.

Mais garde ça côté local.

---

## 30. DOCUMENT FINAL MANQUANT

Cursor devait créer :

`docs/FINAL-SOCIAL-STATE-CLOSURE.md`

et ne l’a pas fait.

Crée-le cette fois.

Inclure :

Base SHA :
`b1f7bb7846bd3940fa2399c07d9958b37def1428`

Final SHA :
nouveau HEAD.

Workflow run ID :
nouveau run final.

Tableau :

ISSUE
FIX
TEST
RESULT

Inclure :

- Party state machine closed
- Party join atomic
- Challenge DB atomic
- Challenge 1v1
- local share isolation
- unsigned payload no server persistence
- business errors no local fallback
- offline local share still works
- CI final.

---

## 31. SUPABASE CAVEAT

Garde explicitement dans la doc :

PostgreSQL migrations/RPC tested.

Supabase PostgREST integration has not yet been exercised against a provisioned Gamesweb Supabase project.

Ne transforme pas ça en faux CLOSED.

---

## 32. MIGRATION `0009`

Ne touche pas à `0009` sauf bug nécessaire.

Note simplement dans la doc :

l’unique index challenge one-attempt suppose que la migration est appliquée avant données multi-attempt historiques.

Comme aucun vrai projet Supabase Gamesweb n’est encore provisionné, pas besoin de data migration complexe maintenant.

---

## 33. FULL REGRESSION

Le HEAD final doit toujours passer :

`pnpm typecheck`

`pnpm lint`

`pnpm test`

`pnpm build`

`pnpm test:db`

`pnpm test:e2e`

Puis GitHub Actions :

`check = success`
`database = success`

Je veux un nouveau workflow du HEAD final.

Pas l’ancien `35707950756`.

---

## 34. DEFINITION OF DONE

DONE uniquement si :

SERVER CHALLENGES

- créés uniquement depuis vraie logique backend ;
- jamais créés depuis un `?p=` arbitraire ;
- DB reste source de vérité ;
- business errors ne tombent pas en fallback local.

LOCAL SHARES

- payload reste utilisable offline ;
- reste explicitement local ;
- trust forcé unverified ;
- expiration validée ;
- ne crée aucun state serveur.

CLIENT

- challenge_closed reste closed ;
- self_challenge reste rejected ;
- run_reuse reste rejected ;
- mode mismatch reste rejected ;
- aucune fausse victoire locale après réponse serveur.

TESTS

- forged share cannot persist ;
- legitimate local share still works ;
- server closed challenge cannot fallback ;
- final full CI green.

DOC

- `docs/FINAL-SOCIAL-STATE-CLOSURE.md` existe ;
- contient nouveau SHA et nouveau workflow.

NO REDESIGN.
NO FEATURE CREEP.
NO SEO CHANGES.
NO PARTY REWORK.
NO MERGE.
NO DEPLOY.

Après cette passe, ne continue pas à chercher des améliorations générales.

Le système social doit être considéré comme code-closed jusqu’au provisioning du vrai projet Supabase.
