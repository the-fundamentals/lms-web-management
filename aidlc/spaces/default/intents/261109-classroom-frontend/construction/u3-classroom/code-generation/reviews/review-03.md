## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-12T04:44:51Z
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
| R-09 | Critical | src/routes/index.tsx > HomePage; src/features/app-shell/components/overview-dashboard.tsx; src/routes/classrooms/index.tsx; aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/code-generation-plan.md > Steps 4, 8, 10 | Signed-in `/` renders `OverviewDashboard` with hardcoded sample KPIs (12 / 148 / 9 / 92%) and only a link to classrooms. The live list lives at `/classrooms`. That breaks FR1.1 and FR2.1 (home must open the same classroom list as Classrooms), unit-of-work U3 (signed-in home is this list), and Request Changes Step 10 (dashboard main = classroom summary + existing list — not fake Acme-style metrics). | Put the classroom list (and any real classroom summary derived from that list) back on signed-in `/` inside AppShell. Remove or replace the placeholder KPI overview so home and Classrooms open the same list. Align sidebar/create success navigation with that home. | New |
| R-10 | Critical | src/features/classroom/components/classroom-create.tsx; src/features/classroom/lib/classroom-api.ts > createClassroomBody / CreateClassroomInput; src/features/classroom/lib/upload-public-banner.ts; src/features/classroom/lib/classroom-payment.ts | Create uploads a banner and accepts `basePaymentPlan`, contradicting the plan (create `{ name }` only; do not upload banners; do not edit classroom price), U3/U6 ownership (Money owns price), and requirements (banner upload out of this version). | Strip banner upload and price fields from U3 create/API helpers so create posts name-only (or name plus only fields this unit is allowed). Leave price to U6 and banner upload out of scope. | New |
| R-11 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/code-summary.md > Files created/modified (`src/routes/index.tsx`); aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/traceability.json > FR1.1 | Code summary claims `/` is AppShell + `ClassroomList`. Traceability marks FR1.1 OK on `src/routes/index.tsx`. On disk that route mounts `OverviewDashboard`, so the claim and OK row are false. | Rewrite the summary to match the real home route, and retarget or reopen FR1.1 until `/` again lands on the classroom list. | New |
| R-12 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/construction/u3-classroom/code-generation/source-manifest.json > writes | Manifest omits application sources this unit clearly owns after the revision, including `src/routes/classrooms/index.tsx`, `src/features/app-shell/components/overview-dashboard.tsx`, `brand-mark.tsx`, `header-trail.ts` / test, `shell-profile.ts`, and classroom create helpers (`banner-key.ts`, `classroom-payment.ts`, `upload-public-banner.ts`, related tests). Gate binding can miss those paths. | Add every path this unit created or modified (or delete unused files), keeping earlier attempt paths. | New |

> R-01 Not re-checked this round

> R-02 Not re-checked this round

> R-03 Not re-checked this round

> R-04 Not re-checked this round

> R-05 Not re-checked this round

> R-06 Not re-checked this round

> R-07 Not re-checked this round

> R-08 Not re-checked this round

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| Stage-listed structural validators | None declared on code-generation stage frontmatter | No circular-dep / entity validator to run for this stage. |
| `npx vitest run src/features/classroom src/features/app-shell` | PASS — 12 files, 56 tests | Suite is green but does not assert FR1.1/FR2.1 home = classroom list; tests encode `/classrooms` as the list home and Overview as `/`. Passing tests do not refute the Critical findings. |

### Summary

Request Changes list search (`name` `like`), richer list/card fields, and List/Card with Table disabled are present, but signed-in `/` was replaced by a fake-KPI Overview and create crossed into banner/price owned by other units — so a developer cannot ship this unit as the approved U3 home/list contract.
