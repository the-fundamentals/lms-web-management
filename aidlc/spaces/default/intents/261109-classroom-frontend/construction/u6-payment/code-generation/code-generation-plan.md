# Code Generation Plan: u6-payment

## Summary

- Builds: Money = **invoices** home + pricing summary/gear; Pricing edit page; classroom **Settings** (rename + pricing link); invoice lifecycle.
- Touches: `src/features/payment/`, `classroom-layout`, `classroom-settings`, money + settings routes.
- Does **not** call `generateClassroomInvoices` or show a Generate control (FR5.5, FR8.3). Does not mark session attendance (U5) or Tools (U7). Attendance tab stays disabled.
- Tests: vitest under `src/features/payment/` (helpers + pricing/invoice UI + integration).

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

`u6-payment` is FR5.1–FR5.8 (and FR8.3 / FR8.4 invoice paths) for one classroom: Money shows whole VND (0 = Free), sets classroom base per-session price, sets a student's current per-session price (immediate; no future start), lists invoices the server already created, creates an adhoc draft for a student with at least one line, and transitions draft→Approved, approved→Completed (paid amount + method), draft/approved→Cancelled with named confirmation. Paid or cancelled invoices are read-only.

Features do not import each other. U3's classroom layout hosts the Money tab and `<Outlet />`. U6 fills child routes under `/classrooms/$classroomId/money/`. Classroom never imports `@/features/payment`. Members list is loaded via SDK in payment helpers (same pattern as schedule) — **no** import of `@/features/members`.

OpenAPI ops: `setClassroomBasePaymentPlan`, `getClassroomById` (read `basePaymentPlanAmount` / type), `getAllClassroomPaymentPlans` / `getClassroomMemberPaymentPlans`, `createClassroomMemberPaymentPlan`, `queryClassroomInvoices`, `getClassroomInvoiceById`, `createClassroomInvoiceAdhoc`, `updateClassroomInvoice` (draft edits if needed), `approveClassroomInvoice`, `completeClassroomInvoice`, `cancelClassroomInvoice`. Never call `generateClassroomInvoices`. Reuse `getAllClassroomMembers` via SDK for student pickers.

Money rules: integer VND only (API int64 smallest unit = 1 đồng); label **VND**; amount `0` displays as **Free**; no floating point for money; no currency switcher.

## Steps

Test-after. No data-model or repository layer.

### Step 1. Project structure

- [ ] Add `src/features/payment/components/` and `src/features/payment/lib/`.
- [ ] Thin routes (auth + AppShell already on `$classroomId` layout):
  - `src/routes/classrooms/$classroomId/money/index.tsx` — Money home (prices + invoice list).
  - `src/routes/classrooms/$classroomId/money/invoices/new.tsx` — New invoice.
  - `src/routes/classrooms/$classroomId/money/invoices/$invoiceId.tsx` — invoice detail + status actions.
- [ ] Enable **Money** tab in `classroom-layout.tsx`: navigate to `/classrooms/$classroomId/money` like Sessions/Members; select tab from pathname; leave Attendance disabled.
- [ ] ESLint zone: `src/features/payment` must not import other features (and peers must not import payment).

Stories: FR5.1–FR5.2, FR5.5, FR5.8 (routes + shell).

### Step 2. Test runner

- [ ] Vitest already installed. Record unit-scoped command in `unit-test-instructions.md`.
- [ ] Stub generated SDK / do not call real API.

Stories: none.

### Step 3. Money helpers + VND formatting, then tests

- [ ] `formatVnd(amount: number): string` — whole number with VND label; `0` → `Free` (FR5.1).
- [ ] Classroom price: wrap `setClassroomBasePaymentPlan` with body `{ amount, type?: "PER_SESSION" }`; map classroom response amounts.
- [ ] Student price: list current plans (`getClassroomMemberPaymentPlans` / classroom-wide list); create via `createClassroomMemberPaymentPlan` (`PER_SESSION` + amount); missing current plan → treat as 0 VND for display (FR5.4), never copy classroom base onto the student in the UI.
- [ ] Invoices: `queryClassroomInvoices` with classroom-scoped filter (page/size); map status DRAFT|APPROVED|COMPLETED|CANCELLED and type GENERATED|ADHOC.
- [ ] Create adhoc: `createClassroomInvoiceAdhoc` with `memberId` + ≥1 lines; double-submit guard.
- [ ] Lifecycle: `approveClassroomInvoice`, `completeClassroomInvoice` (`paidAmount`, `paymentMethod` BANK|CASH|OTHER), `cancelClassroomInvoice`.
- [ ] Six to eight helper tests: VND/Free; set base body; student price create; missing price = 0; query filter defaults; create requires lines; complete body methods; never expose generate op.

Stories: FR5.1–FR5.7, FR8.4 (payment + invoice ops).

### Step 4. Money home — classroom price + student prices, then tests

- [ ] Classroom per-session price editor: whole VND input; save; shows Free when 0 (`data-testid`s for amount + save).
- [ ] Student price list/editor for ACTIVE students: current amount or Free; save applies immediately (no future start date control).
- [ ] Failed load uses shared error screen; successful empty students still shows classroom price.
- [ ] Six to eight UI tests.

Stories: FR5.2–FR5.4, FR7.1, FR7.3.

### Step 5. Invoice list + empty state, then tests

- [ ] List invoices for the classroom (drafts included); status badges; row opens detail.
- [ ] Empty successful load: no invoices copy + New invoice (`data-testid="new-invoice"`). Distinct from failed load (FR5.8, FR7.1).
- [ ] No Generate button anywhere (FR5.5, FR8.3).
- [ ] Five to eight list tests.

Stories: FR5.5, FR5.8, FR8.3.

### Step 6. New invoice + detail lifecycle, then tests

- [ ] New invoice: pick student, ≥1 line (kind/amount/note as schema allows), create once; double-submit ignored; opens detail on success (FR5.6).
- [ ] Detail: show totals in VND/Free; draft → Approve; approved → Mark paid (amount + Bank|Cash|Other); draft/approved → Cancel with confirmation naming the invoice/student; COMPLETED/CANCELLED read-only (FR5.7).
- [ ] Dirty leave guard on New invoice form (FR7.4).
- [ ] Six to eight UI tests + confirmation naming.

Stories: FR5.6–FR5.7, FR7.3–FR7.4.

### Step 7. Integration + docs

- [ ] Integration: set classroom price → reload shows amount; create adhoc → appears in list; approve → paid → status COMPLETED; tokens never in document.
- [ ] `code-summary.md`, `traceability.json`, `source-manifest.json` after implementation (Step 5 of stage protocol).

Stories: FR5.2, FR5.6–FR5.7, FR8.4.

### Step 8. Money = invoices + Settings hub (checkpoint feedback)

- [ ] Money default: invoice list; tiny pricing summary (classroom default) + gear → `/money/pricing`.
- [ ] Pricing edit page: classroom default + student overrides (badges); Back → invoices.
- [ ] Classroom **Settings** tab (`/settings`): rename + link to pricing (URL only; L1).
- [ ] Overview no longer hosts rename.
- [ ] Tests updated.

Stories: FR5.2–FR5.5, FR5.8.

## Out of scope for this unit

- `generateClassroomInvoices` / any Generate UI (server monthly job only).
- Session attendance marking (U5), Tools (U7), classroom Attendance tab.
- Non-VND currencies, floating-point money, TEACHER hire flows.
