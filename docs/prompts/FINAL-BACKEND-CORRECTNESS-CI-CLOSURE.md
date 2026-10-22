# Gamesweb — Final Backend Correctness & CI Closure

Tu travailles dans le repo :

`kazkazmdk/gamesweb`

Branche de départ OBLIGATOIRE :

`cursor/production-social-closure-032a`

Ne repars PAS de `main`.
Ne repars PAS des anciennes branches.

OBJECTIF :

FERMER LES DERNIERS DÉFAUTS RÉELS DÉCOUVERTS PAR LE QA.

Cette passe ne doit PAS :
- redesign la plateforme ;
- ajouter de nouvelles features ;
- ajouter de nouveaux jeux ;
- augmenter les URLs SEO ;
- refaire tout le social ;
- créer une nouvelle architecture backend.

Cette passe doit uniquement :

1. corriger le scoring Party ;
2. rendre Party réellement atomique en DB ;
3. valider game + mode partout ;
4. rendre Memory et Supabase comportementalement équivalents ;
5. tester réellement le backend Supabase/Postgres ;
6. corriger Rivals ;
7. fermer les gaps de contraintes SQL ;
8. rendre le CI HEAD totalement vert ;
9. durcir le QA canonical/SEO production-like.

Le but est désormais :

CORRECTNESS > FEATURES.

---

## 0. COMMENCE PAR LE QA ACTUEL

Lis :

`docs/PRODUCTION-CLOSURE-RESULT.md`
`docs/PRODUCTION-CLOSURE-AUDIT.md`
`docs/FINAL-PLATFORM-QA.md`
`docs/FINAL-GAMES-QA.md`
`docs/FINAL-SEO-QA.md`
`docs/RENDERED-SEO-QA.md`

Puis inspecte :

`apps/web/lib/backend/memory.ts`
`apps/web/lib/backend/supabase.ts`
`apps/web/lib/backend/competitive-run.ts`
`apps/web/lib/backend/types.ts`
`apps/web/app/api/parties/route.ts`
`apps/web/app/api/challenges/route.ts`
`packages/game-sdk/src/arcade.ts`
`supabase/migrations/0006_social_arcade.sql`
`supabase/migrations/0007_social_arcade_rounds.sql`
`scripts/db/run-integration.ts`
`playwright.config.ts`

Avant de coder, crée :

`docs/FINAL-CORRECTNESS-AUDIT.md`

avec :

ISSUE
CURRENT BEHAVIOR
EXPECTED BEHAVIOR
MEMORY STATUS
SUPABASE STATUS
TEST COVERAGE
SEVERITY
FIX

---

## 1. P0 — CORRIGER LE SCORING PARTY

BUG ACTUEL :

Memory ET Supabase font actuellement en substance :

`rankScores([{ currentPlayer }], ...)`

à chaque soumission.

Cela signifie :

A submits
→ A est seul dans rankScores
→ A reçoit 10 points

B submits
→ B est seul dans rankScores
→ B reçoit aussi 10 points

Ce n’est pas un classement de round.

La logique correcte :

ROUND PLAYING

A submits
→ store attempt only
→ NO POINTS YET

B submits
→ store attempt only
→ roster complete

Puis :

load ALL attempts for this round

[
 A score,
 B score,
 C score
]

→ `rankScores(allAttempts, lowerIsBetter(gameId))`

Puis seulement maintenant :

1st = 10
2nd = 7
3rd = 5
...

Ensuite appliquer ces points cumulativement aux standings.

IMPORTANT :

Aucune attribution de points AVANT la clôture du round.

---

## 2. SOURCE OF TRUTH DU ROUND

Utilise :

`party_round_attempts`

comme source de vérité du round.

Ne dérive pas un résultat complet depuis :

`party.submitted` seulement.

`submitted` peut rester cache/display si nécessaire, mais la vérité doit être :

DB attempts.

Chaque attempt doit inclure au minimum :

party_id
round_index
actor_id
run_id
score
trust
submitted_at

Le ranking doit être reconstruit depuis ces attempts.

---

## 3. P0 — PARTY MODE VALIDATION

Aujourd’hui Party vérifie surtout :

`run.gameId === slot.gameId`

