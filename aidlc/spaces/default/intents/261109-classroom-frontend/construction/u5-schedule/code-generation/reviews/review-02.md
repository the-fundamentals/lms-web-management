## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-12T08:51:00.000Z
**Iteration:** 2
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/features/schedule/components/session-calendar.tsx > calendar session link className | Calendar session chips use raw `text-[11px]`, which is outside the single type scale required by NFR3 | Replace `text-[11px]` with a semantic type-scale class from the global stylesheet (for example `type-secondary`) | Resolved (reviewer) |
| R-02 | Major | src/features/schedule/components/weekly-schedule.tsx > Back link / dirty leave; src/features/schedule/components/session-create.tsx > Back link / dirty leave | FR7.4 asks the teacher before leaving a dirty form, but weekly and create only hook `beforeunload`. The primary leave paths (Back `Link`, and classroom tab changes that navigate away) discard unsaved weekday/date/name input with no prompt | Add an in-app leave guard for dirty weekly and create forms (or equivalent router blocker) so Back and tab navigation ask before discarding | Resolved (reviewer) |
| R-03 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u5-schedule/code-generation/unit-test-instructions.md > Modules and tests / integration; src/features/schedule/components/*.test.tsx | Standard strategy asks for five to eight tests per component; every schedule UI module ships three. The integration section requires create→overview and attendance reload persistence, but `schedule.integration.test.tsx` only lists a pre-seeded overview row and never creates a session or marks attendance | Bring each UI module to the five-to-eight band with the missing FR cases (dirty leave, weekly does not invent sessions, filter size 50), and implement the two promised integration flows | Resolved (reviewer) |
| R-04 | Minor | src/features/schedule/components/session-overview.test.tsx > describe SessionOverview; aidlc/spaces/default/intents/261109-classroom-frontend/construction/u5-schedule/code-generation/unit-test-instructions.md > session-overview | Overview has four tests (one under the five-to-eight band). Instructions still list a failed-load case that code-summary says was dropped | Add one overview case (for example empty→New session focus or failed-load) or align unit-test-instructions with the dropped reject test | New |

> R-01 Reviewer note: `session-calendar.tsx` session chips use `type-secondary`; no `text-[11px]` remains under `src/features/schedule/`

> R-02 Reviewer note: `weekly-schedule.tsx` and `session-create.tsx` call `useBlocker` with confirm `shouldBlockFn` plus `enableBeforeUnload`; dirty-leave tests assert the blocker

> R-03 Reviewer note: Schedule suite is 38 tests; dirty leave, weekly does not invent sessions, and filter size 50 are covered; integration runs create→overview and attendance mark→reload

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `npx vitest run src/features/schedule` | PASS — `Test Files  9 passed (9)` / `Tests  38 passed (38)` / Duration ~2.46s | Schedule suite green; volume matches the iteration-2 claim (~38) |
| `npx vitest run && npx vite build` | PASS — `Test Files  50 passed (50)` / `Tests  237 passed (237)`; `vite … ✓ built in 1.32s` | Intent-wide suite and production build succeed |

### Summary

Prior Majors (NFR3 chip type, FR7.4 in-app dirty leave, test-contract volume/integration) are fixed in source and both validation commands pass; only a Minor overview test-count / instructions drift remains. Boundaries (routes compose schedule; classroom does not import `@/features/schedule`; list size 50) hold.
