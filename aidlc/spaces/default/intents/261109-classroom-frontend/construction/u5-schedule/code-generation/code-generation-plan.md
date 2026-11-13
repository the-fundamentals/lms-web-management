# Code Generation Plan: u5-schedule

## Summary

- Builds: classroom **Sessions** — overview (≤10 Upcoming/Active/Past), GMT+7 month calendar, weekly time CRUD, new adhoc session, Present/Absent attendance with learning-note footnote, complete/cancel with named confirmation.
- Touches: new `src/features/schedule/` (`components/`, `lib/`); replace sessions placeholder via thin routes under `src/routes/classrooms/$classroomId/` (and nested `sessions/`); reuse U0/U1 GMT+7 helpers and existing `alert-dialog`; ESLint zone for schedule vs other features.
- Does **not** generate sessions from Tools (U7), Money/invoices (U6), or classroom-wide Attendance/Finances tabs.
- Tests: vitest under `src/features/schedule/` (~40–55 unit + 2–4 integration).

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:7eda6dbebc7eba01e8858d8911833c06e2bca18cdf76aeaf6f15de08f0d63baa",
  "contract_sha256": "sha256:aee7bb02f8205912a3ecda3439fd589eea1b0cfac342d3618186cb636cbed02a"
}
```

## What this unit is

`u5-schedule` is FR4.1–FR4.9 and FR6.1–FR6.2 for one classroom: session overview, GMT+7 month calendar, weekly recurrence rows, create adhoc session, mark Present/Absent (status only; learning-note footnote), complete/cancel with confirmation that names the session.

Features do not import each other. U3's classroom layout already hosts a Sessions tab and `<Outlet />`. U5 fills child routes under `/classrooms/$classroomId/`; classroom never imports `@/features/schedule`. Session generation from Tools stays U7. Money stays U6. The classroom **Attendance** tab (all-class rollup) stays disabled.

OpenAPI ops: `getAllClassroomSessions`, `createClassroomSession`, `getClassroomSessionById`, `completeClassroomSession`, `cancelClassroomSession`, `getAllClassroomSessionAttendances`, `createClassroomSessionAttendances`, `updateClassroomSessionAttendance`, `getAllClassroomScheduleRecurrences`, `createClassroomScheduleRecurrence`, `deleteClassroomScheduleRecurrence`. Reuse `getAllClassroomMembers` only via the members helpers' pattern duplicated under schedule (or thin shared mapping in schedule that calls the SDK directly — **no** import of `@/features/members`).

Date/time: teacher enters calendar date + clock in GMT+7; convert at the boundary with existing `src/shared/lib/gmt7.ts`. A session crossing midnight shows on the start civil date; end time may show next date (FR6.2).

## Steps

Test-after. No data-model or repository layer.

### Step 1. Project structure

- [x] Add `src/features/schedule/components/` and `src/features/schedule/lib/`.
- [x] Thin routes (auth + AppShell already on `$classroomId` layout):
  - `src/routes/classrooms/$classroomId/index.tsx` — replace placeholder with session overview.
  - `src/routes/classrooms/$classroomId/calendar.tsx` — month calendar.
  - `src/routes/classrooms/$classroomId/weekly.tsx` — weekly time list + save/delete.
  - `src/routes/classrooms/$classroomId/sessions/new.tsx` — new adhoc session.
  - `src/routes/classrooms/$classroomId/sessions/$sessionId.tsx` — attendance + complete/cancel.
- [x] Overview links: New session, Calendar, Weekly time (`data-testid`s). Sessions tab already navigates via local tab / outlet; keep Members URL wiring from U4.
- [x] ESLint zone: `src/features/schedule` must not import other features (and peers must not import schedule).

Stories: FR4.1, FR4.2, FR4.3, FR4.5, FR4.6 (routes).

### Step 2. Test runner

- [x] Vitest already installed. Record unit-scoped command in `unit-test-instructions.md`.
- [x] Stub generated SDK / do not call real API.

Stories: none.

### Step 3. Session + GMT+7 helpers, then tests

- [x] Map `ClassroomSessionResponse` → row (id, classroomId, sessionDate, start/end, status, type, name).
- [x] Bucket into Upcoming / Active / Past for overview (at most 10 total across groups); sort by start time then id within each group.
- [x] Calendar month helpers in GMT+7: month grid cells; place sessions by civil start date; midnight-cross display rule.
- [x] Create adhoc body from GMT+7 date + start/end (and optional name).
- [x] Recurrence create body: `frequency: WEEKLY`, `byDays`, `recurrenceStartDate`, `startTime`, `endTime`.
- [x] Attendance payload: status only (`ATTENDED` / `ABSENT`); unmarked stays `UNSET` / omitted.
- [x] Six to eight helper tests (bucket + sort, GMT+7 label, midnight-cross, create body, recurrence body, attendance status-only).

Stories: FR4.1, FR4.2, FR4.5, FR4.6, FR6.1, FR6.2, FR8.4.

### Step 4. Session API wrappers, then tests

- [x] Wrap list/create/get/complete/cancel sessions; list/create/update attendances; list/create/delete schedule recurrences; invalidate query keys.
- [x] Five to six wrapper/filter tests (stub SDK).

Stories: FR4.1–FR4.9, FR8.4.

### Step 5. Session overview UI, then tests

- [x] Overview: load sessions; Upcoming / Active / Past (≤10); empty successful load + New session (`data-testid="new-session"`); failed load → shared error screen.
- [x] Row opens session attendance route; links to calendar and weekly.
- [x] Six to eight overview tests.

Stories: FR4.1, NFR2.

### Step 6. Month calendar UI, then tests

- [x] GMT+7 calendar month; navigate prev/next month; sessions on start date; labels include GMT+7.
- [x] Five to six calendar tests.

Stories: FR4.2, FR6.1, FR6.2.

### Step 7. Weekly time UI, then tests

- [x] List weekly rows; form: weekdays + start/end (+ start date); save calls create (does **not** insert session rows); delete removes one row; sessions already listed stay.
- [x] Dirty leave when form dirty; double-submit guard.
- [x] Six to eight weekly tests.

Stories: FR4.3, FR4.4, FR7.4.

### Step 8. New session UI, then tests

- [x] Date + start/end (+ optional name) in GMT+7; save once via `createClassroomSession`; success → overview; double-submit guard; server error leaves form.
- [x] Five to six create tests.

Stories: FR4.5, FR7.3, FR7.4.

### Step 9. Attendance + complete/cancel UI, then tests

- [x] Load session + members + existing attendances; Present/Absent controls while OPEN; save status only; unmarked stays unmarked.
- [x] COMPLETED/CANCELLED: controls disabled; copy says session is not open.
- [x] Footnote: learning note comes later when the API can store it (FR4.8).
- [x] Complete / Cancel: confirmation **names the session**; success refreshes overview status.
- [x] Six to eight attendance/lifecycle tests.

Stories: FR4.6, FR4.7, FR4.8, FR4.9.

### Step 10. Wire routes + suite green

- [x] Replace `ClassroomSessionsPlaceholder` usage; keep classroom→schedule import-free.
- [x] Run unit-scoped vitest; Construction Verification Command at checkpoint.
- [x] Write `code-summary.md`, `source-manifest.json`, `traceability.json`.
- [x] No commit/push.

Stories: FR4.1–FR4.9, FR6.1–FR6.2, FR8.4, NFR2, NFR3.

### Step 11. Traceability + summary

- [x] Refresh `traceability.json`, `code-summary.md`, `source-manifest.json` after implementation.

## Requirement map

| Requirement | Step |
|---|---|
| FR4.1 | Steps 3, 5, 10 |
| FR4.2 | Steps 3, 6, 10 |
| FR4.3 | Steps 3, 4, 7 |
| FR4.4 | Steps 4, 7 |
| FR4.5 | Steps 3, 4, 8 |
| FR4.6 | Steps 3, 4, 9 |
| FR4.7 | Step 9 |
| FR4.8 | Step 9 |
| FR4.9 | Steps 4, 9 |
| FR6.1 | Steps 3, 6, 8 |
| FR6.2 | Steps 3, 6 |
| FR7.3 | Step 8 |
| FR7.4 | Steps 7, 8 |
| FR8.4 | Steps 3–9 |
| NFR2 | Steps 5–10 |
| NFR3 | Steps 1, 10 |
| Tools session generation | Out of scope (U7) |
| Classroom Attendance / Finances tabs | Out of scope (later) |
| Money / invoices | Out of scope (U6) |
