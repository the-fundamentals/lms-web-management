# Code Generation Plan: u2-auth

## Summary

- Builds: Cognito sign-in, the name form, and sign-out as a runnable app. Thin TanStack Router files under `src/routes/` (official defaults); auth feature code under `src/features/auth/` in subfolders. Home after a known profile is a minimal placeholder until u3-classroom.
- Touches: `src/routes/`, `src/features/auth/`, `src/main.tsx`, `vite.config.ts`, `src/routeTree.gen.ts`, `.env.example`, and `.cursor/skills/frontend-architecture-skill/SKILL.md`. Removes `src/features/routes/`.
- Tests: the existing unit and integration tests, moved beside the auth modules under feature subfolders. The session-rejection test mounts the sign-in route behavior.

## Testing Contract

```json
{
  "version": 1,
  "methodology": "test-after",
  "source": "org",
  "ordering": "implement each applicable testable layer, then write and run that layer's tests.",
  "scope": "express",
  "test_strategy": "standard",
  "project_type": "greenfield",
  "applicable_notes": [
    {
      "layer": "org",
      "text": "We treat tests as a first-class deliverable in every Bolt. The specific\nmethodology (TDD, BDD, ATDD, or classic test-after) is affirmed at\npractices-discovery and recorded in `team.md` under this heading with explicit\n`Methodology` and `Ordering` fields; Code Generation resolves those fields\nindependently from coverage, tooling, and scope notes.\n\nWhen no posture has been affirmed, our default per scope is:\n- **Methodology**: test-after\n- **Ordering**: implement each applicable testable layer, then write and run\n  that layer's tests.\n- `mvp`, `enterprise`, `feature`, `infra`, `classic` add an 80% line-coverage\n  floor and CI execution before merge.\n- `bugfix`, `security-patch` add a targeted regression for the specific\n  bug/vulnerability and require the existing suite to remain green.\n- `express` uses the Minimal strategy: requirement-driven unit tests (one per\n  requirement, with a happy-path floor per component); existing tests remain\n  green.\n- `poc`, `refactor`, `workshop` add no extra new-test floor and require the\n  existing suite to remain green.\n\nThe active `Test Strategy` still applies in every scope and determines test\nvolume/types. Scope floors are additive; they never reduce or replace the\nselected strategy.\n\nBuild and Test verifies defined coverage floors and affirmed quality targets;\nthey may not be weakened to make a step pass.\n\nAffirm a stricter posture in `team.md` if the team commits to one."
    }
  ],
  "obligations": {
    "strategy": "standard",
    "strategy_volume": [
      "Five to eight tests per component.",
      "Unit tests plus integration tests for key boundaries.",
      "Add E2E, performance, or security tests when requirements demand them."
    ],
    "scope_floor": [
      "Keep the existing test suite green.",
      "This scope adds no extra new-test floor beyond the selected test strategy."
    ],
    "combination_rule": "Apply every selected-strategy obligation and every scope-floor obligation; neither replaces the other, and a targeted scope regression may add the narrowest necessary test type beyond the strategy default."
  },
  "plan_profile": {
    "methodology": "test-after",
    "runner_step": "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
    "runner_ready_before_first_test": true,
    "testable_layers": [
      "Data model / database behavior",
      "Repository / data access",
      "Business logic",
      "API / endpoint",
      "Frontend behavior"
    ],
    "steps": [
      "Project structure and production configuration skeleton.",
      "Bootstrap the minimal test runner/configuration and record the exact unit-scoped command.",
      "Data model / database behavior - implement.",
      "Data model / database behavior - write and run its tests after implementation.",
      "Repository / data access - implement.",
      "Repository / data access - write and run its tests after implementation.",
      "Business logic - implement.",
      "Business logic - write and run its tests after implementation.",
      "API / endpoint - implement.",
      "API / endpoint - write and run its tests after implementation.",
      "Frontend behavior - implement.",
      "Frontend behavior - write and run its tests after implementation.",
      "Environment/build configuration.",
      "Documentation and traceability."
    ]
  },
  "input_sha256": "sha256:7eda6dbebc7eba01e8858d8911833c06e2bca18cdf76aeaf6f15de08f0d63baa",
  "contract_sha256": "sha256:aee7bb02f8205912a3ecda3439fd589eea1b0cfac342d3618186cb636cbed02a"
}
```


## What this unit is

`u2-auth` is sign-in, the first-and-last-name form, and sign-out. It depends on the design system and the shared client. It imports no other feature.

