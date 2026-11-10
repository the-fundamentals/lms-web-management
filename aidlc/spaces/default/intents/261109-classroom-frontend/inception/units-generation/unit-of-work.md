# Units of Work

One Vite React site, one deploy. No server-side rendering. TanStack Query holds server data. TanStack Router uses its file-based defaults: routes in `src/routes`, generated tree at `src/routeTree.gen.ts`, and a leading `-` on a file that is not a route. No SSR. No virtual routes.

This split follows `requirements.md` and `components.md`. `components.md` left the shared client, loading, errors, and GMT+7 inside AppShell. The confirmed unit split names that code `u1-shared`, because a route directory that imported it from the app unit would cycle. The app unit keeps the root, the signed-in layout, and the generated tree.

This file does not choose which unit is built first.

## Units

| Unit ID | Directory | Kind | Deployment | Complexity |
|---|---|---|---|---|
| U0 | u0-design-system | library | shared | M |
| U1 | u1-shared | library | shared | M |
| U2 | u2-auth | ui | embedded | S |
| U3 | u3-classroom | ui | embedded | M |
| U4 | u4-members | ui | embedded | M |
| U5 | u5-schedule | ui | embedded | L |
| U6 | u6-payment | ui | embedded | L |
| U7 | u7-tools | ui | embedded | S |
| U8 | u8-app | ui | embedded | M |

Deployment `shared` means code inside this site that other units import. Deployment `embedded` means screens inside the same site. Nothing here is a separate server.

## What each unit owns

**U0 u0-design-system.** The Vite React app, Tailwind CSS, and shadcn/ui. shadcn's Vite template is used so the bundler and the styles are one setup. This unit writes the light and dark NFR3 values as CSS variables in the global stylesheet and adds the shadcn controls those variables style. Components live in `src/components/ui`, the CLI default, so this unit does not keep a second component folder. Later screens compose those controls with semantic color classes and gap. They do not add colors, padding, raw gray utilities, or a second bundler.

**U1 u1-shared.** The Hey API client: base URL, the bearer token, the 15 second timeout, and the generated functions in `src/generated`. GMT+7 formatting for instants. The shared loading screen and the shared error screen, built from the design-system components. TanStack Query's client. Route directories import this unit. This unit imports no route directory. It imports the design system.

**U2 u2-auth.** Sign in, the first-and-last-name form, and sign out. Sign-in uses react-oidc-context against Cognito Hosted UI (authorization code with PKCE). That library is used instead of a hand-written OIDC client because Cognito's hosted UI is standard OpenID Connect. The only signed-in role on screen is ADMIN. The token is not shown, not put in a URL, and not copied. These routes sit outside the signed-in layout, so they have no sidebar. Sign in says when a previous form was not saved.

**U3 u3-classroom.** The classroom list, create, and rename. The signed-in home is this list, so this unit owns that index route. The classroom layout route shows the classroom name and an outlet. It does not render sessions.

**U4 u4-members.** Active members, search of existing accounts, add as a student, remove with a named confirmation, and one member's attendance history, one page at a time.

**U5 u5-schedule.** The session overview, the GMT+7 month calendar, the weekly time, a new session, present and absent, the learning-note footnote, and complete or cancel. Session and weekly times are the calendar date and clock time the teacher entered. A session that crosses midnight is shown on the start date, with the end time carrying the next date.

**U6 u6-payment.** Whole VND, the classroom per-session price, a student's per-session price, the invoice list, New invoice, and approve, paid, and cancel. No Generate button.

**U7 u7-tools.** The Tools screen opened from the account menu. On a local setup it can generate sessions from a weekly time, and running it again does not duplicate a session the server already generated. It does not generate invoices. No other route directory imports this unit.

**U8 u8-app.** `main.tsx`, `__root.tsx`, the `_authenticated` layout, and `routeTree.gen.ts`. Providers for the router and the query client. The sidebar and the account menu. Query and router devtools sit here. Sign-in routes are not inside `_authenticated`, so they have no sidebar. Tools is an account-menu entry, not a sidebar entry.

The generated route tree imports every route file, including tools. That is why U8 depends on U7. No route directory imports U7. Removing Tools means deleting that route directory and regenerating the tree.

The classroom name and its sessions are one details view without a cross-import. U3's layout route shows the name and an outlet. U5's child routes render the sessions in that outlet. The generated tree nests those files. Neither file imports the other.

## Inside each unit

- U0: Vite React app, then Tailwind and shadcn, then the NFR3 tokens.
- U1: client and timeout, then loading and error screens from the design-system components, then GMT+7 formatting.
- U2: Cognito sign-in through react-oidc-context, then the name form, then sign out.
- U3: list and empty state, then create, then rename, then the home index.
- U4: member list, then add, then remove, then attendance history.
- U5: overview, then calendar, then weekly time, then a new session, then attendance.
- U6: classroom price and student price, then the invoice list, then New invoice, then status changes.
- U7: the Tools screen, then session generation, and no invoice generation.
- U8: providers, then the root, then the signed-in layout, then the generated tree.
