# Requirements Analysis Questions

## Q1. [Product owner] What currency are the prices in?

Prices are whole numbers of the smallest unit. This names the currency the teacher sees.

A. Vietnamese dong
B. US dollars
C. I will name the currency
D. Not yet defined
X. Other (please specify)

[Answer]: Default to VND. No need to worry about this too much yet.

## Q2. [Product owner] What time zone are class times in?

A session has a date and a start and end time. This says which clock those times use.

A. Vietnam (Asia/Ho Chi Minh)
B. The time on my laptop, with no named zone
C. I will name the zone
D. Not yet defined
X. Other (please specify)

[Answer]: Vietnam time. Assume that the backend runs in UTC. I want a smooth workflow, so make sure it's clear that we're using GMT+7

## Q3. [Product owner] What happens to the learning note until it can be stored?

The note is on the attendance screen. Storing it was left for later, because an attendance record does not have a note yet.

A. Show the note. It lasts until I leave the screen
B. Show the note, and saving it is part of this version
C. Hide the note until it can be stored
D. Not yet defined
X. Other (please specify)

[Answer]: Ah okay, just leave it as a footnote. I'll add the note field later

## Q4. [Product owner] How does an invoice get created?

The Money screen can open an invoice and move it from draft to approved, paid, or cancelled. This chooses what creates it.

A. Only the Tools helper
B. The Tools helper, and also New invoice on Money
C. Only New invoice on Money
D. Not yet defined
X. Other (please specify)

[Answer]: So there are two flows: 1) Automated invoice generation per month, and 2) adhoc invoices. Both of these are core flows, so no tools helper here yet

## Q5. [Product owner] Where does a month's invoice come from?

Monthly generation and adhoc invoices are both core flows, with no Tools helper. Creating one adhoc invoice is a normal call. The month's invoices are created by a server job. This app can trigger that job only through the local-only helper, which the approved scope keeps off the main screen.

A. The server creates the month's invoices. Money lists them. This app has no Generate button. Adhoc invoices are New invoice on Money.
B. Money has a Generate this month button that uses the local-only helper.
C. A Generate button on Money is in this version, and it needs a backend change first.
D. Not yet defined
X. Other (please specify)

[Answer]: The server creates the month's invoices. Money lists them. This app has no Generate button. Adhoc invoices are New invoice on Money.

## Consolidated Summary Confirmation

- Prices are Vietnamese dong. This version has no currency switcher.
- Class times show as GMT+7. The backend clock is UTC.
- The attendance screen has no learning-note box. A footnote says that field comes later.
- The server creates each month's invoices. Money lists them. There is no Generate button.
- An adhoc invoice is created with New invoice on Money. The Tools helper does not create invoices.

Does this all look correct before I generate the requirements artifact?

- Looks correct
- Request changes

[Answer]: Looks correct
