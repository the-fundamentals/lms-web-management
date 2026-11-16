# Code Generation Plan: u8-app

## Summary

- Builds: Finalize **app shell ownership** — providers, root/route tree, sidebar + account footer (Sign out), DEV Query/Router/Form tools. No Tools menu (U7 cancelled).
- Touches: `src/main.tsx`, `src/routes/__root.tsx`, `src/routeTree.gen.ts`, `src/features/app-shell/`, `src/devtools/` (confirm/own; gap-fill tests only where missing).
- Tests: vitest under `src/features/app-shell/` (+ thin main/devtools smoke if needed).

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

`u8-app` owns the application roof: `main.tsx` (QueryClient + Auth + Router + DEV-only TanStack Devtools host), `__root.tsx`, generated `routeTree.gen.ts`, and the signed-in chrome (`AppShell`, sidebar Overview/Classrooms/New classroom, account footer with profile + Sign out). Sign-in and onboarding stay outside that chrome (no sidebar).

Much of this already shipped with earlier units (walking skeleton / U2–U3). This unit **finalizes ownership**: confirm the wiring, close test gaps, document the tree. **Do not** add a Tools account-menu entry or a `/tools` route — U7 was cancelled; FR8.1 stays deferred.

There is no separate `_authenticated` route file today: signed-in pages wrap `AppShell` locally. Keep that pattern unless a thin shared wrapper is required for a real bug; do not invent a large route-tree refactor for its own sake.

## Steps

Test-after. No data-model / repository / API layers beyond wiring that already exists.

### Step 1. Project structure — inventory & ownership

- [x] Confirm paths owned by this unit: `src/main.tsx`, `src/routes/__root.tsx`, `src/routeTree.gen.ts`, `src/features/app-shell/**`, `src/devtools/**`.
- [x] Confirm sign-in / onboarding routes render without AppShell/sidebar.
- [x] Confirm no Tools nav item and no tools route file (U7 cancelled).
- [x] List any missing smoke coverage in `source-manifest.json` only for files this unit creates or edits now.

Stories: FR1.3 (Sign out surface), FR2.1 (Overview + Classrooms entries), FR7.1 (shell loading/error), NFR1.

### Step 2. Test runner

- [x] Unit-scoped command: `npx vitest run src/features/app-shell` (add `src/devtools` only if new tests land there).
- [x] Record in `unit-test-instructions.md`.

### Step 3. Business / shell helpers (gap-fill only)

- [x] Keep `shell-user` / `shell-profile` / `header-trail` as-is unless a failing test forces a fix.
- [x] Tests already present stay green; add only for uncovered FR paths (e.g. sidebar links Overview/Classrooms/New classroom; Sign out; profile unavailable degradation).

Stories: FR1.3, FR2.1, FR7.1.

### Step 4. Frontend — AppShell / sidebar / header

- [x] No new Tools control on `NavUser`.
- [x] Sidebar remains Overview + Classrooms + New classroom (not Tools).
- [x] Extend tests if gaps: `data-testid` coverage for sidebar links and Sign out already expected by existing tests — fill missing cases only.

Stories: FR1.3, FR2.1, FR8.1 deferred.

### Step 5. Providers + DEV tools

- [x] Keep `DevtoolsHost` DEV-only dynamic import in `main.tsx` (production tree must not include TanStack Devtools).
- [x] Cognito env missing still shows ErrorScreen (existing).
- [x] Optional: one smoke test or documented assertion that DEV host is gated by `import.meta.env.DEV` — no production-only change.

Stories: unit roof / NFR tooling note from scope.

### Step 6. Route tree

- [x] Regenerate `routeTree.gen.ts` only if a route file is added/removed in this unit (expect: none).
- [x] Do not add `src/routes/tools/`.

### Step 7. Documentation and traceability

- [x] `code-summary.md`, `traceability.json` (FR8.1 Deferred; shell FRs OK), `source-manifest.json`.
- [x] Tick plan checkboxes as steps finish.

## Out of scope

- Tools screen / Generate sessions (U7 cancelled).
- Feature screens (classroom, members, schedule, payment) beyond shell chrome.
- Cognito protocol implementation (U2).
- Design-system tokens (U0) / shared client (U1).
