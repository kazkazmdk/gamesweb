# Audit state machine sociale

HEAD audité : `a3062133d9207e22243aa67671ada73d4bc09612` (prompt) sur le code `bd61306d54aa3d9adc80e4810483bd260d06eabe`.  
Lecture avant correctif : `memory.ts`, `supabase.ts`, `types.ts`, `competitive-contract.ts`, routes Party/Challenge, `arcade.ts`, migrations `0006`–`0008`, tests contrat, `e2e/social.spec.ts`, `scripts/db/run-integration.ts`.

Politique de run, déjà en place, conservée : un `run_id` est unique dans Party et unique dans Challenge, séparément. Un même run peut servir une action Party et une action Challenge. Pas de table globale `competitive_run_claims`.

## Party `results -> start`

ISSUE : `startParty` accepte `lobby` et `results`.

CURRENT CODE : `memory.ts` `startParty` (`state !== "lobby" && state !== "results"` → `bad_state`). `supabase.ts` `startParty` fait le même test puis un `update` qui remet `playing` sans incrémenter `current_round` et sans effacer les tentatives.

FAILURE MODE : le round reste le même, les `party_round_attempts` existent, les joueurs reçoivent `duplicate`, la party peut rester bloquée.

EXPECTED STATE MACHINE : `lobby → start → playing → roster complet → results → advance → playing → … → advance → done`. `startParty` uniquement depuis `lobby`. `results → start` = `bad_state`. `advance` uniquement depuis `results`.

MEMORY : le garde `results` est accepté.

SUPABASE : le même garde, puis des lectures/écritures séparées.

DB GUARANTEE : aucune. `0008` ne couvre que le submit.

TEST GAP : le contrat Memory avance depuis `results` et ne rappelle pas `start`. Le SQL force le round suivant par `update` direct (`CUMUL8`).

FIX : refuser `results` des deux côtés. RPC `start_party` / `advance_party` sous `FOR UPDATE`.

## Lifecycle Challenge

ISSUE : un duel a un seul adversaire, mais une seconde tentative peut clôturer puis être écrasée. Supabase insère puis met à jour hors transaction.

CURRENT CODE : `applyChallengeAttempt` passe à `completed` et réécrit `targetId`, `targetScore`, `winnerId`. `MemoryBackend.attemptChallengeFromRun` ne teste pas `status` avant cet appel. `SupabaseBackend.attemptChallengeFromRun` charge le challenge, calcule en JS, `insert` puis `update` de `status` et `winner_id` seulement (`targetScore` reste `null` dans `mapChallenge`).

FAILURE MODE : B termine, C rappelle `applyChallengeAttempt` et remplace le vainqueur. Deux submits concurrents peuvent tous les deux voir `open`.

EXPECTED STATE MACHINE : `open → première tentative valide → completed`. Ensuite `challenge_closed`. Le challenger reçoit `self_challenge`. `challengeOutcome` inchangé : survive toujours au plus haut score ; sinon égalité = draw ; sinon `lowerIsBetter`.

MEMORY : pas de garde `status`, pas de garde self.

SUPABASE : pas de `FOR UPDATE`. Dernier `update` gagne.

DB GUARANTEE : unicité `(challenge_id, player_actor)` et `run_id`, pas « une tentative par challenge », pas de transaction de clôture.

TEST GAP : le contrat couvre mode, flagged, lower/higher/draw pour le premier adversaire. Pas de second adversaire, pas de self, pas de course.

FIX : garde Memory avant `applyChallengeAttempt`. RPC `submit_challenge_attempt`. Index une tentative par challenge.

## `PartyMember.score`

ISSUE : le même champ n’a pas le même sens.

CURRENT CODE : à la clôture Memory fait `member.score = row.score` (score brut du round). `assembleParty` fait `score: m.points` (points cumulés). L’UI n’affiche pas ce champ ; le classement visible est `standings[].points`.

FAILURE MODE : un client qui lit `members[].score` voit le brut en Memory et les points en Supabase.

EXPECTED : `points` = points de party cumulés. `lastRoundScore` = dernier score brut, ou `null`.

MEMORY : `score` brut.

SUPABASE : `score` = `party_members.points`.

DB GUARANTEE : `party_members.points` est bien le cumul SQL. Le brut est dans `party_round_attempts.score`. Le type TS ment côté Memory.

TEST GAP : les tests lisent `standings`, pas le champ membre.

FIX : remplacer `score` par `points` + `lastRoundScore`.

## Join / capacité

ISSUE : Supabase compte les membres puis insère.

CURRENT CODE : `joinParty` charge la party, refuse si `length >= 6` ou si l’état n’est pas `lobby`, puis `insert`. `startParty` lit puis `update` sans verrou partagé avec le join.

FAILURE MODE : deux joins voient 5 membres et passent à 7. Un join peut s’insérer après le passage `playing` si le start n’a pas encore commité.

EXPECTED : `join_party` verrouille la party, idempotent si l’acteur est déjà membre (reconnexion, y compris hors lobby), `closed` pour un nouvel acteur hors lobby, `full` à 6. `start_party` verrouille la même ligne et fige `round_roster`. Unready pendant `playing` ne réécrit pas ce roster.

MEMORY : les contrôles sont justes mais seulement dans le processus, sous le verrou de submit pas sous celui du join.

SUPABASE : lecture puis insert.

DB GUARANTEE : aucune limite `<= 6`.

TEST GAP : pas de course à 6, pas de join `closed`, pas de roster figé.

FIX : RPC `join_party` dans `0009`, même verrou que `start_party`.
