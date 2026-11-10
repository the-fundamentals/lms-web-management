# Code Generation Plan: u1-shared

## Summary

- Builds: the shared API client, GMT+7 formatting, and loading and error screens made from shadcn components
- Touches: `src/shared/`, `vitest.config.ts`, and `package.json`
- Tests: 40 unit and integration tests, 5 per module, under `src/shared/`

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

`u1-shared` is the library the route units import. It does not render a route and it does not import a route unit. There is no functional design, NFR design, or infrastructure design for this unit. The work comes from `unit-of-work.md`, the U1 rows in `unit-of-work-story-map.md`, and `requirements.md`.

No database and no repository we own. Those two layers are omitted. The generated client in `src/generated` is the API layer. Session clock times stay a calendar date plus a clock time in the schedule unit. This unit converts instants only.

The sign-in screen is the auth unit. This unit only stores the token that screen will write, and clears it when that screen signs out.

Colors, type, spacing, radius, Tailwind CSS, shadcn/ui, and the Vite React app belong to `u0-design-system`, not this unit. This unit imports `Skeleton`, `Alert`, and `Button` from `src/components/ui`. That path is shadcn's default, so the component library stays in one folder. This unit does not add a palette, a padding value, a Tailwind config, or a bundler.

Cognito sign-in belongs to `u2-auth`. That unit uses react-oidc-context. This unit only stores the access token that library obtained and sends it as the bearer token. It does not talk to Cognito.

## Steps

Test-after. Each layer is implemented, then its tests are written and run, before the next layer.

### Step 1. Project structure

- [x] Add `react` and `react-dom` if the design-system unit has not already added them.
- [x] Add `src/shared/api/`, `src/shared/lib/`, and `src/shared/ui/`.
- [x] Leave Tailwind, shadcn, `src/components/ui/`, `src/routes/`, and `src/main.tsx` to their own units.
- [x] Read the base URL from `VITE_API_BASE_URL`. No secret in the repo.

Stories: none. This step only makes the later steps possible.

### Step 2. Test runner

- [x] Add Vitest, jsdom, and React Testing Library.
- [x] Add `vitest.config.ts` with `environment: "jsdom"` and `include: ["src/shared/**/*.test.ts", "src/shared/**/*.test.tsx"]`.
- [x] The unit command is `npx vitest run src/shared`.
- [x] Do not set a project-wide coverage threshold. This scope has no line-coverage floor. Build and Test does not apply an 80% floor here.

Stories: none.

### Step 3. Business logic, then its tests

Implement, then write and run 5 tests per module.

- [x] `src/shared/api/token.ts`. In-memory token. `setAccessToken`, `clearAccessToken`, `getAccessToken`. Empty after clear. Never written into a URL or an error string.
- [x] `src/shared/lib/gmt7.ts`. Format an instant as GMT+7 and label it GMT+7. `civilDateInGmt7` returns the calendar date of an instant in GMT+7. It does not convert a session clock time.
- [x] `src/shared/lib/text.ts`. Return teacher-entered text unchanged, including Vietnamese characters.
- [x] `src/shared/lib/screen-rules.ts`. `fieldError` names a field and does not clear the other values. `partialFailure` keeps the loaded part and names the failed part.
- [x] Tests: `token.test.ts`, `gmt7.test.ts`, `text.test.ts`, `screen-rules.test.ts`. Five tests each. Run `npx vitest run src/shared/api/token.test.ts src/shared/lib`.

Stories: FR6.1, FR6.2 (the instant's calendar date only), FR7.3, FR7.5, NFR4, NFR5.

### Step 4. API client, then its tests

- [x] Configure the generated `client` in `src/generated/client.gen.ts` from `src/shared/api/client.ts`.
- [x] Set the base URL, send `Authorization: Bearer <token>` when a token is stored, and abort the request after 15 seconds.
- [x] A response that arrives after the abort is ignored.
- [x] An error message does not include the token.
- [x] A request body is sent unchanged, including Vietnamese text.
- [x] Five tests in `src/shared/api/client.test.ts`, with `fetch` stubbed. Run `npx vitest run src/shared/api/client.test.ts`.

Stories: FR7.2, NFR4, NFR5.

### Step 5. Query client boundary, then its tests

- [x] Export a TanStack Query client from `src/shared/api/query-client.ts` that calls the configured client.
- [x] Five integration tests in `src/shared/api/query-client.integration.test.ts`. They stub `fetch` and check that a query uses the bearer token, aborts at 15 seconds, and ignores the late response. Run `npx vitest run src/shared/api/query-client.integration.test.ts`.

Stories: FR7.2.

### Step 6. Screens, then their tests

- [x] `src/shared/ui/loading-screen.tsx`. Compose shadcn `Skeleton` with visible text that the screen is loading. Status is not color alone. Use semantic color classes only.
- [x] `src/shared/ui/error-screen.tsx`. Compose shadcn `Alert` for the failure text and shadcn `Button` for retry. Use semantic color classes only.
- [x] Five tests each in `loading-screen.test.tsx` and `error-screen.test.tsx`. Run `npx vitest run src/shared/ui`.

Stories: FR7.1, NFR2. NFR3 and NFR6 are `u0-design-system`.

### Step 7. Traceability

- [x] Write `traceability.json` for this unit after the code exists. Each U1 requirement points at the module above.
- [x] Write `code-summary.md`.

## Requirement map

| Requirement | Step |
|---|---|
| FR6.1 | Step 3 |
| FR6.2 | Step 3, instant calendar date only |
| FR7.1 | Step 6 |
| FR7.2 | Steps 4 and 5 |
| FR7.3 | Step 3, `fieldError` only. The forms live in later units. |
| FR7.5 | Step 3, `partialFailure` only. The lists live in later units. |
| NFR2 | Step 6 |
| NFR3 | Not this unit. `u0-design-system` owns the palette, type scale, and spacing scale. |
| NFR4 | Steps 3 and 4 |
| NFR5 | Steps 3 and 4 |
| NFR6 | Not this unit. `u0-design-system` installs Tailwind CSS and shadcn/ui. |
| NFR7 | Not this unit. `u0-design-system` creates the Vite React app. |
| FR1.6 | Not this unit. `u2-auth` uses react-oidc-context for Cognito. |
