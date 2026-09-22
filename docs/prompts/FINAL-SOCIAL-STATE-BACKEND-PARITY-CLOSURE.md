# Gamesweb — Final Social State Machine & Backend Parity Closure

Tu travailles dans :

`kazkazmdk/gamesweb`

Branche de départ obligatoire :

`cursor/production-social-closure-032a`

HEAD actuellement audité :

`bd61306d54aa3d9adc80e4810483bd260d06eabe`

Le CI de ce HEAD est déjà vert :

- workflow `35659929173`
- `check = success`
- `database = success`
- Playwright : `91 passed / 9 skipped / 0 failed`
- DB : `43 integration checks passed`

IMPORTANT :

Ne casse pas cet état.

Cette passe est volontairement PETITE.

NE PAS :
- redesign Gamesweb ;
- ajouter de jeu ;
- ajouter de surface SEO ;
- modifier les 65 URLs indexables ;
- retravailler Neon visuellement ;
- refaire les systèmes Party/Challenge depuis zéro ;
- ajouter Crew/Daily/Grand Prix server-side ;
- merger dans main ;
- déployer.

OBJECTIF :

FERMER LES DERNIERS DÉFAUTS DE STATE MACHINE ET DE PARITÉ BACKEND DÉCOUVERTS APRÈS LA PASSE PRÉCÉDENTE.

Les quatre zones sont :

1. transition Party `results -> start` invalide ;
2. lifecycle Challenge encore ambigu/non atomique ;
3. `PartyMember.score` incohérent Memory/Supabase ;
4. Party join/capacity non atomique.

Maintiens le full CI vert.

---

## 1. COMMENCE PAR UN QA DU HEAD

Avant toute modification, inspecte réellement :

`apps/web/lib/backend/memory.ts`
`apps/web/lib/backend/supabase.ts`
`apps/web/lib/backend/types.ts`
`apps/web/lib/backend/competitive-contract.ts`
`apps/web/app/api/parties/route.ts`
`apps/web/app/api/challenges/route.ts`
`packages/game-sdk/src/arcade.ts`
`supabase/migrations/0006_social_arcade.sql`
`supabase/migrations/0007_social_arcade_rounds.sql`
`supabase/migrations/0008_party_round_atomicity.sql`
`tests/backend-social-contract.test.ts`
`e2e/social.spec.ts`
`scripts/db/run-integration.ts`

Crée :

`docs/FINAL-SOCIAL-STATE-AUDIT.md`

avec :

ISSUE
CURRENT CODE
FAILURE MODE
EXPECTED STATE MACHINE
MEMORY
SUPABASE
DB GUARANTEE
TEST GAP
FIX

Ne code pas avant d’avoir confirmé les quatre problèmes.

---

## 2. P0 — PARTY `results -> start` EST INTERDIT

Actuellement Memory et Supabase autorisent :

`startParty()`

si :

`state === "lobby" || state === "results"`

C’est faux.

State machine correcte :

`lobby`
→ `start`
→ `playing`
→ roster complete
→ `results`
→ `advance`
→ `playing`
→ ...
→ `done`

`startParty()` ne doit fonctionner que depuis :

`lobby`

Donc :

`results -> start`

doit retourner :

`bad_state`

Pourquoi c’est important :

les attempts du round précédent persistent maintenant.

Si on remet le même round en `playing` via `startParty()` :

- `current_round` ne bouge pas ;
- les attempts existent déjà ;
- les joueurs sont ensuite `duplicate` ;
- Party peut rester bloquée.

Fix Memory ET Supabase.

---

## 3. TESTER EXPLICITEMENT LA STATE MACHINE PARTY

Ajoute un test contractuel :

create
→ lobby

start
→ playing

submit A
→ playing

submit B
→ results

call start again
→ `bad_state`

call advance
→ next round / playing

call start during playing
→ `bad_state`

call advance during playing
→ `bad_state`

À la fin :

dernier round
→ results
→ advance
→ done

Puis :

start from done
→ bad_state

advance from done
→ bad_state.

Même comportement Memory et DB path.

---

## 4. CHALLENGE — DÉFINIR UNE SÉMANTIQUE CLAIRE

Le modèle actuel semble être un duel 1v1 :

challenger
vs
one opponent.

Les champs le montrent :

`targetId`
`targetScore`
`winnerId`
`status`

Ils sont singuliers.

Donc adopte explicitement le modèle :

ONE CHALLENGER
ONE VALID OPPONENT ATTEMPT

State machine :

`open`
→ first valid opponent attempt
→ `completed`

Après `completed` :

toute nouvelle tentative doit retourner :

`challenge_closed`

