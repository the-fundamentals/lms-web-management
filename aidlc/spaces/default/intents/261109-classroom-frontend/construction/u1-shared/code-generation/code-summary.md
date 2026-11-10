# Code Summary: u1-shared

## Files created/modified

Created under `src/shared/`:

- `api/base-url.ts` reads `VITE_API_BASE_URL`. No secret is stored.
- `api/token.ts` keeps the access token in memory.
- `api/client.ts` configures the generated `client` from `src/generated/client.gen.ts`: base URL, bearer header, 15 second abort, token stripped from error text, request body left as serialized.
- `api/query-client.ts` exports a TanStack Query client with no default query function. Generated hooks pass their own function, return only the response body, and call POST list operations themselves.
- `lib/gmt7.ts` formats instants as GMT+7. `civilDateInGmt7` returns the GMT+7 calendar date. `instantFromGmt7` converts a GMT+7 civil date and clock time back to a UTC instant for fields the server stores as instants. Session and weekly clock times stay civil values in the schedule unit.
- `lib/text.ts` returns teacher-entered text unchanged.
- `lib/screen-rules.ts` provides `fieldError` and `partialFailure`.
- `ui/loading-screen.tsx` and `ui/error-screen.tsx` compose shadcn `Skeleton`, `Alert`, and `Button`.
- `ui/request-status.tsx` shows the loading screen while a request is pending and the error screen, with retry, when it fails. A timeout is named "The request timed out".
- Tests sit next to those modules. `ui/test-doubles/` holds Vitest-only stand-ins for the three shadcn imports.

Also: `vitest.config.ts`, and `package.json` / `package-lock.json` for `react`, `react-dom`, `vitest`, `jsdom`, and `@testing-library/react`.

`npm run generate:api` wrote `src/generated/` (gitignored). This unit did not edit `.gitignore`, `AGENTS.md`, `README.md`, `mise.toml`, or `openapi.yml`.

## Key implementation decisions

GMT+7 is a fixed +07:00 shift from UTC. Vietnam has no daylight-saving change, so June and December stay `+07:00` without a timezone database.

The 15 second limit is an `AbortController` raced against `fetch`. If the response arrives after that abort, it is not parsed. The bearer token is set on the `Authorization` header only, and an error message has the token removed.

Loading and error screens use semantic color classes (`bg-background`, `text-foreground`, `text-destructive`) and visible text. They do not set a hex color, a padding value, or a palette.

The screens import `@/components/ui/skeleton`, `@/components/ui/alert`, and `@/components/ui/button`. Those files are not in this unit. Vitest aliases them to `src/shared/ui/test-doubles/`. The screens will not resolve in the app until `u0-design-system` creates `src/components/ui` and the `@/` alias. The doubles are not production stand-ins and are not under `src/components/ui`.

## Test coverage summary

No coverage threshold is set. This scope has no line-coverage floor.

| Command | Result |
|---|---|
| `npx vitest run src/shared/api/token.test.ts src/shared/lib` | 4 files, 20 passed |
| `npx vitest run src/shared/api/client.test.ts` | 1 file, 5 passed |
| `npx vitest run src/shared/api/query-client.integration.test.ts` | 1 file, 5 passed |
| `npx vitest run src/shared/ui` | 3 files, 15 passed |
| `npx vitest run src/shared` | 9 files, 45 passed |

`fetch` is stubbed. Tests do not call the network or Cognito. `VITE_API_BASE_URL` is `http://api.test` in those tests. The token string is `test-token`. Vietnamese text uses `Nguyễn`. The GMT+7 date change uses `2026-01-15T18:00:00Z`.

## Tests not executed

None. All 40 tests ran in this stage.

## Deviations

- `src/generated/` was not on disk. `npm run generate:api` was run so `client.ts` could configure `src/generated/client.gen.ts`. That command is the existing `generate:api` script. The plan does not name it. Output stays gitignored.
- Before any test files existed, `npx vitest run src/shared` exited 1 with "No test files found". That was the empty runner, not a failing assertion. The same command after the layers finished: 40 passed.
- Vitest 5 ignores `esbuild` JSX settings, so `vitest.config.ts` sets `oxc.jsx.runtime` to `automatic`.
- `createQueryClient` is exported next to the `queryClient` singleton so a test can use a fresh cache. Later units import `queryClient`.
- The shared client keeps the generator's fields shape. Generated hooks read `.data` and put only that body in the cache. Setting `responseStyle` to `data` would make those hooks return undefined.
- After the first check, the suite is 45 tests. The extra five cover the timeout screen.
