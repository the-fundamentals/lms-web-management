# Intent Backlog

Drawn from `intent-statement.md` and `scope-document.md`. Priority is MoSCoW. The owner fixed the order, and there is one user, so the slices are not scored with WSJF or RICE.

## Persona

The owner: an English teacher tracking their own classes. They want attendance and money handled without a spreadsheet, and they do not want to code the frontend.

## Must have

| Slice | What it covers | Why it is must-have |
| --- | --- | --- |
| 1. Enter the app | Login, onboarding, general dashboard | Nothing else is usable until they are in |
| 2. Classrooms | View, create, and open a classroom | Attendance and money are per class |
| 3. Members | Add and manage the people in a classroom | Attendance is per student |
| 4. Attendance | Attendance with a short learning note, plus the classroom calendar and schedule | This replaces the spreadsheet |
| 5. Finances | Payment plans and invoices for students in different classes | Money tracking is part of being happy with this version |
| Helpers | Generate sessions from a schedule, and generate invoices, off the main screen, loosely coupled where possible | The owner asked for them, kept out of the main flow |

The design and color palette are part of every slice, not a slice of their own. Most finished backend capabilities should show up as the slices land, not as a separate slice.

## Won't have this time

- Google Meet links, sending them, and attendance taken when a student joins.
- The end-of-month tuition email.
- Profile and file storage as their own slice.
- The items under "Later, ignore for now" in `scope-document.md`. Noted, not in this version's work.

## Order and review

Build 1, then 2, then 3, then 4, then 5. Stop and review after each slice is completed. Slice 4 depends on classrooms, members, and a schedule. Slice 5 depends on classrooms and members, and comes after attendance because that is the order the owner chose.
