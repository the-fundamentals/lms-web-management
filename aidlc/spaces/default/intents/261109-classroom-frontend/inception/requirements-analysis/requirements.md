# Requirements

Drawn from `intent-statement.md` and `scope-document.md`, the approved sketches, and the answers in `requirements-analysis-questions.md`.

Two earlier scope sentences are replaced by those answers. The learning note is a footnote, not a saved field. Monthly invoices are created by the server, and this app does not generate them.

## Intent analysis

The owner is an English teacher and the only user for now. They are the only teacher and the only person who manages classes. This is not a business, and no other teachers are hired. The app replaces Excel for attendance and for money across classes. Success is a usable path through the five slices, most of the finished API on a screen, and one documented visual system. There is no calendar deadline. A short note is enough when a slice is usable.

## Functional requirements

### Sign in and home

**FR1.** The teacher can sign in, set a name once, and land on the classroom list.

**FR1.1.** Given a signed-out teacher, when they sign in with an account that already has a first and last name, then the app opens the classroom list.

**FR1.2.** Given a signed-in account with no profile yet, when sign-in finishes, then the app asks for a first name and a last name and, after both are saved, opens the classroom list. Email is taken from the sign-in token and is not edited here.

**FR1.3.** Given a signed-in teacher, when they choose Sign out, then protected screens are no longer shown and the app shows Sign in.

**FR1.4.** Given a call the server rejects as signed out, when the response arrives, then the app shows Sign in. It does not keep showing the previous protected screen.

**FR1.5.** The primary user of this site is signed in with the role ADMIN. That is the only signed-in role this version supports. The owner is that user, the only teacher, and the only person who manages classes. The app has no sign-in path for a hired teacher or for a student.

**FR1.6.** Sign-in is Amazon Cognito Hosted UI as an OpenID Connect authorization-code flow with PKCE. The scopes are openid, email, and profile. The auth unit uses react-oidc-context and does not implement the OIDC protocol itself. The access token from that library is the bearer token on later API calls.

### Classrooms

**FR2.** The teacher can see, create, and open classrooms.

**FR2.1.** The home screen and the Classrooms entry open the same list of classrooms.

**FR2.2.** Given no classrooms, when the list loads, then the screen says there are none and offers New classroom. This is distinct from a failed load.

**FR2.3.** Given a name of 1 to 255 characters, when the teacher creates a classroom, then the app saves it and returns to the classroom list, which includes the new classroom. A second click while the first save is in flight does not create a second classroom.

**FR2.4.** Given an empty or whitespace-only name, when the teacher submits, then the form names the name field, says it is required, and keeps every other value they typed.

**FR2.5.** Given a classroom, when the teacher opens it, then its details show its name and its sessions. Two classrooms with the same name stay as two rows.

**FR2.6.** Given a classroom, when the teacher changes its name and the save succeeds, then the list and the details show the new name.

### People

**FR3.** The teacher can add and remove people who already have accounts.

**FR3.1.** The people list shows active members of that classroom. A removed member is not in that list. An empty list says there are no people yet and offers Add.

**FR3.2.** Given a search, when the teacher looks for a person, then the results are accounts that already exist. The app does not create a login.

**FR3.3.** Given an existing account, when the owner adds them, then they are added as a student and appear on the people list. One save accepts at most 30 people. A person already in the class is not added again. The server error is shown and the list stays as it was. The server can store a teacher member, and this version does not offer that choice, because no other teacher is hired.

**FR3.4.** Given an active member, when the teacher removes them, then the app asks for confirmation that names that person. After confirmation, the person leaves the active list.

**FR3.5.** Given a member, when the teacher opens their attendance history, then the app shows that member's attendances, one page at a time, in the order the server returns.

### Schedule, sessions, and attendance

**FR4.** Inside one classroom, the teacher can set a weekly time, add a session, and mark attendance.

**FR4.1.** The classroom overview shows at most 10 sessions, split into Upcoming, Active, and Past. The order inside each group is start time, then session id. An empty overview says there are no sessions and offers New session.

**FR4.2.** The calendar shows that classroom's sessions on a month grid. The month is a calendar month in GMT+7. It is not a calendar of every class.

**FR4.3.** Given one or more weekdays plus a start and end time, when the teacher saves the weekly time, then those rows are stored. Saving the weekly time does not insert session rows.

**FR4.4.** Given a saved weekly time, when the teacher deletes it, then that weekly row is gone. Sessions already on the list stay.

**FR4.5.** Given a date plus a start and end, when the teacher creates a session, then that session appears on the overview and on the calendar. A second click during the save does not create a second session.

**FR4.6.** Given an open session, when the teacher marks a student Present or Absent and saves, then the server stores that status. A student left unmarked stays not yet marked. The save sends status only.

**FR4.7.** Given a session that is completed or cancelled, when the teacher opens it, then Present and Absent cannot be changed. The screen says the session is not open.

**FR4.8.** The attendance screen has no field for what the student learnt. A footnote on that screen says the note will be added when an attendance record can store it.

