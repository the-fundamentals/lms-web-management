# Wireframes

Drawn from `intent-statement.md`, `scope-document.md`, and `intent-backlog.md`.

Sketches for a laptop. Mobile web comes later: the sidebar collapses and the content stacks. No colors here. The later look is professional, with a hint of creativity, and we adjust it as the screens take shape.

The sidebar is Overview and Classrooms. Tools are not in it. They open from the account menu.

## Sign in

```
+------------------------------------------------------------------+
| Sign in                                                          |
+------------------------------------------------------------------+
|                                                                  |
|  Email                                                           |
|  [ .......................................................... ]  |
|                                                                  |
|  Password                                                        |
|  [ .......................................................... ]  |
|                                                                  |
|  [ Sign in ]                                                     |
|                                                                  |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 "Sign in". Landmark is main. Keyboard starts on Email.

Empty does not apply. Loading replaces the button label with "Signing in" and keeps the fields. Error sits under the form in text: "That email or password did not match." Partial: a long email stays inside the field and can be scrolled.

## Your name

Shown once, when this person has signed in and has no name on file yet.

```
+------------------------------------------------------------------+
| Your name                                                        |
+------------------------------------------------------------------+
|                                                                  |
|  First name                                                      |
|  [ .......................................................... ]  |
|                                                                  |
|  Last name                                                       |
|  [ .......................................................... ]  |
|                                                                  |
|  [ Continue ]                                                    |
|                                                                  |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 "Your name". Landmark is main. Keyboard starts on First name.

Error: "Add both names." The button stays available so the message can be read. Loading: "Saving".

## App shell

```
+------------------------------------------------------------------+
| Classroom                                              Account v |
+------------------+-----------------------------------------------+
| Overview         |                                               |
| Classrooms       |   (the open screen)                           |
|                  |                                               |
+------------------+-----------------------------------------------+
```

Accessibility: header holds the product name and Account. The sidebar is nav. The open screen is main. The first keyboard stop is "Skip to content", then the sidebar.

Account opens a small menu: Tools, Sign out. Tools is the only way to the helper screen.

## Overview

The home screen, and the classroom list. Classrooms in the sidebar opens this same list. A row opens that classroom. Not a cross-class calendar.

```
+------------------------------------------------------------------+
| Classroom                                              Account v |
+------------------+-----------------------------------------------+
| Overview         | Overview                                      |
| Classrooms       |                                               |
|                  | Monday conversation            8 students     |
|                  | Tuesday writing                6 students     |
|                  |                                               |
|                  | [ New classroom ]                             |
+------------------+-----------------------------------------------+
```

Accessibility: heading is h1 "Overview". Landmarks are header, nav, main. Keyboard starts at Skip to content.

Empty:

```
+------------------------------------------------------------------+
| Overview                                                         |
|                                                                  |
| No classrooms yet.                                               |
| [ New classroom ]                                                |
+------------------------------------------------------------------+
```

Loading: gray bars in place of the classroom rows. Error: "Classrooms could not be loaded." with [ Try again ]. Partial: one classroom is a single row. A very long name is cut, and the full name shows on focus.

## New classroom

```
+------------------------------------------------------------------+
| New classroom                                                    |
+------------------------------------------------------------------+
|                                                                  |
|  Name                                                            |
|  [ .......................................................... ]  |
|                                                                  |
|  [ Create ]    Cancel                                            |
|                                                                  |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 "New classroom". Landmark is main. Keyboard starts on Name.

Error: "Add a name." Cancel returns to the list without saving. Create returns to the classroom list.

## Classroom overview

Opened from a classroom on Overview or Classrooms. About ten sessions, the most recent, marked Upcoming, Active, or Past.

```
+------------------------------------------------------------------+
| Monday conversation                                    Account v |
| Sessions   People   Calendar   Money                             |
+------------------------------------------------------------------+
| Upcoming                                                         |
| Tue 11 Nov   18:00-19:00   Active                    [ Open ]    |
| Thu 13 Nov   18:00-19:00   Upcoming                  [ Open ]    |
| Past                                                             |
| Thu 6 Nov    18:00-19:00   Past                      [ Open ]    |
|                                                                  |
| [ New session ]                                                  |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 with the classroom name. The row Sessions, People, Calendar, Money is nav. The list is main. Keyboard starts on Sessions.

Empty: "No sessions yet." [ New session ] creates one day. The weekly time is under Calendar. Loading: bars in place of rows. Error: "Sessions could not be loaded." with [ Try again ]. Partial: a single session is one row. More than ten are not shown. The rest are on Calendar.

## New session

One class on one day. Create returns to this classroom's session list.

