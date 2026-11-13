# Code Generation Plan: u3-classroom

## Summary

- Builds: classroom list, create, rename, classroom layout (name + outlet), and AppShell. Sessions stay out; U5 fills the outlet later.
- **Revision (Request Changes):** AppShell sidebar; **Overview** at `/` (live classroom/member counts from the list query — no fake sample KPIs) vs **Classrooms** at `/classrooms` (search + List/Card/Table-disabled); create accepts name + optional banner + optional payment; brand The Fundamentals / Management; TanStack Form; pinned chrome.
- Touches: `src/features/classroom/`, `src/features/app-shell/`, `src/routes/index.tsx`, `src/routes/classrooms/`, shadcn UI under `src/components/ui/`.
- Tests: classroom + app-shell vitest coverage.

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

`u3-classroom` is the classroom list, create, and rename, plus AppShell. Signed-in `/` is **Overview** (live counts from the classroom query). The live list is **`/classrooms`**. Create may set optional `bannerKey` and optional `basePaymentPlan` (person Request Changes — create all fields). The classroom layout shows name + outlet; sessions stay U5.

There is no functional design, NFR design, or infrastructure design for this unit. The work comes from `unit-of-work.md`, the U3 rows in `unit-of-work-story-map.md`, `components.md` Classrooms, and `requirements.md` FR1.1, FR1.2 (landing on the list after a known profile), FR2.1–FR2.6, FR7.3/FR7.4 as they apply to this unit's forms, FR8.4's classroom list/create/get/update, and NFR2 / NFR3.

No database and no repository. Those layers are omitted. Classroom calls use the generated client already in `src/generated` (`getAllClassrooms`, `createClassroom`, `getClassroomById`, `updateClassroom`). This unit depends on `u0-design-system` and `u1-shared`. Features do not import each other: the route wires auth (gate + sign-out + profile display) with `app-shell` and `classroom`. Keep shadcn in `src/components/ui` and helpers in `src/shared/lib`.

Brought files stay as they are: `.gitignore`, `AGENTS.md`, `README.md`, `mise.toml`, `openapi.yml`.

## Steps

Test-after. Each applicable layer is implemented, then its tests are written and run, before the next layer. No data-model or repository layer.

### Step 1. Project structure

- [ ] Add `src/features/classroom/components/` and `src/features/classroom/lib/`.
- [ ] Route files under `src/routes/` stay thin (URL → screen only):
  - `index.tsx` — `/` Overview (live counts); list is `/classrooms` (replaces `HomePlaceholder`).
  - `classrooms/index.tsx` — `/classrooms` wires the classroom list.
  - `classrooms/new.tsx` — `/classrooms/new` wires create.
  - `classrooms/$classroomId/route.tsx` — layout: classroom name + `<Outlet />` (no sessions).
  - `classrooms/$classroomId/index.tsx` — empty child so the outlet is not blank until U5; a short "sessions come next" placeholder is fine. Do not fetch or render sessions.
- [ ] Remove `src/features/auth/components/home-placeholder.tsx` once `/` no longer imports it. Do not change other auth modules.
- [ ] Add any missing shadcn pieces this unit needs (`dialog`, `form`, or similar) with `npx shadcn@latest add …` into `src/components/ui` only. Do not add a second component folder or palette.
- [ ] Keep TypeScript at `6.0.3`.

Stories: FR2.1, FR2.5 (name + outlet only).

### Step 2. Test runner

- [ ] Vitest, jsdom, and React Testing Library are already installed. Do not add a second runner and do not set a coverage threshold.
- [ ] Record the unit-scoped command in `unit-test-instructions.md`. Tests stub the generated client / `fetch`. They do not call the real API.

Stories: none.

### Step 3. Classroom API helpers, then their tests

- [ ] `lib/` helpers wrap the generated SDK: list via `getAllClassrooms` (POST `/admin/classrooms/query` with a filter body; default page/size as the schema allows), create via `createClassroom` with `name` plus optional `bannerKey` / `basePaymentPlan`, get via `getClassroomById`, rename via `updateClassroom` with `{ name }` only.
- [ ] Name validation in `lib/`: trim; empty or whitespace-only is invalid; length 1–255. Use `fieldError` from `src/shared/lib/screen-rules` so the message names the field and values are kept.
- [ ] Helper tests: name validation; create body shapes (name-only and with optional fields); list query shape; duplicate names stay two rows.

Stories: FR2.3, FR2.4, FR2.6, FR8.4.

### Step 4. List and empty state, then their tests

- [ ] Classroom list screen: loads classrooms through the helpers; shows each row by id and name; opening a row navigates to `/classrooms/$classroomId`. Empty successful load says there are none and offers New classroom (`data-testid="new-classroom"`), distinct from a failed load (use shared loading/error screens from `src/shared/ui`).
- [ ] List route is `/classrooms`. Overview `/` shows live counts (Step 10).
- [ ] List tests: empty/error; rows; search `like`; List/Card views; Table disabled; New classroom `data-testid="new-classroom"`.

Stories: FR1.1, FR1.2, FR2.1, FR2.2, NFR2.

### Step 5. Create and rename screens, then their tests