Il faut aussi vérifier :

`run.mode === slot.mode`

Si round :

Sky Stack / climb

un run :

Sky Stack / another-mode

doit être refusé.

Même règle pour :

Velocity course-1 vs course-2
Knockout map-a vs map-b
etc.

Erreur explicite :

`mode_mismatch`

Ajoute test Memory ET Supabase.

---

## 4. P0 — CHALLENGE MODE VALIDATION

Même problème côté challenge.

`attemptChallengeFromRun()` doit vérifier :

run.gameId === challenge.gameId
ET
run.mode === challenge.mode

Si challenge same-seed ou seed-sensitive :

valide aussi le seed SI le run stocke cette information de façon fiable.

Ne fake pas une seed validation si la donnée n’existe pas.

Mais game + mode sont obligatoires.

Ajoute tests :

Sky challenge climb
Sky run wrong mode
→ reject

Velocity course-1 challenge
Velocity course-2 run
→ reject.

---

## 5. P0 — PARTY DB ATOMICITY

L’implémentation Supabase actuelle fait plusieurs read/write séparés :

read party
insert attempt
read/update standings
update submitted/state

C’est vulnérable aux races.

Exemple :

A et B soumettent quasiment en même temps.

Les deux lisent :

submitted = []

A écrit [A]
B écrit [B]

last write wins.

Résultat possible :

A disparu.

INTERDIT.

La mutation Party round doit être atomique.

Préférence :

Postgres RPC transaction.

Crée une migration additionnelle :

`0008_party_round_atomicity.sql`

ou numéro suivant correct.

Implémente une fonction Postgres du style :

`submit_party_round_attempt(...)`

Elle doit :

1. lock party row (`FOR UPDATE`) ;
2. vérifier state = playing ;
3. vérifier member ;
4. vérifier actor ∈ round_roster ;
5. vérifier duplicate actor/run ;
6. insérer attempt ;
7. compter les attempts du round ;
8. si roster incomplet :
   retourner Party still playing ;
9. si roster complet :
   charger tous attempts ;
   ranking complet ;
   appliquer points ;
   update members / standings ;
   state = results ;
10. commit atomiquement.

Si Supabase RPC est déjà la convention du repo, utilise-la.

Pas de transaction simulée côté JS.

---

## 6. RANKING LOWER-IS-BETTER

Le ranking doit utiliser :

`lowerIsBetter(gameId)`

correctement.

Exemples :

Velocity Run
Knockout Circuit
Pocket Striker

→ plus petit = meilleur.

Sky Stack
Neon Drift
Territory Rush
Crowd Control
etc.

→ plus grand = meilleur.

Test obligatoire :

Party 2 joueurs sur un higher-is-better game.

A = 100
B = 200

B reçoit 10
A reçoit 7.

Puis test sur lower-is-better :

A = 30
B = 40

A reçoit 10
B reçoit 7.

---

## 7. MEMORY BACKEND DOIT COPIER LA MÊME SÉMANTIQUE

Memory ne doit pas avoir une logique différente de Supabase.

Refactor si nécessaire vers des helpers purs :

`rankPartyRound(...)`
`validateCompetitiveRunForSlot(...)`
`applyRoundPoints(...)`

Ces helpers peuvent être partagés entre backends.

Évite :

Memory logique A
Supabase logique B.

On veut le même comportement fonctionnel.

---

## 8. P0 — VRAI TEST POSTGRES / SUPABASE CONTRACT

Le CI database actuel est cassé.

`pnpm test:db`

renvoie :

`unexpected migrations: 0001 ... 0007`

et exécute :

`0 database integration checks`.

C’est inacceptable pour cette branche.

Corrige d’abord le runner DB.

Inspecte :

`scripts/db/run-integration.ts`

et la logique qui liste les migrations attendues.

Elle doit :

- découvrir les migrations réelles ;
- les appliquer dans l’ordre ;
- accepter 0006/0007/0008 ;
- fail si une migration elle-même échoue ;
- ne pas fail simplement parce que le nombre de migrations a augmenté.

Puis ajoute des tests SQL/integration qui prouvent réellement les nouvelles tables/fonctions.

---