Ne laisse pas B terminer le challenge puis C écraser :

`targetId`
`targetScore`
`winnerId`.

---

## 5. MEMORY CHALLENGE STATE GUARD

Dans :

`MemoryBackend.attemptChallengeFromRun`

avant d’accepter une tentative :

si :

`current.status !== "open"`

alors :

si expired :
`expired`

sinon :
`challenge_closed`

Ne passe même pas par :

`applyChallengeAttempt`

si le challenge est déjà clôturé.

Ajoute test :

A crée challenge.

B submit valid run.

Challenge = completed.

C submit valid run.

→ challenge_closed.

Vérifie :

winnerId inchangé
targetId inchangé
targetScore inchangé
attempts.length inchangé.

---

## 6. SUPABASE CHALLENGE DOIT ÊTRE ATOMIQUE

Aujourd’hui Supabase fait en substance :

loadChallenge
validate in JS
insert attempt
update challenge

Deux adversaires peuvent potentiellement soumettre en concurrence.

Les deux peuvent charger :

status = open

avant qu’un des deux ait fait l’update.

Résultat possible :

- deux challenge_attempts insérés ;
- last write wins sur winner/target ;
- lifecycle incohérent.

Corrige ça côté DB.

Créer une migration :

`0009_social_state_machine.sql`

ou prochain numéro correct.

Ajouter une RPC transactionnelle du style :

`submit_challenge_attempt(...)`

Elle doit :

1. sélectionner challenge `FOR UPDATE` ;
2. vérifier existence ;
3. vérifier expiration ;
4. vérifier `status = open` ;
5. vérifier actor != challenger ;
6. vérifier game ;
7. vérifier mode ;
8. vérifier trust acceptable ;
9. vérifier run reuse ;
10. vérifier aucune tentative valide existante ;
11. insérer challenge_attempt ;
12. calculer outcome ;
13. écrire target/winner/status ;
14. commit.

Attention :

le score, game, mode, trust restent dérivés côté serveur depuis `runId`.

Ne rends pas l’RPC publique au client.

Service role seulement.

---

## 7. NE DUPLIQUE PAS LA LOGIQUE D’OUTCOME

La RPC doit respecter la même logique que :

`challengeOutcome()`

Pour éviter divergence TS/SQL :

documente une table claire des types supportés.

Au minimum :

higher-is-better :
plus grand gagne

lower-is-better :
plus petit gagne

draw :
égal

Pour les challenge types spéciaux :

inspecte le comportement existant de `challengeOutcome`.

Ne crée pas une nouvelle interprétation.

Si certains types ne sont pas correctement représentables SQL-side, fais un design sûr :

- calcul outcome dans une fonction SQL cohérente ;
- ou stocker un paramètre `p_lower_is_better` dérivé serveur-side si nécessaire.

Mais ne fais pas un check `score > challenger_score` universel.

---

## 8. CHALLENGE CONCURRENCY TEST

Test DB obligatoire.

Challenge open.

Deux adversaires B et C soumettent en concurrence :

`Promise.all([...])`

Résultat :

EXACTEMENT 1 attempt accepted.

L’autre :

`challenge_closed`
ou erreur déterministe équivalente.

DB final :

`status = completed`

`count(challenge_attempts) = 1`

winner cohérent.

Pas de second write.

Pas de last-write-wins.

---

## 9. CHALLENGER NE PEUT PAS JOUER SON PROPRE CHALLENGE

Vérifie explicitement la règle.

Le challenger ne doit pas pouvoir prendre son propre challenge avec un autre run.

Retour :

`self_challenge`

ou erreur déterministe existante.

Ajoute Memory + DB test.

---

## 10. PARTY MEMBER CONTRACT EST INCOHÉRENT

Actuellement :

Memory après round :

`member.score = raw game score`

Supabase assemble :

`score: party_members.points`

Donc :

Memory :
`score = score brut du dernier round`

Supabase :
`score = points Party cumulés`

Ce n’est pas acceptable.

Un même type doit avoir la même signification.

---

## 11. CLARIFIER LE TYPE PARTY MEMBER

Refactor :

au lieu de :

`StoredPartyMember.score`

utilise idéalement :

`points: number`
`lastRoundScore?: number | null`

Exemple :

```ts
type StoredPartyMember = {
  id: string;
  name: string;
  ready: boolean;
  points: number;
  lastRoundScore: number | null;
  joinedAt: number;
}
```

Puis :

Memory :
- `points` = points cumulés ;
- `lastRoundScore` = dernier raw score.

Supabase :
- `points` = `party_members.points` ;
- `lastRoundScore` soit dérivé du latest party_round_attempt,
- soit null si inutile.

