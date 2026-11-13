# Unit Test Instructions: u2-auth

## Framework

Vitest with jsdom and React Testing Library. Tests live next to the auth module they cover, under `src/features/auth/` subfolders (`session/`, `profile/`, `screens/`). Route files under `src/routes/` hold no tests. A leading `-` ignores a non-route file inside `src/routes/`.

The OIDC user manager is stubbed. Tests do not call Cognito and do not read a real client id.

## How to run this unit

```bash
npx vitest run src/features/auth src/routes
```

That command covers only this unit. It does not run tests from other units. `src/routes` has no test files; the auth tests are the ones that run.

Layer commands, each scoped to this unit:

```bash
npx vitest run src/features/auth/session src/features/auth/profile
npx vitest run src/features/auth --testNamePattern integration
npx vitest run src/features/auth/screens
```

Exact paths after the Step 7 move (update if file names shift slightly within the same folders):

```bash
npx vitest run src/features/auth/session/session.test.ts src/features/auth/profile/profile-gate.test.ts
npx vitest run src/features/auth/screens/auth.integration.test.tsx
npx vitest run src/features/auth/screens/sign-in-screen.test.tsx src/features/auth/screens/name-form.test.tsx src/features/auth/screens/sign-out.test.ts
```

Verification for the unit checkpoint:

```bash
npx vitest run && npx vite build
```

## Coverage

Five to eight tests per module: 6 for the session, 6 for the profile gate, 6 for the sign-in screen, 8 for the name form, and 5 for sign-out. 31 unit tests. Three integration tests cover the profile boundary. No project-wide line-coverage threshold is set. This scope has no 80% floor. Build and Test does not apply one. A unit-scoped run is not a coverage gate.

## Modules and tests

**session** (`src/features/auth/session/session.test.ts`)

- set then get stores the access token in the shared bearer store
- the id token is not written into that bearer store
- clear removes the access token
- the access token is not placed in the redirect URL
- the id token is not placed in the redirect URL
- missing authority or client id is an error, and the message contains neither value

**profile-gate** (`src/features/auth/profile/profile-gate.test.ts`)

- profile 200 goes to `/`
- HTTP 404 with code `ACCOUNT_PROFILE_NOT_FOUND` goes to `/onboarding`
- HTTP 401 goes to `/sign-in` with notice `unsaved`
- a different 404 stays an error
- email is not part of the decision
- the result does not grant ADMIN

**auth integration** (`src/features/auth/screens/auth.integration.test.tsx`)

- a missing profile renders the name form
- save sends the typed names, the placeholder avatar key, and `X-ID-Token`, and neither token appears in the document
- a 401 on the profile read mounts the component `src/routes/sign-in.tsx` wires (the sign-in route screen), not only `ProfileEntry`. After `auth.isAuthenticated` becomes false, the Sign in screen still says the entries on the previous form were not saved

**sign-in screen** (`src/features/auth/screens/sign-in-screen.test.tsx`)

- Sign in is shown
- the screen has no sidebar
- the unsaved notice is shown when the notice is set
- the notice is absent when it is unset
- a token passed in is not rendered
- the Sign in button has `data-testid="sign-in"`

**name form** (`src/features/auth/screens/name-form.test.tsx`)

- first name and last name are shown
- there is no email field
- an empty first name names that field and keeps the last name
- an empty last name names that field and keeps the first name
- Vietnamese characters stay as typed
- a dirty form asks before leaving
- save does not invent a second avatar key
- the screen has no sidebar

**sign-out** (`src/features/auth/screens/sign-out.test.ts`)

- clears the access token
- ends the OIDC session
- the destination is `/sign-in`
- the token is not in that URL
- the button has `data-testid="sign-out"`

## Mocking

Stub `react-oidc-context` and `oidc-client-ts`. Stub `fetch` for profile calls. Do not hit Cognito or the real API.