## 9. TEST BACKEND SUPABASE, PAS SEULEMENT MEMORY

Actuellement Playwright force :

`GAMESWEB_BACKEND=memory`.

Garde ça pour la majorité des E2E si besoin.

Mais ajoute une suite distincte :

`test:db-social`

ou équivalent.

Elle doit utiliser un vrai Postgres local CI avec le schéma Supabase compatible.

Si `SupabaseBackend` dépend du client Supabase HTTP impossible à émuler simplement avec Postgres nu, alors :

OPTION A :
tester directement les RPC SQL + contraintes Postgres ;

ET

OPTION B :
ajouter des integration tests ciblés sur `SupabaseBackend` avec un environnement local approprié déjà utilisé dans le repo.

Ne prétends pas “Supabase tested” si tu n’exécutes que Memory.

---

## 10. BACKEND CONTRACT TEST

Crée idéalement une suite contractuelle commune.

Exemple :

`tests/backend-social-contract.ts`

avec une factory :

MemoryBackend
SupabaseBackend / DB integration adapter

Puis mêmes scénarios :

create party
join
ready
start
submit A
still playing
submit B
results
ranking correct
advance
next round

challenge create
attempt
wrong owner
wrong game
wrong mode
duplicate
expired
inbox
read
rivals

Le but :

le même scénario doit passer sur les deux backends.

---

## 11. P1 — RIVALS SUPABASE

Audit actuel :

`listRivals()` fait un `select("*")` sur challenges puis semble attendre une relation `challenge_attempts`.

Ce n’est pas fiable.

Corrige la requête.

Soit :

explicit relation select :

`select("..., challenge_attempts(...)")`

si la relation Supabase existe.

Soit deux requêtes explicites.

Ne dépends pas d’une relation qui n’est pas réellement chargée.

---

## 12. RIVALS — LOWER IS BETTER

N’utilise plus :

`attempt.score > challenger_score`

comme définition universelle de victoire.

C’est faux pour :

Velocity
Knockout
Pocket.

Réutilise :

`challengeOutcome(...)`

ou exactement la même logique centrale que Challenge.

Rivals doit dériver :

win
loss
draw

depuis le vrai outcome du challenge.

Pas de logique parallèle.

---

## 13. RIVALS — DATE / STREAK

Actuellement certains `lastMatch` peuvent être recréés avec :

`Date.now()`

au moment de la lecture.

C’est incorrect.

Utilise :

challenge attempt `created_at`

ou challenge completion date.

Même chose pour streak :

si tu ne peux pas reconstruire un streak historique correct facilement,
mets une valeur neutre plutôt que d’inventer.

Pas de donnée synthétique présentée comme historique.

---

## 14. P1 — SQL RUN UNIQUENESS

Memory a `usedRuns`.

Supabase doit avoir des garanties DB équivalentes.

Ajoute des contraintes/index adaptés.

Challenge create :

un challenger run ne doit pas créer plusieurs challenges si la règle est one-run-one-challenge.

Possible :

unique challenger_run_id
WHERE challenger_run_id IS NOT NULL

Challenge attempts :

run_id ne doit pas être réutilisé abusivement.

Party round attempts possède déjà :

unique(party_id, round_index, run_id)

Mais réfléchis aussi au niveau global selon la règle métier.

Pour guests :

ne dépends pas uniquement de `player_id` nullable.

Utilise :

`player_actor`

comme clé stable.

Ajoute contrainte :

unique(challenge_id, player_actor)

si un joueur ne peut faire qu’une tentative.

Vérifie les règles métier avant d’imposer la contrainte.

---

## 15. CHALLENGE TYPE VALIDATION

Lors de create challenge :

ne prends pas n’importe quel string casté en `ChallengeType`.

Utilise :

`getManifest(run.gameId)`

puis :

`challengeCompatible(game, type)`

Si type absent :

`defaultChallengeType(game)`.

Si type demandé incompatible :

400/409 explicite.

Pas de cast aveugle.

---

## 16. CHALLENGE VERIFIED / FLAGGED

Clarifie la règle.

Pour Challenge create :

si run flagged :
soit reject,
soit challenge unverified.

Décide explicitement.

Pour Party :

flagged doit rester refusé pour standings compétitifs.

