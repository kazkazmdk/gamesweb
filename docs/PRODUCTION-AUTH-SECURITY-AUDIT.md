# Audit auth / sécurité production

Branche : `cursor/production-social-closure-032a`  
HEAD audité : `0b96a6bec7f70899c468eb0228aefe41efb35f95`  
Lecture avant correctif. Aucune architecture réécrite.

## État actuel

Auth = magic-link Supabase (`signInWithOtp`) + cookie session `@supabase/ssr` + cookie guest `gw_guest`.  
Progression guest merge via `POST /api/player/merge` (identité cookie, pas le body).  
Pas de logout, pas de delete account. Turnstile est vérifié côté serveur seulement.

## Déjà correct

- POST cross-origin explicite → `ORIGIN_DENIED` 403 (`assertSameOrigin`).
- Rate limit Vercel production sans Upstash → fail-closed (pas de fallback mémoire).
- `readJson` limite à 120 Ko.
- Merge refuse `anonymousId` / `snapshot` client ; idempotence `merge:user:guest`.
- Magic-link : même message générique (pas d’énumération email).
- `safePath(next)` refuse `https://`, `//`, `\`.
- `gw_guest` : HttpOnly, SameSite=Lax, Secure en prod, ~400 jours.
- Health n’expose pas secret / turnstile / seed.
- Headers : CSP, Referrer-Policy, nosniff, X-Frame-Options, Permissions-Policy, COOP, HSTS prod.
- Service role seulement dans `createSupabaseAdmin()` (serveur).
- Double merge Memory déjà testé (`tests/backend.test.ts`).
- RLS + RPC Party/Challenge refusées à `anon` dans `pnpm test:db`.

## Risques vérifiés

| ID | Risque | Fichiers | Sévérité |
| --- | --- | --- | --- |
| T1 | `/auth` POST `{email}` sans `captchaToken`. Si `TURNSTILE_SECRET_KEY` est posé, le backend refuse tout magic-link. | `app/auth/page.tsx`, `lib/api/captcha.ts`, `app/api/player/auth/route.ts` | P0 |
| T2 | Config Turnstile partielle (secret XOR site key) non détectée. | `lib/env.ts` `assertProductionSecrets` | P0 |
| C1 | Prod Vercel vide → memory « demo » alors que le rate limiter refuse les mutations. Contrat ambigu. | `lib/env.ts` `resolveBackend` / `assertProductionSecrets` | P0 |
| O1 | Origin absent + Host présent → allow. `Sec-Fetch-Site: cross-site` non lu. | `lib/api/origin.ts` | P1 |
| A1 | Aucun logout. Session Auth + UI `isGuest=false` peuvent rester. | Settings, player-store | P0 |
| A2 | Aucune suppression de compte Auth + données liées. | `app/api/player/me/route.ts` | P0 |
| P1 | `getOrCreateProfile` select puis insert. Course signup + username `player_` + 8 hex (contrainte unique 3–20). | `lib/backend/supabase.ts` | P2 |
| S1 | `pnpm test:supabase` jamais exécuté ici : pas de credentials Gamesweb. | `scripts/verify-supabase-security.ts` | blocker release, pas blocker code |
| S2 | CSP `unsafe-inline` + `strict-dynamic` (Next/Phaser). Widget Turnstile a besoin de `frame-src` Cloudflare. | `middleware.ts` | P2 / implémentation |

## À modifier

1. Widget Turnstile client si `NEXT_PUBLIC_TURNSTILE_SITE_KEY` ; POST `{email,captchaToken}`.
2. Pair Turnstile obligatoire si l’un des deux est posé ; `assertProductionSecrets`.
3. Vraie prod (`VERCEL_ENV=production` sans `GAMESWEB_BACKEND=memory` / `GAMESWEB_DEMO_MODE=true`) : Supabase URL + publishable + secret, Upstash URL + token, `NEXT_PUBLIC_APP_URL=https://…`.
4. `assertSameOrigin` : `Sec-Fetch-Site: cross-site` → 403 ; requêtes sans metadata (Playwright, tests) inchangées.
5. `POST /api/player/logout` idempotent + Sign out Settings.
6. `DELETE /api/player/me` + confirmation + rotation `gw_guest` + admin Auth delete.
7. Inventaire delete (migration `0010`, ne pas retoucher `0001`–`0009`).
8. Tests origin / env / auth API / e2e security.
9. Étendre `test:supabase` (RPCs) ; exécuter seulement si credentials.

## Ne pas modifier

Party, Challenge, ranking, 65 URLs, jeux, design, Resend, merge `main`, deploy.  
CSP `unsafe-inline` reste P2 résiduel.

## Dépendances externes

| Check | Statut à l’audit |
| --- | --- |
| Supabase PostgREST live | NOT EXECUTED — pas de credentials |
| Magic-link email réel | NOT EXECUTED — pas de mailbox staging |
| Turnstile Cloudflare live | NOT EXECUTED — pas de site key/secret |

## Inventaire suppression (décision)

| Donnée | Action |
| --- | --- |
| `auth.users` | DELETE (admin API) |
| `profiles` | DELETE (cascade friendships, presence, saves, achievements, quests, stats, cosmetics, guest_migrations) |
| `guest_progress` lié | DELETE |
| `idempotency_keys` | DELETE |
| `notifications`, `recent_players`, `daily_entries`, `crew_members`, `league_members`, `rivals` | DELETE |
| `scores`, `game_sessions` | ANONYMIZE (`user_id`/`anonymous_id` null) — agrégats publics |
| `challenges` / `challenge_attempts` / `ghost_runs` / `party_members` | ANONYMIZE ids joueur |
| Catalogs `games`, `achievements`, `quests` | KEEP |

Guest cookie = identifiant pseudonyme bearer-like, pas un compte fort.
