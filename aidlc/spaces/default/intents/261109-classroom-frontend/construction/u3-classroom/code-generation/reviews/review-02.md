## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-12T03:40:03Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/source-manifest.json > writes | Plan and code-summary remove `src/features/auth/components/home-placeholder.tsx`, and that file is gone from the tree, but the manifest lists only creates/modifies — no delete claim for the removed placeholder | Add the deleted path to `source-manifest.json` writes (or an equivalent delete claim the engine accepts) so this unit owns the removal | New |
| R-02 | Major | src/features/classroom/components/classroom-create.tsx > save error path; src/features/classroom/components/classroom-rename.tsx > save error path | FR7.4 also requires that when the session expires on an open form, Sign in says prior entries were not saved. Create/rename only use `beforeunload` for dirty leave; a 401 during save shows `ErrorScreen` and never latches the unsaved Sign-in notice. Feature boundaries block calling auth's `markSignedOutByServer` from these screens | Move the unsaved-on-401 latch into shared (or compose it at the route), and wire create/rename 401 handling so Sign in shows the unsaved notice — without a classroom→auth import | New |
| R-03 | Minor | src/features/classroom/components/classroom-rename.test.tsx > test suite | Plan Step 5 asks for rename tests including a double-submit guard; rename code returns `LoadingScreen` while pending, but no rename test covers a second save while in flight (create has that case) | Add a rename double-submit test matching the create pattern | New |
| R-04 | Minor | src/routes/classrooms/new.tsx; src/routes/classrooms/$classroomId/route.tsx > route components | Only `/` gates on `isAuthenticated`. `/classrooms/new` and `/classrooms/$classroomId` render classroom screens with no signed-in check; unsigned visitors see the forms until an API call fails. Unit-of-work assigns `_authenticated` to U8, so this is deferred, not accidental | Accept as U8 work, or wrap these routes with the same signed-in composition used on `/` until U8 lands | New |
| R-05 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/source-manifest.json > writes | Plan and code-summary remove `src/features/auth/components/home-placeholder.tsx`, and that file is gone from the tree, but the manifest lists only creates/modifies — no delete claim for the removed placeholder | Add the deleted path to `source-manifest.json` writes (or an equivalent delete claim the engine accepts) so this unit owns the removal | New |
| R-06 | Major | src/features/classroom/components/classroom-create.tsx > save error path; src/features/classroom/components/classroom-rename.tsx > save error path | FR7.4 also requires that when the session expires on an open form, Sign in says prior entries were not saved. Create/rename only use `beforeunload` for dirty leave; a 401 during save shows `ErrorScreen` and never latches the unsaved Sign-in notice. Feature boundaries block calling auth's `markSignedOutByServer` from these screens | Move the unsaved-on-401 latch into shared (or compose it at the route), and wire create/rename 401 handling so Sign in shows the unsaved notice — without a classroom→auth import | New |
| R-07 | Minor | src/features/classroom/components/classroom-rename.test.tsx > test suite | Plan Step 5 asks for rename tests including a double-submit guard; rename code returns `LoadingScreen` while pending, but no rename test covers a second save while in flight (create has that case) | Add a rename double-submit test matching the create pattern | New |
| R-08 | Minor | src/features/classroom/components/classroom-list.tsx > empty-state New classroom control | Plan Step 4 ties `data-testid="new-classroom"` to the empty-state New classroom offer; the empty-state button has no test id (only the summary Quick action card carries `new-classroom`) | Put `data-testid="new-classroom"` on the empty-state New classroom control as well, or document that the summary Quick action is the sole owned control | New |

> R-01 Not re-checked this round

> R-02 Not re-checked this round

> R-03 Not re-checked this round

> R-04 Not re-checked this round

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `npx vitest run src/features/classroom src/features/app-shell` | PASS — 9 files, 41 tests passed (≈2.51s) | Unit-scoped suite green; matches code-summary claim |
| `npx vitest run && npx vite build` | PASS — 29 files, 148 tests passed; Vite production build succeeded (≈1.06s, 2403 modules) | Full suite stayed green; AppShell + classroom routes compile into the client bundle |
| Feature import spot-check (`@/features/*` inside `src/features/classroom` and `src/features/app-shell`) | PASS — no cross-feature imports | Routes compose auth + app-shell + classroom; eslint zones declare the same boundary |
| Auth/`/` and AppShell acceptance spot-check | PASS — signed-out `/` still `SignInRoute`; signed-in wraps `AppShell` + `ClassroomList`; sidebar `data-testid="app-sidebar"`; footer `data-testid="sign-out"`; U0 cream/teal `--sidebar*`/`--primary` kept; LMS summary cards (no Acme revenue) | Step 10 Request Changes redesign holds for the acceptance focus |

### Summary

Dashboard AppShell redesign meets the Request Changes bar (auth gate, sidebar chrome, LMS KPIs, U0 tokens, feature isolation, green suite). Two Majors remain from claim completeness and the FR7.4 session-expiry unsaved path on create/rename — within the READY threshold (≤2 Major, zero Critical).
