# Code Generation Plan Approval

AI-DLC writes this file when it asks you to approve the plan. To answer here
instead of in chat, write your answer after `[Answer]:` and tell me in chat when you are done.

## Plan Approval

Approve the code plan for u6-payment?

- Builds: classroom **Money** — whole VND amounts, classroom per-session price, student per-session price, invoice list (including server-created drafts), New invoice (adhoc draft), approve / mark pa...
- Touches: new `src/features/payment/` (`components/`, `lib/`); enable **Money** tab in `classroom-layout.tsx` with URL `/classrooms/$classroomId/money` (same pattern as Members/Sessions); thin route...
- Does **not** call `generateClassroomInvoices` or show a Generate control (FR5.5, FR8.3). Does not mark session attendance (U5) or Tools session generation (U7). Classroom-wide Attendance tab stays ...
- Tests: vitest under `src/features/payment/` (~36–48 unit + 2–3 integration).
- Already changed before you approved (3 files): .env, eslint.config.js, package-lock.json.

Full plan: aidlc/spaces/default/intents/261109-classroom-frontend/construction/u6-payment/code-generation/code-generation-plan.md
Test instructions: aidlc/spaces/default/intents/261109-classroom-frontend/construction/u6-payment/code-generation/unit-test-instructions.md

[Approval Fingerprint]: sha256:v3:ff855b1ea1075a95aa465eadbc71794e28342e74bce99643039646963c7616eb
[Planned Source]: a1d0f193dbca71f2b48294effba8dddcc0ead4b3effc487dc65f9b552780387c

- A. Approve Plan
- B. Request Changes
- C. I'll edit the files

[Answer]: A. Approve Plan