Si `lastRoundScore` n’est jamais consommé dans l’UI :

tu peux simplement supprimer le concept et garder :

`points`.

Mais ne garde pas un champ `score` ambigu.

---

## 12. PROPAGER LE TYPE SANS CASSER L’UI

Inspecte toutes les utilisations de :

`.members[].score`

Ne fais pas un search/replace aveugle.

Met à jour :

backend types
Memory
Supabase
arcade-store
Party UI
tests
fixtures

Si UI n’affiche pas le score membre :

ne rajoute pas d’UI inutile.

La leaderboard Party reste :

`standings[].points`

source d’affichage principale.

---

## 13. P1 — PARTY JOIN CAPACITY EST RACE-PRONE

Supabase fait actuellement :

load party
count members
if >= 6 full
insert member

Deux joueurs peuvent voir 5 membres et s’insérer simultanément.

Résultat potentiel :

7 membres.

La limite doit être garantie côté DB.

---

## 14. ATOMIC PARTY JOIN RPC

Dans la même migration `0009` si cohérent :

crée :

`join_party(...)`

ou nom équivalent.

Transaction :

1. lock party `FOR UPDATE` ;
2. vérifier state = lobby ;
3. vérifier actor déjà présent ;
4. count members ;
5. si >= 6 :
   full ;
6. insert member ;
7. return success.

Idempotence :

si actor déjà membre :

retourne :

duplicate = true

et ne crée aucune deuxième ligne.

---

## 15. TEST CONCURRENT PARTY JOIN

Crée Party avec :

host + 4 membres = 5.

Deux nouveaux actors tentent de join simultanément.

Résultat :

un seul doit passer.

Final :

member_count = 6.

L’autre reçoit :

`full`.

Jamais 7.

Teste avec deux connexions Postgres.

---

## 16. JOIN CLOSED STATE

RPC join doit aussi garantir :

si Party != lobby :

`closed`

Même sous concurrence avec un `startParty()`.

Idéalement le lock Party permet que :

join et start simultanés

produisent un état cohérent.

Soit join gagne avant start.
Soit start gagne et join reçoit closed.

Jamais membre ajouté après passage playing.

---

## 17. START PARTY ET JOIN DOIVENT ÊTRE COMPATIBLES

Supabase `startParty()` reste actuellement une update JS après plusieurs reads.

Inspecte la race :

join
vs
start.

Si nécessaire, déplace aussi `startParty` en RPC transactionnelle.

Objectif :

une fois le roster du round gelé :

aucun join ne doit entrer dans ce round.

Si tu peux garantir ça par `join_party()` lock + `start_party()` lock, fais-le.

Ne surengineer pas si une solution propre simple suffit.

---

## 18. PARTY READY / ROSTER

Vérifie aussi que :

`roundRoster`

est un snapshot du roster autorisé au début du round.

Après `start` :

modifier ready ne doit pas modifier rétroactivement le roster en cours.

Le prochain round peut recalculer le roster.

Ajoute test si absent.

---

## 19. CHALLENGE API ERROR MAPPING

Ajoute proprement :

`challenge_closed`
`self_challenge`

dans :

`challengeFailure()`

Probablement :

409 pour challenge_closed
403 ou 409 pour self_challenge

Choisis une convention cohérente.

Ne renvoie pas génériquement :

`attempt_failed`

pour des cas métier connus.

---

## 20. SUPABASE RPC ERROR MAPPING

Aujourd’hui certains errors DB sont collapsés en :

`invalid_score`
ou
`attempt_failed`.

Pour les nouvelles RPCs retourne des payloads structurés :

```json
{"error":"challenge_closed"}
```

ou :

```json
{"ok":true}
```

Évite d’utiliser le texte brut des exceptions Postgres comme contrat métier.

---

## 21. RUN REUSE CROSS-SYSTEM

Vérifie les contraintes actuelles :

Party attempts run_id global unique.

Challenge create challenger_run_id unique.

Challenge attempts run_id unique.

Mais un même run pourrait éventuellement être :

Party
ET
Challenge

si les tables sont séparées.

Décide la politique.

Si le produit veut :

ONE COMPETITIVE RUN = ONE COMPETITIVE ACTION GLOBAL

alors il faut une table globale type :

`competitive_run_claims`

avec :

run_id
kind
owner_actor
created_at

unique(run_id).

Sinon documente explicitement :

un run peut être utilisé une fois dans Party ET une fois dans Challenge.

Ne modifie pas cette politique sans l’examiner.

Important :

ne crée pas une nouvelle architecture juste pour ça si aucune règle produit ne demande une exclusivité globale.

---

