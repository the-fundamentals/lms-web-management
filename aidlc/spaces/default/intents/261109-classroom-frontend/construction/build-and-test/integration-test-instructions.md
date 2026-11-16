# Integration Test Instructions

Standard strategy: key boundary and cross-unit interaction tests. Runner is Vitest + jsdom + React Testing Library (DOM emulator, not a real browser).

## Framework

- Config: `vitest.config.ts` (`environment: "jsdom"`, `include: src/**/*.test.{ts,tsx}`)
- Alias: `@` → `src/`
- Generated SDK / network: stubbed in feature `*.integration.test.tsx` files

## How to run

Full suite (includes unit + integration):

```bash
npx vitest run
```

Feature-scoped integration filters used during units (examples):

```bash
npx vitest run src/features/auth --testNamePattern integration
npx vitest run src/features/classroom/components --testNamePattern integration
npx vitest run src/features/members
npx vitest run src/features/schedule
npx vitest run src/features/payment
npx vitest run src/shared/api/query-client.integration.test.ts
```

## Boundaries covered

| Boundary | Where |
|---|---|
| Auth session / profile gate → routes | `src/features/auth/**/*.integration.test.tsx` |
| Classroom list/create ↔ generated client | `src/features/classroom/**/*.integration.test.tsx` |
| Members ↔ accounts / membership APIs | `src/features/members/components/*.integration.test.tsx` |
| Schedule / attendance ↔ session APIs | `src/features/schedule/**/*.integration.test.tsx` |
| Payment / invoices ↔ plan & invoice APIs | `src/features/payment/**/*.integration.test.tsx` |
| Shared QueryClient ↔ generated hooks | `src/shared/api/query-client.integration.test.ts` |
| App shell nav (no Tools after U7 cancel) | `src/features/app-shell/**/*.test.tsx` |

## Cross-unit interactions (assembled app)

- Signed-in shell wraps feature routes; L1: features do not import each other; routes compose.
- Classroom layout tabs navigate to members / schedule / money / settings without importing those features.
- Shared API client + GMT+7 / VND helpers used across features.

## Expected coverage targets

- Express + Standard: keep suite green; no project-wide line-coverage floor.
- Integration files stay green under `npx vitest run`.
- Evidence environment: **jsdom** (DOM emulator). Not Chromium/Playwright.

## Test data

- Fixtures and SDK stubs live next to tests (`*-fixture.ts`, mocked `@/generated` modules).
- No live Cognito or API required for the suite.

## Out of scope here

- Real-browser E2E (no Playwright/Cypress in this intent; `performance-validation` / browser E2E not on the plan).
- Live Cognito login / real network.
