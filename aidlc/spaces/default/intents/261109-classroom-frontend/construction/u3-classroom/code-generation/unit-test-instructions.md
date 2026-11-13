# Unit Test Instructions: u3-classroom

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the module they cover under `src/features/classroom/` (`lib/`, `components/`) and `src/features/app-shell/components/`. Route files under `src/routes/` hold no tests. A leading `-` ignores a non-route file inside `src/routes/`.

The generated client and `fetch` are stubbed. Tests do not call the real API and do not require Cognito. App-shell tests stub router `Link` and receive `user` / `onSignOut` as props (no auth feature import).

## How to run this unit

```bash
npx vitest run src/features/classroom src/features/app-shell
```

That command covers only this unit. It does not run tests from other units.

Layer commands, each scoped to this unit:

```bash
npx vitest run src/features/classroom/lib
npx vitest run src/features/classroom/components --testNamePattern integration
npx vitest run src/features/classroom/components
npx vitest run src/features/app-shell
```

Exact paths (update if file names shift slightly within the same folders):

```bash
npx vitest run src/features/classroom/lib/classroom-api.test.ts src/features/classroom/lib/classroom-name.test.ts
npx vitest run src/features/classroom/components/classroom-list.test.tsx
npx vitest run src/features/classroom/components/classroom-create.test.tsx src/features/classroom/components/classroom-rename.test.tsx
npx vitest run src/features/classroom/components/classroom-layout.test.tsx
npx vitest run src/features/classroom/components/classroom.integration.test.tsx
npx vitest run src/features/app-shell
```

Verification for the unit checkpoint:

```bash
npx vitest run && npx vite build
```

## Coverage

Five to eight tests per module: 6–8 for name/API helpers, 6–8 for the list, 6–8 for create, 6–8 for rename, 5–6 for the layout, 5–8 for app-shell (sidebar chrome, sign-out footer, nav create). About 33+ unit tests. Three integration tests cover the client boundary. No project-wide line-coverage threshold is set. This scope has no 80% floor. Build and Test does not apply one. A unit-scoped run is not a coverage gate.

## Modules and tests

**classroom-name / classroom-api** (`src/features/classroom/lib/`)

- trimmed name of 1–255 characters is valid
- empty string fails and names the name field
- whitespace-only fails and names the name field
- 256 characters fails
- create payload includes only `name`
- list mapping keeps two rows that share a name as two rows
- update payload sends the new name (and does not invent a banner key)

**classroom-list** (`src/features/classroom/components/classroom-list.test.tsx`)

- empty successful load says there are none and offers New classroom
- failed load uses the shared error screen and is not the empty copy
- rows render name and are distinct by id when names match
- New classroom control has `data-testid="new-classroom"`
- choosing a row navigates toward `/classrooms/$classroomId`
- loading state uses the shared loading screen
- search sends OpenAPI name `like` filter (debounced)
- List / Card view toggle; Table control stays disabled
- rows show members and plan summary beyond the name
- (after Step 10) list content renders without requiring the old full-page ClassroomShell washes; works inside AppShell main

**classroom-create** (`src/features/classroom/components/classroom-create.test.tsx`)

- name field is shown
- empty submit names the name field and keeps typed values
- successful save navigates back to the list path
- a second click while save is in flight does not call create again
- dirty form asks before leaving
- submit control has `data-testid="create-classroom-submit"`

**classroom-rename** (`src/features/classroom/components/classroom-rename.test.tsx`)

- current name is shown for editing
- empty submit names the name field and keeps typed values
- successful save shows the new name
- dirty form asks before leaving
- save control has `data-testid="rename-classroom-submit"`

**classroom-layout** (`src/features/classroom/components/classroom-layout.test.tsx`)

- loaded classroom name is shown
- an outlet region is present
- missing classroom uses the shared error screen
- no session list or calendar is rendered
- rename entry is reachable from the layout

**app-shell** (`src/features/app-shell/components/*.test.tsx`)

- sidebar (or `data-testid="app-sidebar"`) is present when AppShell renders
- brand / Classrooms nav points at `/`
- New classroom nav or Quick Create–style control points at `/classrooms/new`
- profile footer shows the provided user name/email
- Sign out control has `data-testid="sign-out"` and invokes `onSignOut`
- header shows the provided page title and includes a sidebar trigger

**classroom integration** (`src/features/classroom/components/classroom.integration.test.tsx`)

- empty list response renders the empty state and New classroom
- create posts `{ name }`, then the list includes the new classroom
- rename updates the name on the layout (and list after refresh); no token appears in the document

## Mocking

Stub `src/generated` SDK functions or `fetch` for classroom calls. Stub router navigate / `Link` where a screen asserts destination. Pass AppShell user and onSignOut as props. Do not hit Cognito or the real API.

## Out of scope for this unit's tests

Sessions UI, classroom price, banner upload, Cognito live flows, and other features' suites (except keeping the full `npx vitest run` green at verification).