```
+------------------------------------------------------------------+
| New session                                                      |
+------------------------------------------------------------------+
|                                                                  |
|  Date                                                            |
|  [ 2026-11-11 ............................................... ]  |
|                                                                  |
|  Start                                                           |
|  [ 18:00 .................................................... ]  |
|                                                                  |
|  End                                                             |
|  [ 19:00 .................................................... ]  |
|                                                                  |
|  [ Create ]    Cancel                                            |
|                                                                  |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 "New session". Landmark is main. Keyboard starts on Date.

Error: "Add a date, a start, and an end." Cancel returns to the session list.

## People

```
+------------------------------------------------------------------+
| Monday conversation                                              |
| Sessions   People   Calendar   Money                             |
+------------------------------------------------------------------+
| [ Add someone ]                                                  |
|                                                                  |
| Lan Nguyen          Student                          [ Remove ]  |
| Minh Tran           Student                          [ Remove ]  |
+------------------------------------------------------------------+
```

Add someone opens a search of people who already use the app. Pick one, choose Student or Teacher, then Add. Remove asks "Remove Lan Nguyen from this classroom?" with Remove and Cancel.

Accessibility: heading is h1 with the classroom name. People is the current nav item. Keyboard starts on Add someone.

Empty: "No one here yet." and the same Add button. Error on search: "No one matched that name."

## Calendar

A month. Days with a session are marked. Click a session to open it. The weekly times sit above the month: which days, and the start and end time.

```
+------------------------------------------------------------------+
| Monday conversation                                              |
| Sessions   People   Calendar   Money                             |
+------------------------------------------------------------------+
| Weekly time                                                      |
| Tue, Thu    18:00-19:00                          [ Edit times ]  |
|                                                                  |
| November                                                         |
| Mon   Tue   Wed   Thu   Fri   Sat   Sun                          |
|             1     2     3     4      5                           |
| 6     7*    8     9*    10    11     12                          |
|                                                                  |
| * session that day. Click it to open the session.                |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 with the classroom name. Calendar is the current nav item. The month is main. Keyboard moves across days with the arrow keys, and Enter opens the session on that day.

Empty weekly time: "No weekly time yet." and [ Add times ]. A day with no session does nothing. A day with two sessions lists both before opening one.

## Session

Reached from a row on the classroom overview, or from a day on the calendar. Every student is on this screen. Present or Absent, plus an optional note for what they learnt.

```
+------------------------------------------------------------------+
| Tue 11 Nov  18:00-19:00                                          |
| Monday conversation                          [ Back to class ]   |
+------------------------------------------------------------------+
| Student            There?              Note, optional            |
| Lan Nguyen         ( ) Present         [ learnt the past... ]    |
|                    ( ) Absent                                    |
| Minh Tran          ( ) Present         [ .................... ]  |
|                    ( ) Absent                                    |
|                                                                  |
| [ Save ]                                                         |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 with the date and time. Landmark is main. Keyboard starts on the first Present choice. Arrow keys move between Present and Absent. The note is the next stop for that student.

Empty: "No students in this classroom yet." with a link to People. Loading: bars in place of rows. Error: "Attendance could not be saved." The marks stay on screen. Partial: one student is one block. A long note stays in its field. A class of many students scrolls. The Save button remains at the end of the list.

## Money

```
+------------------------------------------------------------------+
| Monday conversation                                              |
| Sessions   People   Calendar   Money                             |
+------------------------------------------------------------------+
| Price per session                                                |
| Classroom     150,000                           [ Change ]       |
| Lan Nguyen    150,000                           [ Change ]       |
| Minh Tran     200,000                           [ Change ]       |
|                                                                  |
| Invoices                                                         |
| Lan Nguyen    November    Draft      600,000    [ Open ]         |
| Minh Tran     November    Approved   800,000    [ Open ]         |
+------------------------------------------------------------------+
```

An open invoice shows who, the period, the amount, and a note. Draft can be approved or cancelled. Approved can be marked paid or cancelled. Paid and cancelled can be read, not changed.

Accessibility: heading is h1 with the classroom name. Money is the current nav item. Keyboard starts on the first Change.

Empty prices: the classroom price is 0, shown as free, until it is set. Empty invoices: "No invoices yet." Error: "Invoices could not be loaded." with [ Try again ].

## Tools

Opened from Account, not from the sidebar.

```
+------------------------------------------------------------------+
| Tools                                                            |
+------------------------------------------------------------------+
|                                                                  |
|  [ Generate sessions from the weekly time ]                      |
|  [ Generate invoices ]                                           |
|                                                                  |
|  [ Back to overview ]                                            |
+------------------------------------------------------------------+
```

Accessibility: heading is h1 "Tools". Landmark is main. Keyboard starts on the first button.

Each button asks before it runs. Success is a short line: "Done." Error: "That did not run." with [ Try again ].

## Loading

One screen for the whole app. It shows whenever a screen is still on its way. A button that is working keeps its own "Signing in" or "Saving" label. This screen is for the wait, not for that.

```
+------------------------------------------------------------------+
| Classroom                                              Account v |
+------------------+-----------------------------------------------+
| Overview         |                                               |
| Classrooms       |   Loading                                     |
|                  |                                               |
|                  |   [ .................. ]                      |
|                  |   [ .............. ]                          |
|                  |   [ .................... ]                    |
|                  |                                               |
+------------------+-----------------------------------------------+
```

Accessibility: heading is h1 "Loading". Landmarks are header, nav, and main. The bars are hidden from the keyboard. Keyboard stays on Skip to content until the screen arrives.

## Something went wrong

One screen for when a whole screen cannot be shown. A mistake in a field stays on that form, next to the field. This screen is for a failed load.

```
+------------------------------------------------------------------+
| Classroom                                              Account v |
+------------------+-----------------------------------------------+
| Overview         |                                               |
| Classrooms       |   Something went wrong                        |
|                  |                                               |
|                  |   This screen could not be loaded.            |
|                  |                                               |
|                  |   [ Try again ]                               |
|                  |   Back to overview                            |
|                  |                                               |
+------------------+-----------------------------------------------+
```

Accessibility: heading is h1 "Something went wrong". Landmarks are header, nav, and main. The sentence is text, not color alone. Keyboard starts on Try again.

## How the screens behave

| State | What the person sees |
| --- | --- |
| Loading | The Loading screen when a whole screen is on its way. A busy button only changes its label |
| Success | The new row, or "Saved" next to the action. The screen does not jump away |
| Error | The Something went wrong screen when a whole screen fails. A field mistake stays on the form |
| Empty | One sentence and the button that creates the first item |
| Partial | One row looks like many rows. Long names are cut until focus. Long lists scroll |
