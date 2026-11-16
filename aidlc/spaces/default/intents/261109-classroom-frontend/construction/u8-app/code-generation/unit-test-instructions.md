# Unit Test Instructions: u8-app

## Framework

Vitest with jsdom and React Testing Library. Primary tests live under `src/features/app-shell/` (`components/`, `lib/`). Route files under `src/routes/` hold no tests. Auth screens stay under `src/features/auth/` (not this unit's command).

## How to run this unit

```bash
npx vitest run src/features/app-shell
```

That command covers this unit's shell ownership. If this unit adds `src/devtools` tests, append that path:

```bash
npx vitest run src/features/app-shell src/devtools
```

Layer commands:

```bash
npx vitest run src/features/app-shell/lib
npx vitest run src/features/app-shell/components
```

Verification for the unit checkpoint (intent-wide):

```bash
npx vitest run && npx vite build
```

## Coverage

Five to eight tests per module where new cases are added. Existing app-shell suite must stay green. About the current shell suite plus any gap-fill cases for sidebar links / Sign out / profile degradation. No project-wide line-coverage threshold on the unit-scoped command; Build and Test runs the full suite.

## Modules and tests

**shell helpers** (`src/features/app-shell/lib/`)

- Existing shell-user / header-trail / profile mapping tests remain green
- Gap-fill only if a FR path is uncovered

**AppShell / sidebar / NavUser** (`src/features/app-shell/components/`)

- Sidebar Overview + Classrooms + New classroom links (`data-testid`s)
- Sign out (`data-testid="sign-out"`)
- Profile footer name/email/avatar
- No Tools / nav-tools control in the document (U7 cancelled)
- Profile failure keeps chrome usable (degraded footer)

**DEV tools (optional)**

- If tested: DevtoolsHost only mounts under DEV; no invoice/session Tools screen

## Mocking

- Stub router / auth / profile query as existing shell tests do
- Do not hit the network

## Expected coverage targets

Express + Standard: keep suite green; no extra line-coverage floor on the unit-scoped command. Build and Test checks the full project suite.