Documente.

Pour pending/unverified :
définis si accepté comme unverified ou refusé.

Une seule politique.

---

## 17. CI HEAD DOIT ÊTRE VERT

Le commit actuel a un CI rouge.

Ne mets PAS “done” tant que le HEAD n’a pas :

database = success
check = success

Le run actuel avait :

86 passed
9 skipped
4 failed
1 flaky

Corrige réellement.

---

## 18. NEON GAMEPLAY E2E FLAKE

Erreur actuelle :

assertAlive attend :

tick > start + 8

mais CI obtient +6/+7 environ.

Ne baisse pas arbitrairement le test juste pour le rendre vert.

Comprends pourquoi.

Possibilités :

CI headless low FPS
debug tick semantics
pause/resume side effect
render-heavy scene

Le but du test est de détecter :

simulation alive / not frozen.

Utilise un signal plus robuste que “8 ticks en 6 secondes” si nécessaire.

Exemple :

tick strictly increases
OR
timeMs advances
OR
position/score changes

avec seuil adapté au headless CI.

Ne masque pas un vrai freeze.

---

## 19. VELOCITY DEATH RESET FLAKE

CI a vu :

expected timeMs < 50
received ~5149ms.

Inspecte le reset réel.

Deux possibilités :

A. bug gameplay :
timer ne reset parfois pas.

→ corriger.

B. debug field représente cumulative session time et le test est faux.

→ corriger debug/test.

Mais ne marque pas flaky sans comprendre.

Je veux une assertion stable sur :

new attempt started
attempt timer reset
death counter incremented
runState playing.

---

## 20. NEON SCREENSHOT TEST TIMEOUT

`e2e/neon-tracks.spec.ts`

timeout sur screenshots.

Optimise le test :

- moins de screenshot duplication ;
- éviter capture page + canvas systématiquement si inutile ;
- réduire moments si nécessaire mais conserver :
  opening
  mid
  distinctive/peak ;
- éventuellement capturer seulement canvas pour unlabeled + page pour 1 moment ;
- désactiver animations/effets non essentiels dans QA mode.

Le test doit être reproductible dans CI.

Screenshots déjà committés ne suffisent pas.

---

## 21. VISUAL SNAPSHOTS HOME

Deux snapshots restent rouges :

`home-swarm-1440`
`home-neon-activities-1440`

Ne les appelle plus “noise” sans preuve.

Inspecte le diff artifact.

Si UI attendue a réellement changé :
update snapshot.

Si rendu instable :
stabilise :
animations
date
random
loading
fonts
dynamic state.

Le CI final doit être vert.

---

## 22. SEO CANONICAL PRODUCTION-LIKE

Le rendered SEO QA actuel accepte :

`http://localhost:3000/games`

car il teste seulement :

`/^https?:\/\//`

Trop faible.

Dans le test SEO :

configure :

`NEXT_PUBLIC_APP_URL=https://gamesweb.example`

ou un domaine QA fixe.

Puis exige :

canonical === `https://gamesweb.example${normalizedPath}`

Pour `/` :
`https://gamesweb.example`

Pour chaque page :
exact pathname.

Refuse explicitement :

localhost
127.0.0.1
vercel.app preview
query strings
hash.

---

## 23. SITEMAP PRODUCTION-LIKE

Même logique.

Chaque `<loc>` doit commencer par :

`https://gamesweb.example`

dans QA production-like.

Aucun localhost.

Aucun preview host.

Aucun noindex URL.

65 indexables attendues.

---

## 24. RENDERED SEO NE DOIT PAS REGRESSER

Conserve :

65 URLs
65 pass

Ne crée aucune nouvelle page.

Max similarity reste raisonnable.

Ne réécris pas tout le contenu.

Seulement réparer les tests canonical/origin si nécessaire.

---

## 25. GAME / MODE CONTRACT HELPERS

Je recommande de créer un helper central :

`validateCompetitiveRunTarget(run, target)`

avec :

target.gameId
target.mode
target.seed? optional

Résultat :

ok
game_mismatch
mode_mismatch
seed_mismatch

Réutilise dans :

Party
Challenge
future competitive features.

Ne duplique pas ces checks.

