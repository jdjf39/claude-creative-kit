# Ad concept menu

Each concept is a different LOOK, not a restyle of the product film. Offer 4-6 of these (tailored to the product)
in one AskUserQuestion (multiSelect), plus a format question. For SaaS, every one of them works when the story is:
**a relatable pain → the product's one decisive moment → the logo.**

| Concept | Tone | Look | Beat skeleton (≈22 s, logo at L) | Built? |
|---|---|---|---|---|
| **Notification storm** | playful, relatable, scroll-stopping | generic phone on a bold ink world, big side type | calm lock screen → bad-news pings pile up and accelerate (badge climbs, phone buzzes, big type "Another deal lost." / "Why?") → on the music drop: torrent + red, "You can't … every …" → hard stop, one swipe clears all → ONE lime brand notification → tap → product view shows the fix → tap the action → phone flies into the end card | yes, `examples/storm.*` (the client's favourite) |
| **Before / after split** | professional, editorial | cream, thin ink rules, magazine type; left/right (16:9) or top/bottom (9:16) | title "Same X. Two Y." → identical trigger types into both panels → WITHOUT side fumbles → red stamp "DEAL LOST"; WITH side gets the product's suggestion card → green stamp "NEXT MEETING BOOKED" → loser panel desaturates away → "The difference was one line." → 3 feature chips → end card | yes, `examples/split.*` |
| **Live, real time** | clean, techy | deep ink, grid and grain, glowing lime as the only accent, instrument-panel UI | title lands and parks at top → live header, clock, waveform → transcript scrolls; product suggestion cards pop (timer counts to the latency label), the user visibly follows each card → success chip → pull back and dim → 3 hard-cut kinetic phrases on the beat → end card | yes, `examples/live.*` |
| **Kinetic type** | bold, professional | words only, ink and brand accent, hard cuts on the beat, no UI | a painful quote ("She said 'let me circle back.' The deal died.") → 3-5 punch lines, one per beat → the product name as the answer → end card | not yet |
| **Chat / DM thread** | casual, funny | a messaging thread between two people (manager ↔ rep, or founder ↔ cofounder) | messages type in with typing dots, the pain escalates, someone drops the product link, the thread's tone flips | not yet |
| **Metric flip** | data, confident | one big number or chart that goes wrong, then the product fixes it | line or bar chart dives (red), zoom into the cause, product card, the chart recovers (green) | not yet |
| **Day in the life** | warm | 4-5 time stamps (8:12, 10:40, 2:15, 4:50) each a tiny scene of the product helping | time chip + one card per stamp, fast cuts on the beat | not yet |
| **Myth vs fact / checklist** | punchy, educational | big checkboxes / ✗ ✓ stamps | "You think X." ✗ "Actually Y." ✓, three rounds, end card | not yet |

Rules that made the built ones work:
- **One scenario, told end to end.** The Acme ads all reuse the demo story: rep Maya, price objection, the playbook line.
  Consistent demo facts across ads read as a real product.
- **Big type does the explaining; the UI is the proof.** Every beat has one readable line on screen.
- **Plan every visual moment to carry a sound** (ping, pop, tap, stamp, keystroke). The mix depends on it.
- The escalation lands on the music's drop and the logo on the music's final hit, so the builders must get exact times (see music.md).
- Playful ≠ childish. The client rejected anything that felt kiddy, cheesy or cartoony. Keep it polished.
