## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-11T09:25:31Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | src/routes/sign-in/-profile-entry.tsx > ProfileDestination | A profile that already exists (`destination: "/"`) renders nothing. A successful name save does the same: `src/routes/onboarding/-name-form.tsx` sets status `done` and returns nothing. No code in this unit changes the page to `/`. After sign-in, and again after the name is saved, the teacher stays on a blank sign-in view and never reaches the classroom list. | Send both results to `/`. Keep the name form on screen for a missing profile, and keep Sign in on screen for the unsaved notice. | New |
| R-02 | Major | src/routes/sign-in/-session.ts > SessionBridge | A profile 401 shows Sign in, and the bearer token is left in place. SessionBridge copies `auth.user.access_token` back into the shared store whenever that user is still present, and the 401 path never clears it or drops the local OIDC user. `isAuthenticated` stays true, so the rest of the app can keep showing protected screens and keep sending the rejected token. | When the server rejects the call as signed out, clear the bearer token and drop the local OIDC user before Sign in is shown. | New |
| R-03 | Major | src/routes/onboarding.tsx > OnboardingRoute | `/onboarding` renders the name form without reading the profile. The save then sends the placeholder avatar key `public/00000000-0000-4000-8000-000000000001`. A teacher who already has an avatar key loses that key on save. The sign-in gate never sends an existing key here either: a found profile stops at the blank screen above, and a missing profile has no key to keep. | Read the signed-in profile on this route, and send the stored avatar key when one exists. | New |
| R-04 | Minor | src/routes/sign-in/-sign-in-screen.tsx > Sign in heading | The Sign in heading, and the Your name heading in `src/routes/onboarding/-name-form.tsx`, set only `text-foreground`. Page titles are 24px Newsreader semibold (`type-page` in the global stylesheet). These headings stay on the 16px body font. | Put `type-page` on both page headings. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| npx vitest run src/routes/sign-in src/routes/onboarding | PASS (exit 0). Test Files 6 passed (6). Tests 34 passed (34). Duration 1.36s. | The unit command succeeds. Those tests check the name form, the unsaved notice, and the profile request. They do not check a move to `/` after a profile 200 or a successful save, so they do not cover the Critical finding. |

### Summary

Sign-in with an existing profile, and a name save that succeeds, both end on a blank screen because the `/` destination is never applied. The session also stays signed in after a 401, and `/onboarding` can overwrite a stored avatar key with the placeholder.
