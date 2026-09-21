# Final games QA

Base: `cursor/final-platform-games-seo-c08e` @ `f24d352`  
Head: work branch `cursor/final-product-seo-qa-032a`

## Eight games

| Game | Boot | Pause stops sim | Retry | First-read note |
| --- | --- | --- | --- | --- |
| Neon Drift | existing mount | already wired | existing | Harbour / Hairpin / Ridge cameras + worlds split |
| Velocity Run | existing | already wired | existing | Not redesigned. Rooftop parkour still the read. |
| Swarm Protocol | existing | already wired | existing | Peak not redesigned this pass. |
| Sky Stack | existing | **wired** | existing | Polish only. |
| Knockout Circuit | existing | **wired** | existing | Not redesigned. Oversized props remain. |
| Pocket Striker | existing | **wired** | existing | Polish only. |
| Territory Rush | existing | **wired** | existing | Territory/hold first; houses demoted |
| Crowd Control | existing | **wired** | existing | Boulevard facades + gates unchanged mechanically |

## Neon Drift first-read

| Track | Camera | Road | World |
| --- | --- | --- | --- |
| Harbour Loop | pulled back, sodium horizon | widest waterfront | water, cranes, containers, sodium lamps |
| Hairpin District | tight zoom, more yaw | 108–158 | vertical vegetation, no harbour water |
| Ridge Sweep | very pulled back, long look | 208–276 | ridge drop, underpass only here |

Roadside families are per track: harbour = service, hairpin = touge, ridge = tunnel + guardrail. Shared `roadsideFamily(u)` is gone.

## Game feel (audit, not a new juice pass)

Existing retry, result grace, Escape pause, blur-to-pause remain. Five games no longer keep simulating under the overlay. Results Retry is the dominant CTA.

## Known limits

No new gameplay features. No global art redesign. Visual stills for the three Neon environments were not recaptured in this pass; first-read claims are from code + prior QA folders.
