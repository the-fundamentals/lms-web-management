# Intent Capture Questions

## Sources

- [desc] Initial description: "This repository is for the frontend of the Classroom Management System. A large portion of the backend has already been implemented and lives in the openapi.yml spec."
- [scope] Workflow-selected scope: `express`.

## Q1. [Product owner] What problem is this frontend for?

The repository is the Classroom Management System frontend, and a large part of the backend already lives in openapi.yml. This answer is what the first version is trying to fix.

A. People who run classrooms lack one place to do that day-to-day work
B. Students or families lack a clear way to see and act on their classes
C. Both the people who run classrooms and the people in them
D. An existing manual process should move into this app
E. Not yet defined
X. Other (please specify)

[Answer]: X. The problem I'm having is that I am way too lazy to track student attendance in Excel. So I want something that's automated.

## Q2. [Product owner] Who feels that problem, and how?

This names the customer for the first version and the pain the app should remove.

A. Internal staff only, slowed down by scattered classroom administration
B. External users only (students, parents, or customers), who cannot see or do what they need
C. Both internal staff and external users
D. Just me, for classrooms I run myself
E. Not yet defined
X. Other (please specify)

[Answer]: X. I am an English teacher. The problem I'm having is that I am way too lazy to track student attendance in Excel. So I want something that's automated. This app is simply only for me.

## Q3. [Product owner] What does success look like for this first version?

Later stages use this to judge whether the frontend is done enough.

A. I can finish the main classroom workflow in the app without leaving it
B. The screens cover what the existing API already supports, and each one works against that API
C. Someone else can use it without me walking them through the steps
D. It is enough to demonstrate the idea, not to run a real classroom
E. Not yet defined
X. Other (please specify)

[Answer]: X. Success means I can finish most of the main classroom workflow (the current backend isn't 100% finished yet). The screens look good from the getgo, and there's a consistent and documented design and color palette.

## Q4. [Product owner] Why start this now?

The trigger says whether this is a live need, a personal trial, or both.

A. A classroom I am involved with needs this app
B. The backend API is ready, so the missing piece is the frontend
C. This is mainly a personal project and a trial of the development process
D. Both a real classroom need and a personal trial
E. Not yet defined
X. Other (please specify)

[Answer]: C. This is mainly a personal project and a trial of the development process. I also want to get this done and working since I've been procrastinating on it because of the frontend. I don't wanna code frontend

## Q5. [Product owner] Who are the stakeholders, and what does each care about?

A stakeholder is anyone whose needs this frontend has to respect. This answer becomes the stakeholder map.

A. I am the only stakeholder: owner, developer, and user, and I care that the app matches the API
B. I build it; teachers or administrators use it and care that daily work is fast
C. I build it; students or families use it and care that their class information is clear
D. Several groups (staff, students or families, and me) with different needs
E. Not identified
X. Other (please specify)

[Answer]: X. I am the only stakeholder here. I am the only person who is important. This app is simply only for me. And I am the only one who is going to use it. For now. In the future, it might extend.

## Q6. [Product owner] Who decides what this first version includes, and who else influences that?

Later priority calls follow this answer.

A. I decide alone, and nobody else influences it
B. I decide, and I will check with the people who use the classrooms
C. A school, client, or other owner decides, and I advise
D. Not identified
E. Not applicable
X. Other (please specify)

[Answer]: X. I am the only stakeholder here. I am the only one who is going to use it. For now. In the future, it might extend.

## Q7. [Product owner] How should progress be communicated, and how often?

This records whether anyone besides you needs a status update while the frontend is built.

A. No separate status reports; I will review each step here
B. A short note when a usable slice of the app is ready
C. A regular update on a schedule I will name under Other
D. None
E. Not applicable
X. Other (please specify)

[Answer]: B. A short note when a usable slice of the app is ready

## Q8. [Product owner] What should this first version leave out?

The development plan is already chosen. This question is only about the product: what the first frontend should not try to do, even if openapi.yml already describes it.

A. Only the smallest path that proves the app works against the existing API
B. The day-to-day classroom workflow, and nothing around it
C. Staff-facing screens only
D. Cover what the API spec already exposes, and leave out only what that spec does not
E. Not yet defined
X. Other (please specify)

[Answer]: X. Not for this version: automatically generate Google Meet classroom links and send them to students, and when they join, automatically take attendance. That is backend, later, only when I prompt for it. Not for this version: an end-of-month email of tuition fees per student. That is not implemented yet. Right now, the features that are currently supported are documented in openapi.yml.

## Q9. [Product owner] You said this first version is done whenever you're happy, and you didn't name anything to drop. What boundary should I write down?

That line doesn't name a feature to leave out. This answer is the product boundary later stages will use.

A. No fixed cut list. This version tracks what students have learnt, attendance, and money, and it stops when you're happy with that
B. Those three are in. Leave out every other area for this version
C. Not yet defined
D. None
E. Not applicable
X. Other (please specify)

[Answer]: X. I'm happy when: I can perform attendance tracking and finance management for my students in different classes. (+ you've implemented most of the finished backend apis on the frontend) The end-of-month tuition email is not this version. Right now, the features that are currently supported are documented in openapi.yml.

## Q10. [Product owner] Does tracking what students have learnt belong in this first version?

You first said you have trouble tracking what students have learnt, as well as attendance and money. The bar you just set names attendance and finance for students in different classes, plus most of the finished backend APIs on the frontend. This decides whether learning tracking is in or out.

A. Yes. Learning tracking is in, along with attendance and finance
B. No. This version is attendance and finance. Learning tracking waits
C. Only where a finished backend API already covers it, as part of implementing most of those APIs
D. Not yet defined
E. Not applicable
X. Other (please specify)

[Answer]: X. Nope. Just attendance. Each attendance should have a note. In there, I'll just jot down a short note on what they lkekarnt

## Q11. [Product owner] The pasted requirements are already in the summary. Keep the earlier points too?

The paste covers Excel attendance, later Google Meet attendance, a later tuition email, the current OpenAPI features, and that only you use the app for now. These earlier answers are still in the summary: an attendance note for what they learnt, finance for students in different classes, a documented design and color palette, and that you do not want to code the frontend.

A. Keep all
B. Use only the paste
C. Not yet defined
D. None
E. Not applicable
X. Other (please specify)

[Answer]: A. Keep all

## Consolidated Summary Confirmation

Does this all look correct before I generate the artifact?

- Looks correct
- Request changes

[Answer]: Looks correct

## Requested Changes Feedback

[Answer]: Here's just a summary of my requirements again. Again, this is a classroom management system. The problem I'm having is that I am way too lazy to track student attendance in Excel. So I want something that's automated. In the future, one of the features that we will have, and this is not for you to implement right now, but when I prompt you to do so, is to automatically generate Google Meet classroom links and send them to students, and when they join, it should automatically take attendance. That is something that I will do on the backend side. I don't want you to care about that, but that's just for you to imagine what I'm trying to do here. At the end of the month, I want to have an email system, right? And again, this is not implemented yet, that will send me, like the tuition fees for each student. So maybe student A has to pay X amount, student Y has to pay Y amount, or something like that. Okay? Right now, the features that are currently supported, you can see them in the openapi.yaml file. All of it is documented right there. A little bit, I, might be a bit unrealistic, so feel free to ask me any questions about it if you need. And yeah, I am the only stakeholder here. I am the only person who is important. This app is simply only for me. And I, I am the only one who is going to use it. For now. In the future, it might extend.
