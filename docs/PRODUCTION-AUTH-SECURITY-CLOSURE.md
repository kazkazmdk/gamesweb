# Clôture auth / sécurité production

Branche : `cursor/production-social-closure-032a`  
Base de la PR : `cursor/final-product-seo-qa-032a`

| SHA | Run | Rôle | `check` | `database` |
| --- | --- | --- | --- | --- |
| `0b96a6bec7f70899c468eb0228aefe41efb35f95` | [35723593575](https://github.com/kazkazmdk/gamesweb/actions/runs/35723593575) | HEAD audité (social code-closed) | success | success |
| `8fff23b396fd1918afddb900ce024806bddb7014` | [35776664630](https://github.com/kazkazmdk/gamesweb/actions/runs/35776664630) | auth / Turnstile / account | [106911496087](https://github.com/kazkazmdk/gamesweb/actions/runs/35776664630/job/106911496087) success | [106911496342](https://github.com/kazkazmdk/gamesweb/actions/runs/35776664630/job/106911496342) success |

Base SHA : `0b96a6bec7f70899c468eb0228aefe41efb35f95`  
Final SHA (code) : `8fff23b396fd1918afddb900ce024806bddb7014`  
Workflow run ID (code) : `35776664630`

Sur `8fff23b` : typecheck, lint, `pnpm test` (163 passed), build, Playwright (99 passed, 9 skipped, 0 failed), `pnpm test:db` (65 checks). Ce document est un commit docs-only au-dessus de ce HEAD. Pas de merge `main`. Pas de deploy.

## Migrations

`0010_account_deletion.sql` — RPC `delete_player_account(uuid)`, `service_role` only. `0001`–`0009` inchangées.

## Routes ajoutées

- `POST /api/player/logout` — same-origin, rate limit généreux, `signOut()` si session, 200 même sans session.
- `DELETE /api/player/me` — authentifié, same-origin, `{confirm:"DELETE"}`, rate limit 3/h, RPC + admin Auth delete, rotation `gw_guest`.

## Auth flow

1. Guest joue ; `gw_guest` HttpOnly / SameSite=Lax / Secure en prod.
2. `/auth` POST `{email, captchaToken?}` → rate limit IP/email → Turnstile si secret → `signInWithOtp` (même réponse pour compte existant ou nouveau).
3. Callback `safePath(next)` ; `emailRedirectTo` = `${appUrl()}/auth/callback`.
4. `/auth/complete` merge cookie-bound ; le client ne choisit pas `anonymousId`.

## Guest merge

Inchangé : cookie serveur, Zod, max 40 offline runs, idempotence `merge:user:guest`. Double merge Memory : pas de double XP.

## Rate limit

Upstash en prod. Redis absent/down en `VERCEL_ENV=production` → fail-closed. Mémoire seulement hors vraie prod. Policies : `accountLogout` 30/min, `accountDelete` 3/h.

## Turnstile

| État | Comportement |
| --- | --- |
| ni secret ni site key | pas de widget ; backend accepte |
| les deux | widget + `captchaToken` requis |
| un seul des deux | `assertProductionSecrets` invalide |

Le secret n’est jamais envoyé au client.

## Production config

Vraie prod (`VERCEL_ENV=production` sans `GAMESWEB_BACKEND=memory` ni `GAMESWEB_DEMO_MODE=true`) exige :

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SECRET_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `NEXT_PUBLIC_APP_URL=https://…`.

Un projet Vercel vide n’est plus un « memory demo » silencieux.

## Origin / CSRF

`Sec-Fetch-Site: cross-site` → 403. Origin étrangère → 403. Requête sans `Sec-Fetch-Site` (Playwright, tests) acceptée jusqu’à la logique métier.

## Logout / delete

Logout : session Auth coupée, analytics reset, `isGuest=true`, progression locale conservée.  
Delete : profile + données perso DELETE ; scores/sessions ANONYMIZE ; Auth user DELETE ; cookie guest rotaté ; store local remis à un nouveau guest.

## Supabase live

`pnpm test:supabase` : **SKIPPED — no provisioned Gamesweb Supabase credentials**

PostgreSQL schema/RPC path tested (`pnpm test:db`, y compris `delete_player_account`).  
Supabase PostgREST client integration has not yet been exercised against a provisioned Gamesweb Supabase project.

## Residual risks

- Supabase live PostgREST non testé.
- Magic-link email réel non testé (`requires provisioned staging Supabase + controllable test mailbox`).
- CSP garde `unsafe-inline` (P2, Next/Phaser).
- `gw_guest` = identifiant pseudonyme bearer-like, pas un compte fort.
- Lifecycle email/push non implémenté.

Ce ne sont pas des blockers de cette passe.
