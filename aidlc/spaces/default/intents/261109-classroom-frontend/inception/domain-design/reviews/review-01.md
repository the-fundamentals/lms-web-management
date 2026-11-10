## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-architecture-reviewer-agent
**Date:** 2026-11-10T17:27:45Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/inception/domain-design/components.md > Classrooms behaviour and AppShell depends_on Classrooms | Opening a classroom has no single screen owner. FR2.5 says the details show the classroom name and its sessions, and traceability assigns that requirement to Classrooms. Classrooms' behaviour only covers the list, create, and rename. Schedule owns the sessions and the overview, and never shows the classroom name. AppShell's edge to Classrooms says it shows the classroom list as home and as Classrooms, while Classrooms' edge back says AppShell shows a classroom's details. Features are not allowed to import each other, and nothing says which component draws the screen that contains both the name and the sessions. | Name the one component that owns the classroom detail screen. State how the name and the session list reach that screen through the generated client, without one feature importing another. | New |
| R-02 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/inception/domain-design/decisions.md > ADR-001 Consequences | Shared GMT+7 formatting, loading, and errors are placed in AppShell's shared code, and AppShell already depends on every feature. ADR-001 also says a feature may import shared code and may not import another feature. Every feature's depends_on list is empty, so none of them depend on AppShell. A feature that imports that formatting from AppShell cycles with AppShell's dependency on the feature. The catalogue never names a shared module that is not the AppShell component. | Name a shared module that is not AppShell. Put client setup, GMT+7 formatting, and the shared screens there. Say each feature may import that module and the generated client, and that AppShell stays the only component that mounts a feature. | New |
| R-03 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/inception/domain-design/components.md > AppShell behaviour | Three shared screen rules are traced to AppShell and are missing from its behaviour, so each feature would invent its own. Invalid input must name the field and keep what the teacher typed (FR7.3); only the empty classroom name says anything like this. A dirty form must ask before leaving (FR7.4); Session only has the sign-in sentence that unsaved entries were not saved. When one request fails and another succeeds, the screen must show the part that loaded, name the part that failed, and must not present a partial total as the full total (FR7.5). That rule is not on AppShell or on any list feature. | Add those three rules to the shared place from the previous finding. Keep the expired-session sentence on Session, and say AppShell's navigation is what returns the teacher there. | New |
| R-04 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/inception/domain-design/components.md > ClassroomMember references | AccountProfile is the signed-in ADMIN teacher's name, owned by Session, and Session's behaviour only covers that profile. ClassroomMember still references AccountProfile as "each member is an account that already exists," and People is the component that searches those accounts. That reads as two owners for an account: Session, and People. | State that AccountProfile is only the signed-in profile and that a member stores the server's account id, or state that AccountProfile means any account, People reads those accounts through the generated client, and Session edits only the signed-in one. | New |
| R-05 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/inception/domain-design/components.md > AppShell behaviour | AppShell says instants are shown and entered as GMT+7, then says a session and a weekly time are sent as the calendar date and clock time the teacher entered. FR6.1 says values sent to the server are UTC instants, converted at the boundary. FR6.2, a session that crosses midnight shown on the start date with the end time carrying the next date, is traced to AppShell and is not stated on AppShell or on Schedule. Schedule is the component that builds those values and has no time rule. | Say which session and weekly-time fields are civil GMT+7 values and which are UTC instants, and put the midnight-crossing display rule on the component that renders the session. | New |
| R-06 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/inception/domain-design/components.md > Session external_dependencies | Session depends on both LmsCoreApi and SignInProvider. The confirmed choice is that each feature calls Hey API functions generated from openapi.yml. Nothing says whether sign-in is one of those functions or a different system. | Say that sign-in goes through the generated client, or name what Session calls SignInProvider for besides holding the bearer token. | New |

### Validation Tool Results

| Tool | Result | Interpretation |
|---|---|---|
| none | not run | the stage lists no validation tools |

### Summary

The seven components form an acyclic shell around five slices plus a removable Tools feature, and the entity references resolve. A developer still cannot place the classroom detail screen, the shared client and formatting module, or the dirty-form and partial-failure rules without guessing, so this is not ready to build from.
