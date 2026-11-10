<!-- INVARIANT: examples are single-line HTML comments so a fresh template parses to total=0 (MEMORY_EMPTY). Do NOT un-comment or split across lines. t100 guards this. -->
> This file is kept up to date automatically while the stage runs. Add observations at the review step, not by editing here directly.

## Interpretations
- 2026-11-10T11:53:17Z — This version is admin-only. The owner is the only teacher and the only manager, so a class member is added as a student. The server's teacher-member role is not offered.
- 2026-11-10T11:33:26Z — Learning note is a footnote with no input; the owner replaced the on-screen note after confirming attendance cannot store one.
- 2026-11-10T11:33:26Z — Monthly invoices are listed from the server job. This app has no Generate control, so the local invoice helper is not a screen.
- 2026-11-10T11:33:26Z — A student with no price is shown as 0 VND, because the server bills 0 in that case. The classroom price is not copied onto the student.
<!-- example: 2026-05-29T10:14:32Z — chose REST over GraphQL; the consuming team only needs CRUD, revisit if subscriptions land -->

## Deviations
<!-- example: 2026-05-29T10:14:32Z — skipped the optional caching layer the stage prose suggested; the dataset is small enough that it adds risk -->

## Tradeoffs
- 2026-11-10T11:33:26Z — 15 seconds ends a waiting call, and 1280 CSS pixels is the laptop width. Both are stated numbers the owner can change, so loading and layout stay testable.
<!-- example: 2026-05-29T10:14:32Z — picked TDD over BDD this run; the team is unit-first and the domain is well-understood -->

## Open questions
<!-- example: 2026-05-29T10:14:32Z — confirm the retention window with compliance before the next stage hardens the schema -->
