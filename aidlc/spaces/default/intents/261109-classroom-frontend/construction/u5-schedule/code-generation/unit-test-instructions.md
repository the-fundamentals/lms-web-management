# Unit Test Instructions: u5-schedule

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the module they cover under `src/features/schedule/` (`lib/`, `components/`). Route files under `src/routes/` hold no tests.

The generated client is stubbed. Tests do not call the real API and do not require Cognito.

## How to run this unit

```bash
npx vitest run src/features/schedule
```

That command covers only this unit. Classroom layout / Sessions outlet regressions stay under `src/features/classroom` (extend only when wiring needs a regression).

Layer commands:

```bash
npx vitest run src/features/schedule/lib
npx vitest run src/features/schedule/components
```

Verification for the unit checkpoint (intent-wide):

```bash
npx vitest run && npx vite build
```

## Coverage

Five to eight tests per module: helpers, overview, calendar, weekly, new session, attendance/lifecycle. About 40–55 unit tests plus 2–4 integration tests at the generated-client boundary. No project-wide line-coverage threshold on the unit-scoped command; Build and Test runs the full suite.

## Modules and tests

**session / gmt7 helpers** (`src/features/schedule/lib/`)

- overview bucketing Upcoming / Active / Past, ≤10, sort by start then id
- GMT+7 labels on displayed times
- midnight-crossing session on start civil date; end shows next date when needed
- create adhoc body shape
- weekly recurrence create body (`WEEKLY` + `byDays`)
- attendance save sends status only

**session-overview**

- empty state + New session (`data-testid="new-session"`)
- failed load uses shared error screen
- groups render; row opens session detail

**session-calendar**

- month grid in GMT+7; sessions on start date
- prev/next month

**weekly-schedule**

- list / save / delete recurrence
- save does not invent session rows
- dirty leave + double-submit guard

**session-create**

- posts create once; double-submit guard
- server error leaves prior state

**session-attendance**

- Present/Absent while OPEN; locked when completed/cancelled
- learning-note footnote present
- complete/cancel confirmation names the session

**integration**

- create session → appears on overview
- mark attendance → status persists on reload stub
- tokens never appear in the document

## Mocking

Stub `@/generated/sdk.gen` (or schedule helpers' SDK imports). Stub TanStack Router `Link` / `useNavigate` / `useParams` as needed. Do not hit Cognito or the network. Do not import `@/features/members` from schedule tests that exercise production boundaries — stub members list via SDK when attendance needs student rows.
