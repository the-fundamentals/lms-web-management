# Scope Definition Questions

## Q1. [Product owner] What should the first usable slice be?

You are happy when attendance and finance work for students in different classes, and most of the finished APIs are on the frontend. This chooses what that first slice contains.

A. Attendance first, including the learning note, then finance
B. Finance first (payment plans and invoices), then attendance
C. Classrooms, people, schedule, and sessions first, because attendance depends on them, then attendance and finance
D. A thin slice of all of it: one classroom, its students, one session's attendance, and that classroom's invoices
E. Not yet defined
X. Other (please specify)

[Answer]: X. A login page, then onboarding, then viewing a general dashboard. That's the first slice. The second one is viewing classrooms and creating classrooms and viewing their details. Then there's complex classroom details like classroom member management. Attendance and classroom calendar and schedule is one slice, and finally, finances is one slice

## Q2. [Product owner] Are all five slices must-have for this version?

You named five slices, in order: login, onboarding, and a dashboard; classrooms; members; attendance with the calendar and schedule; finances. This decides whether that whole sequence is this version, or only the earlier slices.

A. All five slices are must-have, in that order
B. Stop after classrooms and members. Attendance and finances wait
C. All five slices, and also your profile and file storage
D. All five slices, without profile or file storage
E. Not yet defined
X. Other (please specify)

[Answer]: A. Yep, all 5 slices are must haves. But stop and review after each slice is completed.

## Q3. [Product owner] Should developer-only helpers appear in the app?

The API includes helpers that generate sessions from a schedule and generate invoices. Those are not the later tuition email.

A. No. I use the normal classroom screens. Those helpers stay out of the app
B. Yes. I want a way to run them from the app
C. Not yet defined
D. None
E. Not applicable
X. Other (please specify)

[Answer]: X. Absolutely. They should have helpers. But make them stay out of the main screen. In the design phase, I'll tell you to use tanstack products, so their devtools should be well integrated into the system for debugging Also, if possibly, make these helpers loosely coupled and detachable so I can move them from project to project easily

## Requested Changes Feedback

[Answer]: Also, if possibly, make these helpers loosely coupled and detachable so I can move them from project to project easily

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