**FR4.9.** Given an open session, when the teacher marks it completed or cancelled, then the app asks for confirmation that names the session, and the overview shows the new status after success.

### Money

**FR5.** The teacher can set prices and work with invoices in Vietnamese dong.

**FR5.1.** Every amount the teacher sees or enters is a whole number of VND. The screen labels it VND and shows 0 as Free. The app does not offer another currency.

**FR5.2.** The classroom price is a per-session amount. Given a whole number of VND including 0, when the teacher saves it, then Money shows that amount. The billing type is per session.

**FR5.3.** Given a student, when the teacher saves a per-session price, then that price becomes the student's current price immediately and the previous current price is closed. The screen does not offer a future start date.

**FR5.4.** Given a student with no current price, when Money or a generated invoice shows their price, then the amount is 0 VND. The classroom price is not copied onto that student.

**FR5.5.** Money lists the classroom's invoices, including drafts the server created for the month. The app has no Generate button and does not call invoice generation.

**FR5.6.** Given a student and at least one line, when the teacher chooses New invoice, then the app creates an adhoc draft for that student and opens it. A second click during the save does not create a second invoice.

**FR5.7.** Given a draft, when the teacher approves it, then its status becomes Approved. Given an approved invoice, when the teacher marks it paid, then they enter the amount paid in whole VND and choose Bank, Cash, or Other. The amount paid may be lower than the invoice total. Given a draft or an approved invoice, when the teacher cancels it, then the app asks for confirmation and the status becomes Cancelled. A paid or cancelled invoice is not edited.

**FR5.8.** Given no invoices, when Money loads, then the screen says there are none and offers New invoice. This is distinct from a failed load.

### Time

**FR6.** Class times are shown and entered in GMT+7.

**FR6.1.** Every date and clock time the teacher reads or enters is labeled GMT+7. Values sent to and read from the server are instants in UTC, converted at the boundary. Vietnam has no daylight-saving change, so the offset is +07:00 all year.

**FR6.2.** A session's calendar day is the civil date of its start in GMT+7. A session that crosses midnight is shown on the start date and the end time carries the next date when the end falls on that date.

### Shared screen behavior

**FR7.** Loading, empty, and failure are different, and a save does not discard or duplicate the teacher's input.

**FR7.1.** A screen that is still waiting shows the shared loading screen. A screen that loaded with nothing to show uses that screen's empty state. A screen that failed shows the shared error screen, says what failed, and offers a way to try again. Sign in and Your name use their own forms and have no sidebar.

**FR7.2.** Given a request with no response for 15 seconds, when that time is reached, then the waiting screen becomes the error screen with a way to try again. A later response for that same request is ignored.

**FR7.3.** Given invalid input, when the save is rejected, then the message names the field and the form keeps what the teacher typed.

**FR7.4.** Given a form with unsaved changes, when the teacher navigates away, then the app asks before leaving. Given a session that expires while a form is open, when the app returns to Sign in, then Sign in says the entries on the previous form were not saved.

**FR7.5.** Given a list where one request fails and another succeeds, when the screen renders, then it shows the part that loaded and names the part that failed. It does not present a partial total as the full total.

### Tools and API coverage

**FR8.** Finished classroom, people, schedule, session, attendance, and invoice operations have a screen path, except the exclusions in Out of scope.

**FR8.1.** Tools is in the account menu, not in the sidebar.

**FR8.2.** Given the app is pointed at a local developer setup, when the teacher runs Generate sessions from Tools, then the app calls session generation from the weekly time. Running it again does not duplicate a session the server already generated for the same classroom, weekly row, and date. The screen says the run finished. When the app is not on that local setup, Tools says session generation is unavailable.

**FR8.3.** Tools does not generate invoices, and no other screen does either.

**FR8.4.** These operations each have a screen path: get and update the signed-in profile names, search accounts, list and create and get and update classrooms, set the classroom price, list and add and remove members, list and create a student's price, list and create and delete a weekly time, list and create and get and update and complete and cancel sessions, list and create and update attendance, list a member's attendances, and list, get, create, update, approve, mark paid, and cancel invoices.

## Non-functional requirements

**NFR1.** Layouts are specified for a browser window 1280 CSS pixels wide. At that width, every action in FR1 through FR8 is reachable without horizontal scrolling of the page.

**NFR2.** The app meets WCAG 2.1 Level AA for the screens in this version. Every action is reachable by keyboard. Text contrast meets that level. Present, absent, and not yet marked are not indicated by color alone.

**NFR3.** One palette, one type scale, and one spacing scale are the only colors, text styles, padding, and radius on the screens. A screen that uses a color, text size, padding, or radius outside this list fails this requirement. The values live as CSS variables in the global stylesheet. Components use the semantic names (`background`, `foreground`, `primary`, and the rest below). They do not use one-off hex values or raw gray utilities.

Light palette, as hex:

