## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-11T19:15:09Z
**Iteration:** 2
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | src/routes/sign-in/-profile-entry.tsx > ProfileDestination | A profile that already exists (`destination: "/"`) renders nothing. A successful name save does the same: `src/routes/onboarding/-name-form.tsx` sets status `done` and returns nothing. No code in this unit changes the page to `/`. After sign-in, and again after the name is saved, the teacher stays on a blank sign-in view and never reaches the classroom list. | Send both results to `/`. Keep the name form on screen for a missing profile, and keep Sign in on screen for the unsaved notice. | Resolved (reviewer) |
| R-02 | Major | src/routes/sign-in/-session.ts > SessionBridge | A profile 401 shows Sign in, and the bearer token is left in place. SessionBridge copies `auth.user.access_token` back into the shared store whenever that user is still present, and the 401 path never clears it or drops the local OIDC user. `isAuthenticated` stays true, so the rest of the app can keep showing protected screens and keep sending the rejected token. | When the server rejects the call as signed out, clear the bearer token and drop the local OIDC user before Sign in is shown. | Resolved (reviewer) |
| R-03 | Major | src/routes/onboarding.tsx > OnboardingRoute | `/onboarding` renders the name form without reading the profile. The save then sends the placeholder avatar key `public/00000000-0000-4000-8000-000000000001`. A teacher who already has an avatar key loses that key on save. The sign-in gate never sends an existing key here either: a found profile stops at the blank screen above, and a missing profile has no key to keep. | Read the signed-in profile on this route, and send the stored avatar key when one exists. | Resolved (reviewer) |
| R-04 | Minor | src/routes/sign-in/-sign-in-screen.tsx > Sign in heading | The Sign in heading, and the Your name heading in `src/routes/onboarding/-name-form.tsx`, set only `text-foreground`. Page titles are 24px Newsreader semibold (`type-page` in the global stylesheet). These headings stay on the 16px body font. | Put `type-page` on both page headings. | Resolved (reviewer) |
| R-05 | Major | src/routes/sign-in.tsx > SignInRoute | After the server rejects the session, this route removes the unsaved notice. The name form after sign-in is drawn inside this route, and the route renders that gate only while `auth.isAuthenticated` is true. A profile 401 and a rejected name save both call `markSignedOutByServer`, which removes the local user. `react-oidc-context` then sets `isAuthenticated` to false, and the next render is Sign in with no notice. The teacher who was typing a name returns to Sign in without being told the entries were not saved. The unit tests render `ProfileEntry` on its own, so they still see the notice. | Keep the unsaved notice on the Sign in screen that stays up after the local user is removed. | Resolved (reviewer) |
| R-06 | Minor | src/routes/onboarding.tsx > OnboardingPage | The onboarding route file calls `useAuth` and binds `signinRedirect`, while `sign-in.tsx` and `index.tsx` only render a feature screen. Session wiring therefore sits in one route file instead of only in `src/features/auth`. | Move the `onSignIn` binding into `OnboardingEntry` (or a thin wrapper under `screens/`) so every file under `src/routes/` only imports and renders a feature screen. | Resolved (reviewer) |

> R-06 Reviewer note: `src/routes/onboarding.tsx` only imports and renders `OnboardingEntry`. `useAuth` / `signinRedirect` live in `src/features/auth/components/onboarding-entry.tsx`, matching the thin-route pattern of `sign-in.tsx` and `index.tsx`.

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `npx vitest run src/features/auth src/routes` | PASS (exit 0): Test Files 7 passed (7). Tests 42 passed (42). | Unit-scoped command is green. Avatar path asserts no `confirm-public`; public upload uses `isPublic: true` then PUT, then `avatarKey` on profile save. |

### Summary

R-06 is closed: session wiring for onboarding sits in the feature entry, and all three route files stay thin. Avatar flow matches the post-drift contract (public storage upload → PUT → profile `avatarKey`, no confirm-public), and the unit test command passes.
