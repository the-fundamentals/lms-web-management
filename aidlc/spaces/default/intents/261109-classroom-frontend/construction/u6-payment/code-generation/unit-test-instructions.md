# Unit Test Instructions: u6-payment

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the module they cover under `src/features/payment/` (`lib/`, `components/`). Route files under `src/routes/` hold no tests.

The generated client is stubbed. Tests do not call the real API and do not require Cognito.

## How to run this unit

```bash
npx vitest run src/features/payment
```

That command covers only this unit. Classroom layout / Money tab wiring regressions stay under `src/features/classroom` (extend only when wiring needs a regression).

Layer commands:

```bash
npx vitest run src/features/payment/lib
npx vitest run src/features/payment/components
```

Verification for the unit checkpoint (intent-wide):

```bash
npx vitest run && npx vite build
```

## Coverage

Five to eight tests per module: VND helpers, payment API helpers, Money home (prices), invoice list, new invoice, invoice detail/lifecycle. About 36–48 unit tests plus 2–3 integration tests at the generated-client boundary. No project-wide line-coverage threshold on the unit-scoped command; Build and Test runs the full suite.

## Modules and tests

**vnd / payment helpers** (`src/features/payment/lib/`)

- format whole VND; `0` → Free
- set classroom base body (`PER_SESSION` + amount)
- student current plan create; missing plan displays as 0
- invoice query defaults; adhoc create requires member + lines
- complete body: paidAmount + BANK|CASH|OTHER
- helpers never call generate invoices

**money-pricing (Settings → Pricing)**

- save classroom price; Free when 0
- student price save applies immediately (no future start UI)
- failed load uses shared error screen
- no invoice list on pricing page; Back → Settings
- student badges: No plan / Matches default / Custom

**invoice-list (Money home)**

- pricing summary + gear → `/settings/pricing`
- empty state + New invoice (`data-testid="new-invoice"`)
- failed load ≠ empty
- no Generate control in the document
- row opens detail

**invoice-create**

- posts create once; double-submit guard
- requires ≥1 line
- dirty leave confirmation

**invoice-detail**

- approve draft; mark paid with method; cancel confirmation names invoice
- COMPLETED/CANCELLED actions hidden/disabled

**integration**

- set price → list/detail reflects amount
- create adhoc → approve → complete
- tokens never appear in the document

## Mocking

Stub `@/generated/sdk.gen` (or feature `lib` wrappers). Do not hit LocalStack or Cognito in unit tests.
