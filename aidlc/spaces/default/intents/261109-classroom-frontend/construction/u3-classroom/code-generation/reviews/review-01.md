## Review

**Verdict:** READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-11T19:34:41Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/source-manifest.json > writes | Plan and code-summary remove `src/features/auth/components/home-placeholder.tsx`, and that file is gone from the tree, but the manifest lists only creates/modifies — no delete claim for the removed placeholder | Add the deleted path to `source-manifest.json` writes (or an equivalent delete claim the engine accepts) so this unit owns the removal | New |
| R-02 | Major | src/features/classroom/components/classroom-create.tsx > save error path; src/features/classroom/components/classroom-rename.tsx > save error path | FR7.4 also requires that when the session expires on an open form, Sign in says prior entries were not saved. Create/rename only use `beforeunload` for dirty leave; a 401 during save shows `ErrorScreen` and never latches the unsaved Sign-in notice. Feature boundaries block calling auth's `markSignedOutByServer` from these screens | Move the unsaved-on-401 latch into shared (or compose it at the route), and wire create/rename 401 handling so Sign in shows the unsaved notice — without a classroom→auth import | New |
| R-03 | Minor | src/features/classroom/components/classroom-rename.test.tsx > test suite | Plan Step 5 asks for rename tests including a double-submit guard; rename code returns `LoadingScreen` while pending, but no rename test covers a second save while in flight (create has that case) | Add a rename double-submit test matching the create pattern | New |
| R-04 | Minor | src/routes/classrooms/new.tsx; src/routes/classrooms/$classroomId/route.tsx > route components | Only `/` gates on `isAuthenticated`. `/classrooms/new` and `/classrooms/$classroomId` render classroom screens with no signed-in check; unsigned visitors see the forms until an API call fails. Unit-of-work assigns `_authenticated` to U8, so this is deferred, not accidental | Accept as U8 work, or wrap these routes with the same signed-in composition used on `/` until U8 lands | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| `npx vitest run src/features/classroom` | PASS — 7 files, 33 tests passed (≈1.95s) | Unit-scoped suite green; matches code-summary claim |
| `npx vitest run && npx vite build` | PASS — 27 files, 140 tests passed; Vite production build succeeded (≈1.09s, 2388 modules) | Full suite stayed green; classroom routes and feature code compile into the client bundle |

### Summary

Classroom list/create/rename/layout matches the unit split (no sessions, name-only payloads, feature isolation via route composition), and both required verification commands pass. Two Majors remain: claim the deleted home placeholder in the source manifest, and close the FR7.4 session-expiry unsaved path without breaking the feature import boundary.
