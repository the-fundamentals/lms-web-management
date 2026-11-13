## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-12T08:43:00.000Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/features/schedule/components/session-calendar.tsx > calendar session link className | Calendar session chips use raw `text-[11px]`, which is outside the single type scale required by NFR3 | Replace `text-[11px]` with a semantic type-scale class from the global stylesheet (for example `type-secondary`) | New |
| R-02 | Major | src/features/schedule/components/weekly-schedule.tsx > Back link / dirty leave; src/features/schedule/components/session-create.tsx > Back link / dirty leave | FR7.4 asks the teacher before leaving a dirty form, but weekly and create only hook `beforeunload`. The primary leave paths (Back `Link`, and classroom tab changes that navigate away) discard unsaved weekday/date/name input with no prompt | Add an in-app leave guard for dirty weekly and create forms (or equivalent router blocker) so Back and tab navigation ask before discarding | New |
| R-03 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u5-schedule/code-generation/unit-test-instructions.md > Modules and tests / integration; src/features/schedule/components/*.test.tsx | Standard strategy asks for five to eight tests per component; every schedule UI module ships three. The integration section requires create→overview and attendance reload persistence, but `schedule.integration.test.tsx` only lists a pre-seeded overview row and never creates a session or marks attendance | Bring each UI module to the five-to-eight band with the missing FR cases (dirty leave, weekly does not invent sessions, filter size 50), and implement the two promised integration flows | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `npx vitest run src/features/schedule` | PASS — `Test Files  9 passed (9)` / `Tests  26 passed (26)` / Duration ~2.42s | Schedule suite is green; volume is still below the unit-test-instructions / standard-strategy floor called out above |
| `npx vitest run && npx vite build` (verification-command.txt) | PASS — `Test Files  50 passed (50)` / `Tests  225 passed (225)`; `vite … ✓ built in 1.76s` | Intent-wide suite and production build succeed; green build does not clear the FR7.4 / NFR3 / test-contract gaps |

### Summary

Architecture boundaries (L1 routes compose schedule; classroom does not import `@/features/schedule`; list size 50; attendance status-only; GMT+7 midnight-cross helpers) hold and both validation commands pass, but NFR3 one-off type size, missing in-app dirty-leave for FR7.4, and under-delivered test contract make the unit not implementable as “done” without rework.