Auth behavior that already passed review stays: `leaveFor("/")` after a known profile or a successful name save; clear the bearer and drop the OIDC user on 401; keep the unsaved notice after `isAuthenticated` becomes false; preserve a stored `avatarKey`; use the placeholder avatar key only when missing; type-page on headings; TypeScript `6.0.3`; shadcn in `src/components/ui`; `cn` in `src/shared/lib`.

There is no functional design, NFR design, or infrastructure design for this unit. The work comes from `unit-of-work.md`, the U2 rows in `unit-of-work-story-map.md`, `components.md` Session, and `requirements.md` FR1, FR7.1, FR7.3, FR7.4, FR8.4's profile get and update, NFR2, NFR4, and NFR5.

No database and no repository. Those layers are omitted. The profile calls are the generated client. This unit does not build the classroom list, the sidebar, or the account menu. **U3 `u3-classroom` owns the classroom list, create, rename, and the real home index.** Until then, `/` is a minimal placeholder that says classrooms come next.

Sign-in uses `react-oidc-context` (it wraps `oidc-client-ts`) against Cognito Hosted UI: authorization code with PKCE, scopes `openid`, `email`, and `profile`. This unit does not implement the OIDC protocol. The access token is written into the shared bearer store with `setAccessToken`. The id token stays in this unit's memory and is sent only as the `X-ID-Token` header on the profile update. The shared store stays the access token only, because that store is the bearer on every later call and the profile update is the one call that needs the id token.

A new profile has no stored image. `updateMyAccountProfile` still requires `avatarKey`. Image upload is out of scope. A missing profile sends `public/00000000-0000-4000-8000-000000000001`. A profile that already has a key sends that key again so a later image is not wiped. The form does not show the key. This is a stand-in so onboarding can save, not a file in storage.

Brought files stay as they are: `.gitignore`, `AGENTS.md`, `README.md`, `mise.toml`, `openapi.yml`.

## Steps

Test-after. Each applicable layer is implemented, then its tests are written and run, before the next layer.

### Step 1. Project structure

- [ ] Add `react-oidc-context`, `oidc-client-ts`, and `@tanstack/react-router`. Do not add Amplify and do not write an OIDC client.
- [ ] Add `input`, `label`, and `card` with `npx shadcn@latest add input label card`. They land in `src/components/ui`. Do not add a second component folder or a second palette.
- [ ] Keep `typescript` at `6.0.3`.
- [ ] Env names, read at runtime, never hardcoded: `VITE_COGNITO_AUTHORITY`, `VITE_COGNITO_CLIENT_ID`. Redirect is this app's origin plus `/sign-in`. Add `.env.example` with those names and `VITE_API_BASE_URL`, empty. No secret goes in the repo.

Stories: FR1.6, NFR7.

### Step 2. Test runner

- [ ] Vitest, jsdom, and React Testing Library are already installed. Do not add a second runner and do not set a coverage threshold.
- [ ] Tests stub the OIDC user manager. They do not call Cognito.

Stories: none.

### Step 3. Session and profile gate, then their tests

- [ ] Session module: `AuthSessionProvider` reads the two env values. Missing either one is a configuration error, not a crash that prints a token. On a signed-in user, store the access token with `setAccessToken` and keep the id token in this module. On sign-out, clear both. `onSigninCallback` removes `code` and `state` from the URL. Scopes are `openid email profile`. Response type is `code`.
- [ ] Profile gate: GET profile 200 goes to `/`. HTTP 404 whose code is `ACCOUNT_PROFILE_NOT_FOUND` goes to `/onboarding`. HTTP 401 goes to `/sign-in` with notice `unsaved`. Any other failure stays an error. The gate does not edit email and does not grant ADMIN.
- [ ] Six session tests and six profile-gate tests as already written.

Stories: FR1.1, FR1.2, FR1.4, FR1.5, FR1.6, NFR4.

### Step 4. Profile calls, then the integration tests

- [ ] The profile read uses `getMyAccountProfile`. The save uses `updateMyAccountProfile` with `X-ID-Token` set to the id token and a body of `firstName`, `lastName`, and `avatarKey`. Do not log either token.
- [ ] Three integration tests: missing profile renders the name form; save sends names, placeholder key, and `X-ID-Token`; 401 mounts the sign-in route behavior and keeps the unsaved notice after `isAuthenticated` becomes false.

Stories: FR1.2, FR1.4, FR8.4, NFR4.

### Step 5. Screens, then their tests

- [ ] Sign-in screen, name form, and sign-out as already written and reviewed: Sign in button, unsaved Alert, name fields, dirty leave, loading/error screens, `signOut` clears token and ends OIDC session.
- [ ] Screen and sign-out tests as already written.

Stories: FR1.1, FR1.2, FR1.3, FR7.1, FR7.3, FR7.4, NFR2, NFR3, NFR5, NFR6.

