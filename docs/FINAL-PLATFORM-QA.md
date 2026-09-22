# Final platform QA

Base: `cursor/final-product-seo-qa-032a` @ `d7a22e3`  
Head: `cursor/production-social-closure-032a`

## Social surfaces

| Surface | Source of truth | Guest | Cross-device / process |
| --- | --- | --- | --- |
| Party | `BackendStore` (memory file or Supabase) | cookie actor | yes on this backend |
| Challenge | same + `runId` | cookie actor | `/c/CODE` without payload |
| Inbox | `notifications` / memory inbox | cookie actor; copy says so | read state persists |
| Rivals | derived from completed challenges | cookie actor | yes on this backend |
| Crew | local preview | this device | no (P2) |
| Daily / GP | local | this device | no (P2) |
| Friends / presence / scores | existing BackendStore | unchanged | unchanged |

## Party

Host start / advance only. Members submit own `runId`. Round stays `playing` until the ready roster has submitted. Refresh reloads membership, roster, round, standings.

## Challenge

Create/attempt from stored run. Spoofed `trust: verified` or client score → 403.

## Production caveats

Without a provisioned Gamesweb database, persistence is the Memory backend + optional `GAMESWEB_MEMORY_FILE`. That is still process-shared on one Node instance and file-shared across restarts in tests. Vercel isolates need Supabase.
