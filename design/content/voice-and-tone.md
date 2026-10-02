## Voice and tone

Generic microcopy patterns: `.cursor/rules/frontend/ux-writing-and-microcopy.mdc`. This file is **product-specific**.

- **Audience**: teachers, coordinators, and staff running classrooms (not end learners in this app).
- **Brand**: The Fundamentals — practical, calm, professional; not playful or salesy inside the console.

### Voice principles

- **Plain language**: Prefer simple words over LMS jargon when a plain word works.
- **Active voice**: “Save changes” / “Add student”, not “Changes will be saved”.
- **Concrete**: Say what happened and what to do next.
- **Dense UI**: Short labels; put detail in helper text or confirm dialogs, not in button chrome.

### Domain terms (use consistently)

| Prefer | Avoid |
| --- | --- |
| Classroom | Class (ambiguous), Cohort (unless API uses it) |
| Session | Lesson (unless product decides otherwise) |
| People | Members (unless distinguishing roles) |
| Schedule | Calendar (UI may show a calendar; nav label stays Schedule) |
| Finances / payment plan | Billing (reserved if we add org billing later) |

### Examples

- Weak: “An error occurred.”
- Strong: “Could not load this classroom. Try again.”

- Weak: “Submit”
- Strong: “Create classroom” / “Add student” / “Mark complete”

### Tone adjustments

- **Routine actions**: Neutral and concise (`text-sm` chrome).
- **Errors**: Calm and specific; no blame.
- **Destructive / irreversible** (cancel session, undo payment plan): Confirm dialog with clear consequence in the title/body.
