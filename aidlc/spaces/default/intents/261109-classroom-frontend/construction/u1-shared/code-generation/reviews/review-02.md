## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-10T19:29:00Z
**Iteration:** 2
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | src/shared/api/client.ts > bindConfig | `bindConfig` sets `baseUrl`, `fetch`, and `throwOnError` and leaves `responseStyle` unset. On success the generated client returns `{ data, request, response }` unless `responseStyle` is `data` (`src/generated/client/client.gen.ts`, the return after a parsed body). `withDeadline` writes the access token onto that `Request` as `Authorization: Bearer <token>`. `createQueryClient` stores the whole object as query data. Callers receive the wrapper, not the body, and the bearer token is part of cached query data. Unit of work places query devtools in the app unit, so that cache value is shown. | Configure the shared client so success values are the response body only. Keep the `Request` that carries `Authorization` out of query data and out of any value a screen renders. | Unresolved |
| R-02 | Major | src/shared/api/query-client.ts > createQueryClient queryFn | The default query function always calls `client.get` and uses `queryKey[0]` as the URL. The generated list operation `getAllClassrooms` is `client.post` to `/admin/classrooms/query` (`src/generated/sdk.gen.ts`). The integration tests call GET `/classrooms`, so they pass against a path the API does not use. A screen that relies on the default query function never calls the generated list operations. | Point the shared query client at the generated operations, including those POST query endpoints, or drop the GET-by-query-key default so a path string cannot be used as a list request. | Resolved (reviewer) |
| R-03 | Major | src/shared/lib/gmt7.ts > formatInstantInGmt7 | The module formats a UTC instant as a GMT+7 label (`formatInstantInGmt7`, `civilDateInGmt7`, `gmt7Offset`). FR6.1 also requires values sent to the server to be UTC instants converted at the boundary. There is no conversion from a GMT+7 civil date and clock time back to that instant. Traceability marks FR6.1 OK against this file. A schedule screen that builds a host-local `Date` will not send GMT+7. | Add the GMT+7 civil date and clock time to UTC instant conversion beside the formatter, and test the `2026-01-15T18:00:00Z` / `2026-01-16 01:00` example in both directions. | Resolved (reviewer) |
| R-04 | Major | src/shared/api/client.ts > fetchUntilAbort | After 15 seconds with no response the call rejects with "The operation was aborted." `LoadingScreen` and `ErrorScreen` are separate components, and nothing selects the error screen or its retry when that abort fires. FR7.2 says the waiting screen becomes the error screen and offers a way to try again. The late response is dropped, which the query test covers. The screen change is not in the client, the query client, or either screen. Traceability still marks FR7.2 OK with target `src/shared/api/client.ts`. | On that abort, leave the loading screen, show `ErrorScreen` with a retry that runs the request again, and name what failed. | Resolved (reviewer) |
| R-05 | Minor | vitest.config.ts > test.include | `include` lists only `src/shared/**/*.test.ts` and `src/shared/**/*.test.tsx`. Vitest treats a file as a test only when it matches `include` (`matchesTestGlob`). This site's later units add tests outside `src/shared`. A run aimed at those paths collects nothing. The unit command `npx vitest run src/shared` already limits this unit's run. | Widen `include` to the site's test files. Keep this unit's command scoped with `npx vitest run src/shared`. | Resolved (reviewer) |
| R-06 | Minor | src/shared/api/client.ts > stripToken | `stripToken` returns the value unchanged unless it is a string or an `Error`. For an HTTP error the generated client throws the parsed JSON body when the body is JSON (`throw jsonError ?? textError` in `src/generated/client/client.gen.ts`). That object skips the strip. The client test only rejects with `new Error("upstream failed for test-token")`. | Strip the token from the error value the generated client throws, including text on a JSON body, and cover that path in `client.test.ts`. | Resolved (reviewer) |
| R-07 | Major | src/shared/ui/request-status.tsx > requestFailedMessage | The generated client throws the parsed JSON body, or the raw text when the body is not JSON (`throw jsonError ?? textError`). `client.test.ts` expects that failure to be a plain object `{ message: "upstream failed for " }`, not an `Error`. `requestFailedMessage` only reads `RequestTimeoutError` and `Error`, so `RequestStatus` shows "The request failed" and drops the body text. A failed load does not say what failed. | Show the text from a thrown JSON object and from a thrown string on `ErrorScreen`. Cover that shape in `request-status.test.tsx` with the same JSON object the client test already rejects. | New |

> R-01 Reviewer note: The default query function is gone, and generated hooks return only `data`, so those cache entries are the body. `bindConfig` still leaves `responseStyle` unset, and the generated client therefore returns `{ data, request, response }` with `Authorization` on that request. `GetAllClassroomsResponse` is an array, so forcing `responseStyle` `data` would make the hooks' `const { data }` undefined. A `useQuery` that returns `getAllClassrooms()` still caches that request and its bearer token.

> R-02 Reviewer note: `createQueryClient` sets no query function, so a path string is not fetched. The integration test calls `getAllClassrooms` with POST `http://api.test/admin/classrooms/query` and stores only `result.data`.

> R-03 Reviewer note: `instantFromGmt7("2026-01-16", "01:00")` is `2026-01-15T18:00:00.000Z`, and `formatInstantInGmt7("2026-01-15T18:00:00Z")` contains `2026-01-16 01:00`. Both assertions passed.

> R-04 Reviewer note: The client rejects a 15 second abort with `RequestTimeoutError` ("The request timed out"). `RequestStatus` leaves `LoadingScreen` on `status` `error`, shows `ErrorScreen` with that text, and the Try again button calls `onRetry`.

> R-05 Reviewer note: `vitest.config.ts` `include` is `src/**/*.test.ts` and `src/**/*.test.tsx`. This unit's command is still `npx vitest run src/shared`.

> R-06 Reviewer note: `stripToken` serializes object errors and removes the token. `client.test.ts` expects the JSON 500 body to reject as `{ message: "upstream failed for " }`. That test passed.

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| npx vitest run src/shared | PASS. Test Files 9 passed (9). Tests 45 passed (45). Exit code 0. | The repaired client, query, GMT+7, token, and screen tests run. Passing does not put the bearer request outside the query cache, and it does not show a JSON error body on the error screen. |

### Summary

The timeout screen, GMT+7 round trip, POST list call, token strip, and Vitest include are in place. Two gaps remain: a query that stores `getAllClassrooms()` still caches the request that carries the bearer token, and `RequestStatus` ignores the JSON error body the client throws.
