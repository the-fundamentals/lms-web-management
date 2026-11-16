# Code Generation Plan: u7-tools

## Summary

- Builds: **Nothing** — Tools / session-generation helper cancelled (not needed).
- Touches: unit record artifacts only (no `src/features/tools`, no Tools route, no NavUser link).
- Tests: none for this unit (cancelled).

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

`u7-tools` was the detachable Tools screen (FR8.1–FR8.3): account-area entry, local-only Generate sessions from weekly recurrence, no invoice generation. **The person cancelled this unit** — Tools is not needed for this piece of work. No application code ships.

FR8.1–FR8.3 remain deferred / unmet by this frontend for now. U8 still depends on a tools route only if one exists; with Tools cancelled, U8 must not require a Tools menu entry or tools route file.

## Steps

### Step 1. Cancel Tools (requested change)

- [ ] Do **not** create `src/features/tools/`.
- [ ] Do **not** create a Tools route under `src/routes/`.
- [ ] Do **not** add a Tools link on `NavUser` / account footer.
- [ ] Do **not** call `generateClassroomSessionsFromRecurrence` or `generateClassroomInvoices` from any new UI.
- [ ] Record the cancel in `code-summary.md` and an empty `source-manifest.json` (`writes: []`).
- [ ] `traceability.json` maps FR8.1–FR8.3 to **cancelled / deferred** for this unit.

Stories: person Request Changes — skip/cancel Tools.

### Step 2. Documentation handoff

- [ ] Write `code-summary.md` stating cancel + no app files.
- [ ] Write `traceability.json` and `source-manifest.json`.
- [ ] Tick the checkboxes above when those record files exist.

## Out of scope (still)

- Building Tools later in another intent.
- TanStack Query/Router Devtools (`src/devtools/`) — already owned elsewhere; unchanged.
- U8 app shell beyond acknowledging no Tools entry is required from this unit.
