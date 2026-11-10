# Architecture Decisions

Drawn from `requirements.md` and the confirmed domain-design answers. These decisions are Proposed until this stage is approved.

## ADR-001: Split the frontend by feature

### Context

The teacher uses five slices, and each slice is reviewed before the next starts. Tools must be removable without taking classrooms, sessions, attendance, or money with it. Two features that import each other change together.

### Decision

The code is split into AppShell, Session, Classrooms, People, Schedule, Money, and Tools. A feature may import shared code and the generated client. A feature does not import another feature. AppShell is the only part that mounts a feature. Tools lives in its own feature folder. No other feature imports it.

### Consequences

A change to attendance stays in Schedule. Removing Tools means deleting that feature and the account-menu entry in AppShell. Shared loading, errors, and GMT+7 formatting live with AppShell's shared code, so the features do not each invent a second copy. A new cross-feature widget has to move into shared code instead of one feature importing another.

### Alternatives Rejected

- One teacher-app component plus Tools. Fewer folders, and a change to sign-in, attendance, and invoices would land in the same part.
- Letting features import each other. Shorter imports, and the slice boundaries would no longer hold.

## ADR-002: Each feature calls generated TanStack Query functions

### Context

The backend contract is `openapi.yml`. The owner asked for Hey API's generator with the TanStack Query plugin, writing useQuery functions into `src/generated`, with that folder gitignored. Sign-in, the 15-second wait, and the shared error screen still have to live in one place.

### Decision

Hey API's generator reads `openapi.yml` and writes TanStack Query useQuery functions into `src/generated`. Each feature calls those functions. Shared code configures the client: the base URL, the ADMIN bearer token, and the 15-second timeout. Features do not call fetch, and they do not call each other to reach the backend.

### Consequences

A spec change is regenerated instead of hand-edited. The generated folder is not reviewed as source. Until a feature is built, nothing calls the new functions. The client setup is one place, so a token or timeout change does not fan out across features. Generated names can change when the generator is upgraded, and every caller has to follow.

### Alternatives Rejected

- The linked OpenAPI TypeScript types library. It writes types and does not write a useQuery function per endpoint.
- One gateway component that is the only caller of the backend. Each feature would call the gateway, and the gateway would forward. That adds a pass-through without a rule the features do not already get from the generated functions.

## ADR-003: Classroom price stays on the classroom

### Context

Money edits the classroom's per-session price. People, Schedule, and Money all point at a classroom. An entity needs one owner.

### Decision

Classrooms owns the Classroom entity, including the per-session price. Money saves that price through the generated client. Money does not call the Classrooms component. A student price is a MemberPaymentPlan owned by Money. A student with no current price is shown as 0 VND, and the classroom price is not copied onto that student.

### Consequences

The classroom record has one owner. Money can still edit the price because both sides use the generated client and the server is the source of truth. A screen that needs the classroom name and the price reads the classroom from the generated client, not from a People or Money copy.

### Alternatives Rejected

- Money owns the classroom price as its own entity. The price would be a second copy of a field the classroom already stores.
- People owns the student price. The price is edited on the money slice, and the member list would change when a price changes.
