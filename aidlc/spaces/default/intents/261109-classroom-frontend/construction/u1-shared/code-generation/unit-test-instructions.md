# Unit Test Instructions: u1-shared

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the module they cover.

## How to run this unit

```bash
npx vitest run src/shared
```

That command is the one to use before the first test run. It covers only `src/shared`. It does not run tests from other units.

Layer commands, each scoped to this unit:

```bash
npx vitest run src/shared/api/token.test.ts src/shared/lib
npx vitest run src/shared/api/client.test.ts
npx vitest run src/shared/api/query-client.integration.test.ts
npx vitest run src/shared/ui
```

## Coverage

Five tests per module, 40 tests in total. No project-wide line-coverage threshold is set. This scope has no 80% floor. Build and Test does not apply one. A unit-scoped run is not a coverage gate.

## Modules and tests

**token.ts** (`token.test.ts`)

- set then get returns the token
- get before set returns empty
- clear removes the token
- a second set replaces the first
- the token value is not placed in a URL by this module

**gmt7.ts** (`gmt7.test.ts`)

- an instant is labeled GMT+7
- 00:00 UTC is 07:00 on the same calendar date
- 18:00 UTC is 01:00 on the next calendar date
- the offset stays +07:00 in June and in December
- `civilDateInGmt7` returns the GMT+7 calendar date

**text.ts** (`text.test.ts`)

- ASCII text is unchanged
- Vietnamese text with diacritics is unchanged
- an empty string stays empty
- leading and trailing spaces stay
- a string of only spaces stays

**screen-rules.ts** (`screen-rules.test.ts`)

- `fieldError` names the field
- `fieldError` keeps the other typed values
- `fieldError` on an empty name keeps the rest of the form
- `partialFailure` returns the loaded part
- `partialFailure` names the failed part and does not replace the loaded part with a total

**client.ts** (`client.test.ts`)

- the request uses `VITE_API_BASE_URL`
- a stored token is sent as `Authorization: Bearer`
- no token means no Authorization header
- the request aborts at 15 seconds
- the error string does not contain the token

**query-client.ts** (`query-client.integration.test.ts`)

- a query calls the configured client
- the query sends the bearer token
- the query aborts at 15 seconds
- a response after the abort is ignored
- a second query after `clearAccessToken` sends no bearer token

**loading-screen.tsx** (`loading-screen.test.tsx`)

- the screen says it is loading
- the loading text is present without relying on color
- the screen renders the shadcn `Skeleton`
- the screen uses a semantic color class and no hex value
- retry is not shown on the loading screen

**error-screen.tsx** (`error-screen.test.tsx`)

- the screen names what failed
- the screen offers a shadcn `Button` for retry
- retry calls the given function
- the failure text is present without relying on color
- the screen renders the shadcn `Alert` and uses no hex value

## Mocks

Stub `fetch`. Do not call the real server and do not call Cognito. Set and clear the in-memory token in `beforeEach`. Set `VITE_API_BASE_URL` in the test to `http://api.test`.

## Test data

Use a fixed instant, `2026-01-15T18:00:00Z`, for the GMT+7 date change. Use the name `Nguyễn` when checking that text is unchanged. Use the token string `test-token` and assert it never appears in an error message.