---

## 26. ATOMIC PARTY ROUND TEST

Ajoute un vrai test de concurrence DB.

Deux submit quasi simultanés :

Promise.all([
 submit A,
 submit B
])

Résultat final :

state = results
submitted contains A+B
2 attempts
aucun lost update
points corrects
pas duplicate
standings corrects.

C’est le test clé pour la nouvelle RPC.

---

## 27. MULTI-ROUND TEST

Test Party 2 rounds :

Round 1:
A wins
B second

Round 2:
B wins
A second

Final standings :

A = 17
B = 17

ou selon `PARTY_POINTS`.

Vérifie cumul.

Puis troisième scénario pour départager.

Le but est de tester le cumul réel.

---

## 28. LOWER-IS-BETTER PARTY TEST

Utilise un jeu lower-is-better.

Exemple Velocity.

A = 32s
B = 41s

A doit gagner.

Ne hardcode pas une inversion spécifique à Velocity dans Party.

Ça doit découler de :

`lowerIsBetter(gameId)`.

---

## 29. CHALLENGE OUTCOME TEST MATRIX

Teste au moins :

higher:
challenger 100
opponent 200
→ opponent win

lower:
challenger 40
opponent 30
→ opponent win

draw:
same score

wrong mode:
reject

wrong game:
reject

stolen run:
reject

flagged:
selon politique choisie.

---

## 30. DOCS — CORRIGE LES CLAIMS TROP FORTS

Ne laisse pas dans :

`PRODUCTION-CLOSURE-RESULT.md`

des `CLOSED` faux.

Après la passe, mets à jour selon les preuves réelles.

Par exemple :

Party scoring correctness
Party atomic DB
Supabase contract
CI head green

ne passent CLOSED que si testés.

---

## 31. TEST MATRIX FINALE

Je veux sur le HEAD final :

`pnpm typecheck`
PASS

`pnpm lint`
PASS ou warning connu documenté

`pnpm test`
PASS

`pnpm build`
PASS

`pnpm test:db`
PASS

social contract memory
PASS

social DB integration
PASS

Playwright full suite
PASS

Pas :

“assembled from separate runs”.

Je veux un vrai run HEAD complet.

---

## 32. GITHUB ACTIONS

Le workflow GitHub doit finir :

database = success
check = success

Si autre job :
green aussi.

Dans le document final, mets :

workflow run ID
commit SHA
jobs
conclusions

Pas seulement “green”.

---

## 33. DOCUMENT FINAL

Crée :

`docs/FINAL-CORRECTNESS-CLOSURE.md`

Inclure :

Base SHA
Head SHA

Fixed:
- Party group ranking
- atomic submit
- game/mode validation
- DB integration
- Supabase parity
- Rivals
- SQL constraints
- CI flakes
- canonical QA

Remaining P2 only.

Ajoute tableau :

ISSUE
BEFORE
FIX
TEST
STATUS

---

## 34. DEFINITION OF DONE

Cette passe est DONE seulement si :

PARTY
- waits all round members ;
- ranks all round attempts together ;
- points correct ;
- higher/lower games correct ;
- concurrent submits safe ;
- Memory/Supabase same behavior ;
- game + mode enforced ;
- duplicate safe.

CHALLENGE
- runId truth ;
- game + mode enforced ;
- compatible challenge type ;
- no forged trust ;
- lower/higher outcomes correct.

SUPABASE/DB
- 0006/0007/new migration apply ;
- DB tests execute >0 checks ;
- social DB tests pass ;
- atomic RPC tested.

RIVALS
- actual attempts loaded ;
- lower/higher result correct ;
- no fake dates.

SEO
- 65 indexable ;
- exact public canonical ;
- no localhost ;
- sitemap same public origin.

GAMES
- full E2E passes ;
- Neon screenshot test reproducible ;
- Velocity death reset stable.

CI
- HEAD completely green.

NO MERGE MAIN.
NO PROD DEPLOY.
NO FEATURE CREEP.
NO URL EXPANSION.

The goal of this pass is not to make Gamesweb look more complete.

The goal is to make the backend behavior mathematically correct, concurrency-safe, testable on the actual database path, and green on one reproducible CI run.
