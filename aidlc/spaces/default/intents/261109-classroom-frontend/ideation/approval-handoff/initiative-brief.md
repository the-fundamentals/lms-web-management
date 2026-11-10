# Initiative Brief

Drawn from `intent-statement.md`, `stakeholder-map.md`, `scope-document.md`, `intent-backlog.md`, and `wireframes.md`.

## Intent

This is the frontend for a classroom management system. The owner is an English teacher who finds attendance in Excel too much work and wants it automated, and also wants to manage money for students in different classes. The screens should look good from the start, with a consistent, documented design and color palette. It is done when the owner is happy. There is no deadline.

## Who decides

The owner is the only stakeholder and the only user for now. They are also the only developer. A short note is enough when a usable slice is ready. The app might extend to other people later.

## Market and feasibility

This plan has no market research and no feasibility study. The reason to build it is the owner's own need, not a market case.

## Scope

Five slices, in order, each reviewed before the next:

1. Sign in, onboarding, and the home screen.
2. Create a classroom, see the list, open the classroom.
3. Members. Adding someone means a person who already has an account.
4. Attendance, the calendar, and the schedule. A recurring schedule is the weekly time. An adhoc schedule is one new session. Attendance is present or absent, plus an optional note of what the student learnt.
5. Finances. A payment plan is that student's price per session. Invoices can be drafted, approved, marked paid, or cancelled.

Developer helpers stay off the main screens, opened from the account menu. Where they can be lifted into another project, they should be.

Later, and not this version: Google Meet links and automatic attendance, and an end-of-month tuition email.

## Sketches

The sketches in `wireframes.md` are the structure: which screens exist, and how the eight flows move between them. The built screens can differ in layout, wording, and detail. Laptop first. Mobile web later. The look is professional, with a hint of creativity, and it gets settled while the slices are built.

## Known risks

Accepted with the sketches. They do not block the handoff.

- A one-day session can be created from the classroom. The weekly time does not itself add those rows. Invoices are still started from Tools.
- The attendance screen shows the learning note as something that is saved. Saving it was also left for later.
- Some success lines still disagree about whether the screen stays put.
- The members flow adds a student. The People sketch still offers Teacher.
- An unmarked student has no stated meaning.
- Loading and Something went wrong are the general screens. Some screens still describe their own waiting and error lines.
- Money shows a classroom price and a student price. Only the student price is named as the plan.
- Left for later, from the API check: the note may have nowhere to be stored, a new student login cannot be created, there is no calendar across all classes, the generate actions exist in a local setup, and the classroom screens need an admin login.

## Team

One person. No separate team. Build one slice at a time, and stop for review after each.

## Recommendation

Go. The intent, the scope, and the sketches are approved. The open notes stay risks, not work that has to finish before the build plan.
