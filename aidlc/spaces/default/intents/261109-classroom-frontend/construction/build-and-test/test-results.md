# Test Results

## Commands executed

| Command | Exit | Notes |
|---|---|---|
| `npx vitest run` | 0 | Full suite; subsumes per-unit scoped paths |
| `npx vite build` | 0 | Production client build |

Per-unit scoped commands from `unit-test-instructions.md` are path filters of the same Vitest suite; the full-suite run is the single project-wide command named across units (`npx vitest run && npx vite build`).

## Build status

**Success.** Vite 8.3.8 client build completed (~1.17s). `dist/` emitted.

## Unit / integration results

| Metric | Value |
|---|---|
| Test files | 65 passed |
| Tests | 339 passed |
| Failed | 0 |
| Skipped | 0 |
| Duration | ~15.5s |
| Environment | **jsdom** (DOM emulator) |

No coverage report: no coverage threshold / `vitest --coverage` in project config.

## Failure details

None.

## Target Verification Matrix (final)

| Target ID | Source | Expected | Actual | Evidence | Owning Stage | Verdict |
|---|---|---|---|---|---|---|
| T-SUITE-GREEN | Testing Contract `obligations.scope_floor` | Full Vitest suite exit 0 | 65 files / 339 tests passed, exit 0 | `npx vitest run` (jsdom) | build-and-test | Met |
| T-BUILD | Construction Verification / `build-instructions.md` | `npx vite build` exit 0 | exit 0, dist emitted | `npx vite build` | build-and-test | Met |
| T-INTEGRATION | Standard strategy + `integration-test-instructions.md` | Boundary/integration tests pass under Vitest/jsdom | Included in 339 passed | `npx vitest run` (jsdom) | build-and-test | Met |
| T-CI-BEFORE-MERGE | Testing Contract / org Testing Posture | CI runs selected tests before merge | N/A | the plan runs no CI Pipeline | build-and-test | N/A |

## Coverage report

Not configured. Express scope adds no line-coverage floor.