- background `#F6F1E7`, foreground `#1F1A14`
- card `#FFFCF6`, card foreground `#1F1A14`
- primary `#0E6B62`, primary foreground `#F6F1E7`
- secondary `#E6DDD0`, secondary foreground `#1F1A14`
- muted `#EFE8DC`, muted foreground `#5E574E`
- accent `#E7D7A8`, accent foreground `#1F1A14`
- destructive `#8E2F2F`, destructive foreground `#F6F1E7`
- border `#D8CFC2`, ring `#0E6B62`

Dark palette, same roles:

- background `#1A1714`, foreground `#F6F1E7`
- card `#24201C`, card foreground `#F6F1E7`
- primary `#3DADA3`, primary foreground `#1A1714`
- secondary `#3A342C`, secondary foreground `#F6F1E7`
- muted `#2C2824`, muted foreground `#C4B8A8`
- accent `#C4A86A`, accent foreground `#1A1714`
- destructive `#E07A7A`, destructive foreground `#1A1714`
- border `#3A342C`, ring `#3DADA3`

Type scale: page title 24px semibold, section title 18px semibold, body 16px, secondary text 14px. UI text uses Figtree. Page titles use Newsreader.

Spacing scale: 8px tight, 16px stack, 24px page and card padding, 32px section break. Stacks use gap, not a margin between siblings. Radius is 8px. Control height is 36px. Focus uses the ring color.

**NFR6.** The app is styled with Tailwind CSS. Shared controls come from shadcn/ui and are composed, not redrawn. The design-system unit installs both, writes the NFR3 variables into the global stylesheet, and includes the light and dark sets. A later unit does not add a second palette, a second spacing scale, or a second component library. Status is never color alone. The required layout check stays the 1280px width in NFR1.

**NFR7.** The app is a React application built with Vite. It does not use server-side rendering. The design-system unit creates that Vite app. A later unit does not add a second bundler.

**NFR4.** The sign-in token is not placed in a URL, not shown on screen, and not written into a message the teacher can copy from the app.

**NFR5.** Names and notes the teacher types, including Vietnamese characters, are shown and saved unchanged. The app does not strip diacritics.

## Constraints

- This repository is the frontend. Behavior the server rejects cannot be saved by the app.
- The contract is `openapi.yml` in this repository. Classroom, member, schedule, session, attendance, and invoice calls require an admin token. A forbidden response uses the shared error screen.
- The primary current user has the role ADMIN. This version supports only that signed-in role. The owner is that user, the only teacher, and the only person managing. It is not a business, and no teachers are hired.
- Amounts are the API's integer units. For VND, one unit is 1 đồng. The app does not use floating point for money.
- The session-generation helper is detachable: removing Tools does not remove classrooms, sessions, attendance, or Money.
- The owner will choose TanStack products in the design phase, and those products' debugging tools are integrated there. This stage does not pick the rest of the stack.
- The five slices ship in order, and each is reviewed before the next starts: sign in and home, classrooms, people, attendance with calendar and weekly time, then money.

## Assumptions

- **A1.** The server stores instants in UTC. Reason: the owner said to assume that.
- **A2.** A missing student price is 0 VND on a generated invoice. Reason: the server's monthly job uses the student's current price, or 0 when they have none. The app does not invent an "unknown" amount.
- **A3.** An unmarked student stays not yet marked. Reason: that is an attendance status the server already stores, and the owner did not ask to force Present or Absent.
- **A4.** 15 seconds is long enough to treat a call as failed. Reason: a waiting screen has to end. The owner can change the number later.
- **A5.** 1280 CSS pixels is the laptop width this version is built for. Reason: the owner asked for laptop first and did not name a device.
- **A6.** The monthly invoices appear because a server job creates them. Reason: the owner chose that over a Generate button.
- **A7.** The primary user is signed in with the role ADMIN, and the app does not grant that role. Reason: the owner said the current user of the site has the role ADMIN, they are the only teacher, and they are the only person managing. Whether that login already carries ADMIN on the server is still unchecked.

## Out of scope

- A stored learning note, and any input for one, until the attendance record has a field for it.
- Creating a new account or inviting someone by email.
- A signed-in role other than ADMIN, including a hired teacher who manages a class, and adding a classroom member as a teacher.
- Google Meet links, sending them, and attendance taken when someone joins.
- An end-of-month tuition email.
- Uploading or changing a classroom banner or a profile image, and the storage test calls.
- A currency switcher, and any currency other than VND.
- A Generate control for invoices, including the local-only invoice helper.
- A calendar or session list that mixes every classroom.
- A separate layout for windows under 1280 CSS pixels.
- Offline editing, a local queue of saves, and live updates across two browser tabs.
- Deleting an attendance row. The teacher changes status instead, while the session is open.
- Browsing replaced student prices as their own task. The current price is the one Money uses.
- Retention, export, and erasure of student data. The server owns stored records.
- Model-generated text. This app does not produce any.

## Open questions

- Whether the owner's existing login already has the role ADMIN on the server. This version's user is that role. Until it is present, classroom screens fail with the shared error screen.
- The palette and type-scale values. NFR3 requires one document. The values are chosen when the screens are built.