- [ ] Create screen: TanStack Form; name required; optional banner upload (landing-zone → `bannerKey`); optional collapsed payment (`basePaymentPlan`); double-submit guard; success navigates to `/classrooms`. Dirty leave asks before navigating away.
- [ ] Rename: edit name and save with `updateClassroom`. Success updates heading/list. Same empty-name and dirty-leave rules. Double-submit guard.
- [ ] Create/rename tests including double-submit and field-error naming.

Stories: FR2.3, FR2.4, FR2.6, FR7.3, FR7.4, NFR2, NFR5 (via shared screens where load/save fails).

### Step 6. Classroom layout, then its tests

- [ ] Layout loads the classroom by id; tabbed shell: Overview (banner + meta + rename), Sessions (`<Outlet />` for U5), Members/Attendance/Finances disabled. Breadcrumb leaf = classroom name via route `onTitleChange`. Missing classroom uses the shared error screen.
- [ ] Layout tests: name; banner/meta; outlet mounted; disabled later tabs; breadcrumb callback; 404; rename; All classrooms → `/classrooms`.

Stories: FR2.5 (U3 half), FR2.6.

### Step 7. Integration tests at the client boundary

- [ ] Three integration tests with stubbed fetch/SDK: empty list renders the empty state; create posts `{ name }` and returns to the list with the new row; rename puts the new name and both layout and list show it. Tokens and secrets never appear in the document.

Stories: FR2.2, FR2.3, FR2.6, FR8.4.

### Step 8. Wire routes and keep the suite green

- [ ] Point `src/routes/index.tsx` at Overview; `src/routes/classrooms/index.tsx` at the list. Regenerate `src/routeTree.gen.ts` via the existing Vite plugin (do not hand-edit).
- [ ] Auth sign-in / onboarding / profile gate stay working; after a known profile, `/` is Overview and Classrooms nav opens `/classrooms`.
- [ ] Add an import-boundary lint zone so `src/features/classroom` cannot import other features (same pattern as auth ↔ classroom in the architecture skill).
- [ ] Run the unit-scoped vitest command, then `npx vitest run && npx vite build`.

Stories: FR1.1, FR1.2, FR2.1.

### Step 9. Traceability

- [ ] Write `traceability.json` after the code exists.
- [ ] Write `code-summary.md` and `source-manifest.json`.

### Step 11. Classroom list search + views (Request Changes) — NEW

Person rejected unit Approve: classroom list needs OpenAPI name `like` search, richer row/card data (status, members, plan, created, banner), and a views selector (List, Card, Table disabled for now).

- [ ] `classroomListFilter(search)` builds `ClassroomFilter` with `filters:[{field:"name",operator:"like",value}]` when non-blank.
- [ ] List UI: debounced search input; List/Card layouts; Table control present but disabled.
- [ ] Rows/cards show more than name; empty search copy differs from empty list.

### Step 10. Dashboard AppShell (Request Changes) — NEW

Person rejected unit Approve: `/` must be a **dashboard with sidebar**, similar to [shadcn blocks dashboard-01](https://ui.shadcn.com/blocks). Later Request Changes split **Overview** (`/`) from **Classrooms** (`/classrooms`).

- [ ] AppShell (`src/features/app-shell/`): sidebar brand The Fundamentals / Management; Overview → `/`; Classrooms → `/classrooms`; New classroom → `/classrooms/new`; profile + Sign out; pinned chrome (no collapse).
- [ ] Overview main: live classroom count + member total from the list query (route fetches; shell receives props — no feature↔feature import). Sessions card is explicit later (`—`), not fake %.
- [ ] Wrap signed-in classroom routes in AppShell.
- [ ] App-shell + route tests; refresh summary/manifest/traceability.
- [ ] No commit/push.

Stories: FR1.1 (Overview after known profile), FR1.2, FR2.1 (Classrooms nav → list), FR2.2, NFR2, NFR3 (U0 tokens).

## Requirement map

| Requirement | Step |
|---|---|
| FR1.1 | Steps 8 and 10. Known profile lands on Overview at `/`. |
| FR1.2 | Steps 8 and 10. After name save, home is Overview. |
| FR2.1 | Steps 1, 4, 8, 10, and 11. Classrooms nav → `/classrooms` list with search/views. |
| FR2.2 | Steps 4, 7, 10, and 11 |
| FR2.3 | Steps 3, 5, and 7 (create may include optional banner/payment) |
| FR2.4 | Steps 3 and 5 |
| FR2.5 | Steps 1 and 6. Name + outlet only; sessions are U5. |
| FR2.6 | Steps 3, 5, 6, and 7 |
| FR7.3 | Step 5 (create/rename field errors) |
| FR7.4 | Step 5 (dirty leave on create/rename; 401 unsaved latch deferred to shared/U8) |
| FR8.4 | Steps 3 and 7. List, create, get, update classrooms. |
| NFR2 | Steps 4, 5, 6, and 10 |
| NFR3 | Steps 1 and 10. Compose design-system / shadcn sidebar; U0 tokens only. |
| NFR5 | Step 5. Failed loads use shared error screen. |
| NFR1 | Not this unit. 1280px check is U8. |
| Classroom banner / price on create | In scope for create form (person Request Changes); Money unit may refine later. |
