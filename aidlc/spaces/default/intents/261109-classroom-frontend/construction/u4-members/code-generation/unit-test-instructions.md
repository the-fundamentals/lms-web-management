# Unit Test Instructions: u4-members

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the module they cover under `src/features/members/` (`lib/`, `components/`). Route files under `src/routes/` hold no tests.

The generated client is stubbed. Tests do not call the real API and do not require Cognito.

## How to run this unit

```bash
npx vitest run src/features/members
```

That command covers only this unit. Classroom layout changes that enable the Members tab stay covered by existing `src/features/classroom` tests (extend those only when the tab wiring needs a regression).

Layer commands:

```bash
npx vitest run src/features/members/lib
npx vitest run src/features/members/components
```

Verification for the unit checkpoint (intent-wide):

```bash
npx vitest run && npx vite build
```

## Coverage

Five to eight tests per module: helpers, list, add/search, remove confirmation, attendance history. About 28–36 unit tests plus 2–3 integration tests at the generated-client boundary. No project-wide line-coverage threshold.

## Modules and tests

**member-api / filters** (`src/features/members/lib/`)

- ACTIVE-only mapping for the people list
- create body uses `STUDENT` and ≤30 members
- already-active accounts are not re-queued for add
- account search filter uses OpenAPI `like` on allowed fields
- attendance query defaults page/size

**member-list**

- empty state copy and Add control (`data-testid="add-member"`)
- failed load uses shared error screen
- active rows render; REMOVED not shown
- row opens attendance history

**member-add**

- search results from accounts query
- save posts createClassroomMembers once
- double-submit guard
- server error leaves prior list

**member-remove**

- confirmation names the person
- confirm removes; cancel does not call remove

**member-attendance**

- paginated rows
- empty history copy
- error path
- back to members

**integration**

- list → add → list includes new student
- remove with named confirm clears them from ACTIVE list
- tokens never appear in the document

## Mocking

Stub `@/generated/sdk.gen` (or the members helpers' SDK imports). Stub TanStack Router `Link` / `useNavigate` / `useParams` as needed. Do not hit Cognito or the network.