### Step 6. Traceability

- [ ] Write `traceability.json` after the code exists. FR1.6 points at the session module. The placeholder avatar key is named in `code-summary.md`.
- [ ] Write `code-summary.md`.

### Step 7. Official TanStack routes, auth subfolders, runnable app

The person rejected the prior layout. Put TanStack Router routes in `src/routes` per official defaults, organize `src/features/auth` into subfolders, and make u2-auth a runnable sign-in app. Home after a known profile is a minimal placeholder until u3-classroom.

- [ ] Install `@tanstack/router-plugin`. In `vite.config.ts`, add `tanstackRouter({ target: 'react', autoCodeSplitting: true })` **before** `@vitejs/plugin-react`. Use official defaults only: `routesDirectory` `./src/routes`, `generatedRouteTree` `./src/routeTree.gen.ts`, `routeFileIgnorePrefix` `-`, `indexToken` `index`, `routeToken` `route`. Do not invent a custom routes directory under features.
- [ ] `src/routes/` holds ONLY thin TanStack Router route files plus `__root.tsx` as required by the router. Route files wire URL → feature screen. No session logic, forms, or tests in route files.
  - `__root.tsx` — root layout (Outlet + providers hookup as needed for the router tree).
  - `sign-in.tsx` — `/sign-in` → auth sign-in screen/route component.
  - `onboarding.tsx` — `/onboarding` → auth onboarding entry.
  - `index.tsx` — `/` minimal placeholder home that says classrooms come next (not the full classroom list; U3 owns that).
- [ ] Generate and commit `src/routeTree.gen.ts` (plugin writes it on `npm run dev` / `vite build`). Do not hand-edit it.
- [ ] Remove `src/features/routes/` entirely. The route tree lives at `src/routes` only.
- [ ] Organize `src/features/auth/` into subfolders (not a flat dump). Stick to this structure:
  - `session/` — OIDC session provider, token helpers, session tests.
  - `profile/` — profile gate, profile API calls, avatar key, profile entry, their tests.
  - `screens/` — sign-in screen, name form / onboarding screen, sign-in route component, onboarding entry, sign-out, their tests (or a `tests/` folder beside each area when clearer).
  - Feature folders must not import each other. Features may import `src/shared`.
- [ ] Wire a runnable entry: `src/main.tsx` mounts `QueryClientProvider` (existing shared client), `AuthSessionProvider`, and `RouterProvider` with the generated route tree so `npm run dev` shows Sign in (not a blank null root). Wire `leaveFor` to the router navigate. Cognito sign-in / onboarding routes must work when env vars are set.
- [ ] Keep `.env.example` with `VITE_COGNITO_AUTHORITY`, `VITE_COGNITO_CLIENT_ID`, `VITE_API_BASE_URL`. Do not hardcode secrets.
- [ ] Keep the open fix on the sign-in route: after the server rejects the session, the Sign in screen that stays up must still say the entries on the previous form were not saved. The component the route renders keeps that notice when `auth.isAuthenticated` becomes false. The test mounts that route behavior, not only `ProfileEntry`.
- [ ] Update `.cursor/skills/frontend-architecture-skill/SKILL.md`: routes in `src/routes` (TanStack defaults); feature code in `src/features/<name>/` with subfolders; no `features/routes`; route files stay thin; features do not import each other.
- [ ] Update the unit source manifest, `code-summary.md`, and `traceability.json` targets to the new paths.
- [ ] Run `npx vitest run src/features/auth src/routes` then `npx vitest run && npx vite build`.

Stories: FR1.1, FR1.2, FR1.4, FR7.1.

## Requirement map

| Requirement | Step |
|---|---|
| FR1.1 | Steps 3, 5, and 7. A profile that exists goes to `/`. The classroom list is u3-classroom. |
| FR1.2 | Steps 3, 4, 5, and 7 |
| FR1.3 | Step 5 |
| FR1.4 | Steps 3, 4, 5, and 7 |
| FR1.5 | Step 3. No role control. |
| FR1.6 | Steps 1 and 3 |
| FR7.1 | Steps 5 and 7. Sign-in and the name form use their own forms and have no sidebar. |
| FR7.3 | Step 5 |
| FR7.4 | Step 5 |
| FR8.4 | Step 4. Only get and update of the signed-in profile. |
| NFR2 | Step 5. Native controls, semantic colors. Present and absent are not this unit. |
| NFR3 | Step 5 |
| NFR4 | Steps 3, 4, and 5 |
| NFR5 | Step 5 |
| NFR6 | Steps 1 and 5 |
| NFR1 | Not this unit. These screens are one column. The 1280px check is the app unit. |
