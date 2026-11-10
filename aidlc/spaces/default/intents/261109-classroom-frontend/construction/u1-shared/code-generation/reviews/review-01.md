## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-10T19:06:20Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | src/shared/api/client.ts > bindConfig | `bindConfig` sets `baseUrl`, `fetch`, and `throwOnError` and leaves `responseStyle` unset. On success the generated client returns `{ data, request, response }` unless `responseStyle` is `data` (`src/generated/client/client.gen.ts`, the return after a parsed body). `withDeadline` writes the access token onto that `Request` as `Authorization: Bearer <token>`. `createQueryClient` stores the whole object as query data. Callers receive the wrapper, not the body, and the bearer token is part of cached query data. Unit of work places query devtools in the app unit, so that cache value is shown. | Configure the shared client so success values are the response body only. Keep the `Request` that carries `Authorization` out of query data and out of any value a screen renders. | New |
| R-02 | Major | src/shared/api/query-client.ts > createQueryClient queryFn | The default query function always calls `client.get` and uses `queryKey[0]` as the URL. The generated list operation `getAllClassrooms` is `client.post` to `/admin/classrooms/query` (`src/generated/sdk.gen.ts`). The integration tests call GET `/classrooms`, so they pass against a path the API does not use. A screen that relies on the default query function never calls the generated list operations. | Point the shared query client at the generated operations, including those POST query endpoints, or drop the GET-by-query-key default so a path string cannot be used as a list request. | New |
| R-03 | Major | src/shared/lib/gmt7.ts > formatInstantInGmt7 | The module formats a UTC instant as a GMT+7 label (`formatInstantInGmt7`, `civilDateInGmt7`, `gmt7Offset`). FR6.1 also requires values sent to the server to be UTC instants converted at the boundary. There is no conversion from a GMT+7 civil date and clock time back to that instant. Traceability marks FR6.1 OK against this file. A schedule screen that builds a host-local `Date` will not send GMT+7. | Add the GMT+7 civil date and clock time to UTC instant conversion beside the formatter, and test the `2026-01-15T18:00:00Z` / `2026-01-16 01:00` example in both directions. | New |
| R-04 | Major | src/shared/api/client.ts > fetchUntilAbort | After 15 seconds with no response the call rejects with "The operation was aborted." `LoadingScreen` and `ErrorScreen` are separate components, and nothing selects the error screen or its retry when that abort fires. FR7.2 says the waiting screen becomes the error screen and offers a way to try again. The late response is dropped, which the query test covers. The screen change is not in the client, the query client, or either screen. Traceability still marks FR7.2 OK with target `src/shared/api/client.ts`. | On that abort, leave the loading screen, show `ErrorScreen` with a retry that runs the request again, and name what failed. | New |
| R-05 | Minor | vitest.config.ts > test.include | `include` lists only `src/shared/**/*.test.ts` and `src/shared/**/*.test.tsx`. Vitest treats a file as a test only when it matches `include` (`matchesTestGlob`). This site's later units add tests outside `src/shared`. A run aimed at those paths collects nothing. The unit command `npx vitest run src/shared` already limits this unit's run. | Widen `include` to the site's test files. Keep this unit's command scoped with `npx vitest run src/shared`. | New |
| R-06 | Minor | src/shared/api/client.ts > stripToken | `stripToken` returns the value unchanged unless it is a string or an `Error`. For an HTTP error the generated client throws the parsed JSON body when the body is JSON (`throw jsonError ?? textError` in `src/generated/client/client.gen.ts`). That object skips the strip. The client test only rejects with `new Error("upstream failed for test-token")`. | Strip the token from the error value the generated client throws, including text on a JSON body, and cover that path in `client.test.ts`. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| npx vitest run src/shared | PASS. Exit 0. Test Files 8 passed (8). Tests 40 passed (40). Duration 1.59s. Vitest 5.1.0. | The unit suite is green. Fetch is stubbed. No test asserts the success payload shape, and the query tests call GET `/classrooms`, so the run does not catch the fields wrapper, the bearer token on the cached request, or the POST list operations. |

### Summary

The shared client returns the generated fields result, so query data includes the `Request` that carries the bearer token, and the default query function cannot call the generated POST list operations. The 15 second abort and the GMT+7 formatter cover only half of FR7.2 and FR6.1, while traceability marks both done.