## 22. MEMORY / SUPABASE CONTRACT TEST

Étends :

`tests/backend-social-contract.test.ts`

Pour couvrir :

Party:
- start only from lobby ;
- no results->start ;
- correct advance ;
- member points semantics.

Challenge:
- open -> completed ;
- second opponent rejected ;
- self challenge rejected ;
- winner preserved.

Ce test doit refléter le comportement attendu commun.

---

## 23. DB INTEGRATION TESTS

Étends :

`scripts/db/run-integration.ts`

Tests minimum nouveaux :

1. results -> start rejected
2. concurrent Party join cap stays 6
3. duplicate Party join idempotent
4. Party closed refuses join
5. challenge first attempt completes
6. second attempt rejected
7. concurrent challenge attempts => exactly one winner
8. self challenge rejected
9. challenge lower-is-better outcome correct
10. challenge higher-is-better outcome correct
11. draw correct
12. status/winner/target remain immutable after completion.

Le job DB doit toujours appliquer toutes migrations dans l’ordre.

---

## 24. E2E PARTY

Complète le test browser Party si pertinent :

après results :

UI n’affiche pas Start.

Host avance.

Next round devient playing.

Ne fais pas dépendre tout le correctness des E2E browser :

les invariants concurrency doivent rester DB tests.

---

## 25. E2E CHALLENGE

Ajoute un scénario léger :

A challenge B.

B termine.

C ouvre le même challenge.

C voit qu’il est completed/closed et ne peut pas remplacer B.

Si l’UI challenge n’a pas encore une vue “closed” claire :

améliore uniquement l’état fonctionnel minimal.

Pas de redesign.

---

## 26. NE TOUCHE PAS AUX ZONES DÉJÀ VALIDÉES

Ne modifie pas sans nécessité :

- Neon Drift visual QA ;
- Velocity reset ;
- SEO rendered QA ;
- canonical ;
- sitemap ;
- home snapshots ;
- gameplay tests ;
- 65 URL registry ;
- broader IA.

Le CI est actuellement vert.

Ne crée pas de régression.

---

## 27. FULL REGRESSION

À la fin exécute sur le HEAD final :

`pnpm typecheck`
PASS

`pnpm lint`
PASS

`pnpm test`
PASS

`pnpm build`
PASS

`pnpm test:db`
PASS

`pnpm test:e2e`
PASS

Je veux un run GitHub Actions complet sur le HEAD final :

check = success
database = success

Pas de résultats assemblés.

Pas de “local only”.

---

## 28. METS À JOUR LA DOC AVEC LE NOUVEAU HEAD

Crée :

`docs/FINAL-SOCIAL-STATE-CLOSURE.md`

avec :

Base SHA
Final SHA
Workflow run ID

Puis :

| issue | before | fix | proof | status |

Inclure :

- Party results->start
- Challenge lifecycle
- Challenge concurrent submit
- Party member field parity
- Party capacity
- concurrent joins
- Memory contract
- DB checks
- full CI.

Ne réutilise pas les anciens workflow IDs comme preuve du nouveau HEAD.

---

## 29. SOIS TRANSPARENT SUR SUPABASE

Même après cette passe :

si aucun vrai projet Supabase Gamesweb n’a été provisionné,

écris explicitement :

`PostgreSQL schema/RPC path tested`
`Supabase PostgREST client integration not yet exercised against a provisioned Gamesweb Supabase project`

Ne transforme pas ça en CLOSED fictif.

Ce sera une étape de release/provisioning, pas un bug backend si SQL/RPC est correctement validé.

---

## 30. DEFINITION OF DONE

DONE seulement si :

PARTY

- start allowed only from lobby ;
- results requires advance ;
- no results->start loop ;
- join max = 6 atomically ;
- concurrent join safe ;
- closed Party rejects joins ;
- roster remains stable during active round ;
- Memory and DB behavior match ;
- member points have one semantic.

CHALLENGE

- one opponent per duel ;
- open -> completed atomically ;
- completed challenge cannot be overwritten ;
- two concurrent challengers produce exactly one accepted attempt ;
- challenger cannot challenge themselves ;
- winner/target preserved ;
- game/mode/trust/run constraints preserved ;
- lower/higher/draw outcomes correct.

DB

- new migration applies ;
- security preserved ;
- service-role-only mutation RPCs ;
- integration checks all green.

CI

- typecheck green ;
- lint green ;
- unit green ;
- build green ;
- DB green ;
- Playwright green ;
- GitHub HEAD green.

NO MERGE.
NO DEPLOY.
NO FEATURE CREEP.

Cette passe doit terminer la logique sociale existante, pas étendre Gamesweb.
