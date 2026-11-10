## Review

**Verdict:** NOT-READY
**Reviewer:** aidlc-product-lead-agent
**Date:** 2026-11-10T10:54:28Z
**Iteration:** 1
**Verdict Dictated:** no

### Findings

| ID | Severity | Location | Finding | Required action | Status |
|---|---|---|---|---|---|
| R-01 | Critical | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > Classroom overview | The attendance path opens a session from the classroom list or from a marked day, but those screens do not create one. The empty list tells the teacher to add weekly times under Calendar. Calendar stores days and a start and end time, and a day with no session does nothing. The set-the-week flow then says a marked day opens its session. The only create controls are on Tools: "Generate sessions from the weekly time" and "Generate invoices", each ending in "Done." Money's empty state is "No invoices yet" and offers no create action. Scope says both generators run only in a local developer setup and are not fitted to the schedule, session, or invoice screens yet. As drawn, the core job — open a session and mark the class — depends on a step the empty states never name, and on a second story in which weekly times themselves produce sessions. | Choose one way a session is created in this version, and one way an invoice is created. Make the classroom empty state, Calendar, Money, and Tools tell that same story. Say on Tools whether those buttons exist only in a local developer setup. | Unresolved |
| R-02 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > Session | Save on the session screen keeps the learning note. The field is "what they learnt", and the attendance flow says the marks and notes stay on that session. Scope says the note has nowhere to be saved, the attendance record only stores whether the student was there, away, or not yet marked, and saving the note is later. The note is still wanted on this screen. The sketch treats it as stored. | State on the session screen whether the note is kept after Save. If saving is still later, show the note as not kept. If it is kept now, say the earlier deferral no longer applies. | Unresolved |
| R-03 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > App shell | The sidebar lists Classrooms, and the classroom screen is "opened from a classroom on Overview or Classrooms", but no Classrooms screen is drawn. Overview is already a list of classrooms with a student count and New classroom. The next design has to invent what Classrooms shows, or copy Overview. | State whether Classrooms is the same list as Overview. If it is a different screen, sketch it, including the empty state and what a row opens. | Unresolved |
| R-04 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > How the screens behave | The success row says the screen does not jump away. Sign in, Your name, and New classroom only finish by leaving the page. The first-visit flow lands on Overview. Cancel on New classroom returns to the list. Where Create lands is not drawn. | Say where Sign in, Continue, and Create go on success. Limit "does not jump away" to saves that stay on the same screen, such as attendance. | Unresolved |
| R-05 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > Money | The finance slice is payment plans and invoices. This screen shows a classroom price per session, a per-student price, and invoices. It never says that price is the payment plan, and it shows no plan name or other plan choice. | Say whether a single price per session is the payment plan for this version. If a plan is more than that price, sketch the missing choice. | Unresolved |
| R-06 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > People | Add someone asks for Student or Teacher. Scope describes adding a student by picking an account that already exists. The only person using the app for now is the owner. A Teacher choice is co-teacher management this version does not describe. | Keep Teacher only if a second teacher can be added now. Otherwise the choice is Student. | Unresolved |
| R-07 | Minor | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > Session | Present and Absent can both be left empty. The screen does not say whether Save is allowed while a student is unmarked, or what an unmarked student means. Scope's attendance record includes "not yet marked" beside there and away. The confirmed answer also says an "optional reason", while the field drawn here is the learning note. | State whether every student must be Present or Absent before Save, and what an unmarked student is stored as. Say whether the optional note is the learning jot, a reason for the mark, or both. | Unresolved |
| R-08 | Major | aidlc/spaces/default/intents/261109-classroom-frontend/ideation/rough-mockups/wireframes.md > Something went wrong | A whole screen now waits on one Loading screen and fails on one Something went wrong screen ("This screen could not be loaded", Try again, Back to overview). Overview, the classroom session list, the session, and Money still describe their own bars and their own sentences ("Classrooms could not be loaded", "Sessions could not be loaded", "Invoices could not be loaded"). Those are a second design for the same wait and the same failed load. Both new screens are drawn inside the sidebar. Sign in and Your name have no sidebar, and their wait is a button label. Back to overview has nowhere to go when Overview is the screen that failed. | For each screen, say whether waiting uses the Loading screen or the bars or button already on that screen, and whether a failed load uses Something went wrong or the sentence already written there. Keep Sign in and Your name on their own forms, without the sidebar. Say where Back to overview goes when Overview failed to load. | New |

> R-01 Reviewer note: The empty session list still sends the teacher to weekly times. Calendar still opens a day only when a session already exists. Tools still generates sessions and invoices, with no line that those buttons are local-only.

> R-02 Reviewer note: The session field is still the learning note, and the attendance flow still says the notes stay after Save.

> R-03 Reviewer note: The sidebar still lists Classrooms, and no Classrooms screen is drawn.

> R-04 Reviewer note: Success still says the screen does not jump away. Create still has no landing screen.

> R-05 Reviewer note: Money still shows a price per session and does not mention a payment plan.

> R-06 Reviewer note: Add someone still asks for Student or Teacher.

> R-07 Reviewer note: Save still allows Present and Absent both to be empty. The note is still only described as what they learnt.

### Summary

The general Loading and Something went wrong screens are in the sketches, and field mistakes stay on the form. They disagree with the older per-screen loading and error lines, and the open blockers are unchanged: a session and an invoice still have no single way to be created, the learning note is still saved, and Classrooms still has no screen.
