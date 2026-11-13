# Code Generation Plan: u4-members

## Summary

- Builds: classroom **Members** tab — active member list, search existing accounts and add as student (≤30 per save), remove with named confirmation, and one member's attendance history (paginated).
- Touches: new `src/features/members/` (`components/`, `lib/`); enables the Members tab in `src/features/classroom/components/classroom-layout.tsx`; thin routes under `src/routes/classrooms/$classroomId/members/`; may add shadcn `alert-dialog` (and search UI already covered by Input).
- Does **not** set member payment plans (U6), session attendance marking (U5), or hire teachers as TEACHER role (out of version).
- Tests: vitest under `src/features/members/` (~28–36 unit + 2–3 integration).

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

`u4-members` is FR3.1–FR3.5 for the open classroom: list active members, search accounts (`getAllAccounts`), add as `STUDENT` (`createClassroomMembers`), remove with confirmation naming the person (`removeClassroomMember`), and show that member's attendance history one page at a time (`getClassroomMemberAttendances`).

It lives under the classroom layout Members tab (U3 already sketched disabled tabs). Features do not import each other: the layout route/composes `members` UI the same way it already composes classroom rename. Money/payment plans stay U6. Session take-attendance stays U5.

OpenAPI ops: `getAllClassroomMembers`, `createClassroomMembers`, `removeClassroomMember`, `getAllAccounts`, `getClassroomMemberAttendances`.

## Steps

Test-after. No data-model or repository layer.

### Step 1. Project structure

- [x] Add `src/features/members/components/` and `src/features/members/lib/`.
- [x] Thin routes:
  - `src/routes/classrooms/$classroomId/members/$memberId.tsx` — attendance history for one member (auth + AppShell already on parent layout).
- [x] Enable the **Members** tab in `classroom-layout.tsx`: render members list (and attendance when the member route is active). Keep Sessions outlet behavior unchanged. Leave Attendance/Finances tabs disabled.
- [x] Add `alert-dialog` via shadcn if missing (`npx shadcn@latest add alert-dialog`). Keep UI in `src/components/ui`; `cn` from `@/shared/lib/cn`.
- [x] ESLint zone: `src/features/members` must not import other features (same pattern as classroom/auth).

Stories: FR3.1, FR3.5 (route for history).

### Step 2. Test runner

- [x] Vitest already installed. Record unit-scoped command in `unit-test-instructions.md`.
- [x] Stub generated SDK / do not call real API.

Stories: none.

### Step 3. Members API helpers + mapping, then tests

- [x] Helpers wrap SDK: list members by classroom id; map rows; **client-filter ACTIVE** for the people list (REMOVED stay out of FR3.1 list).
- [x] Add body: `{ members: [{ accountId, role: "STUDENT" }, ...] }` with 1–30 entries; skip accounts already ACTIVE in the class.
- [x] Remove by classroom id + member id.
- [x] Account search: `getAllAccounts` with `AccountFilter` — debounced `like` on `email` (and/or `firstName`/`lastName` as the schema allows); default page/size within schema max.
- [x] Attendance history: `getClassroomMemberAttendances` with filter `{ page, size }` (default size 20); map rows the UI needs (date, status, session id if present).
- [x] Six to eight helper tests: ACTIVE filter; create body STUDENT-only; cap 30; search filter shape; attendance page defaults; duplicate account skipped when already active.

Stories: FR3.1–FR3.5, FR8.4 (members + account search + member attendances).

### Step 4. Member list + empty state, then tests

- [x] List screen: loads members; shows name/email (avatar optional via `publicAssetUrl`); empty successful load says no people yet and offers Add (`data-testid="add-member"`).
- [x] Failed load uses shared error screen, not empty copy.
- [x] Row opens attendance history (link/button with test id).
- [x] Six to eight list tests.

Stories: FR3.1, NFR2.

### Step 5. Add members (search + save), then tests

- [x] Add flow: search existing accounts; select up to 30 not already active; save once via `createClassroomMembers`; success refreshes list; server error shown, list unchanged.
- [x] Does not create logins. Role fixed to STUDENT (no TEACHER choice).
- [x] TanStack Form or controlled search consistent with U3 patterns; dirty leave if the add sheet/form collects pending selections.
- [x] Six to eight add/search tests including double-submit guard and already-member exclusion.

Stories: FR3.2, FR3.3, FR7.3 (field/search errors as applicable), FR7.4 (dirty leave if applicable).

### Step 6. Remove with named confirmation, then tests

- [x] Remove control opens confirmation that **names the person**; confirm calls `removeClassroomMember`; cancel leaves list unchanged.
- [x] Five to six remove tests.

Stories: FR3.4.

### Step 7. Attendance history, then tests

- [x] Member attendance page: paginated list in server order; next/prev or page controls; empty history copy; error screen on failure.
- [x] Back to members list.
- [x] Five to six history tests.

Stories: FR3.5.

### Step 8. Wire Members tab + routes; keep suite green

- [x] Members tab enabled and shows list; member route shows history inside the classroom shell (same AppShell/hero).
- [x] Auth gates stay on parent classroom routes.
- [x] Run unit-scoped vitest, then rely on Construction Verification Command at checkpoint.
- [x] Refresh `code-summary.md`, `source-manifest.json`, `traceability.json` after code exists.
- [x] No commit/push.

Stories: FR3.1–FR3.5, FR8.4, NFR2, NFR3 (compose U0 tokens only).

### Step 9. Traceability + summary

- [x] Write `traceability.json`, `code-summary.md`, `source-manifest.json` after implementation.

## Requirement map

| Requirement | Step |
|---|---|
| FR3.1 | Steps 3, 4, 8 |
| FR3.2 | Steps 3, 5 |
| FR3.3 | Steps 3, 5 |
| FR3.4 | Step 6 |
| FR3.5 | Steps 3, 7, 8 |
| FR7.3 | Step 5 |
| FR7.4 | Step 5 (if add form is dirty-leave capable) |
| FR8.4 | Steps 3, 5, 6, 7 (accounts query, members list/add/remove, member attendances) |
| NFR2 | Steps 4–8 |
| NFR3 | Steps 1, 8 (U0 tokens / shadcn only) |
| Member payment plans | Out of scope (U6) |
| TEACHER role / hire | Out of scope (requirements) |
