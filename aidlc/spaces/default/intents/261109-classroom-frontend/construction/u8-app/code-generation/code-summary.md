# Code Summary: u8-app

## Files created/modified

App roof already existed from earlier units; this unit finalizes ownership and gap-fill tests.

- `src/main.tsx` — QueryClient + Auth + Router; DEV-only `DevtoolsHost` dynamic import.
- `src/routes/__root.tsx` — root Outlet.
- `src/routeTree.gen.ts` — generated tree (unchanged this unit; no tools route).
- `src/features/app-shell/**` — AppShell, sidebar (Overview / Classrooms / New classroom), NavUser + Sign out, header trail, overview dashboard.
- `src/devtools/**` — TanStack Query/Router/Form + LMS panel (DEV only).
- Gap-fill: `app-shell.test.tsx` asserts no Tools account control (U7 cancelled).

## Key implementation decisions

- No `_authenticated` route file: signed-in pages wrap `AppShell` locally (existing pattern kept).
- No Tools menu / `/tools` route — U7 cancelled; FR8.1 deferred.
- Sign-in and onboarding stay outside AppShell (no sidebar).
- TanStack Devtools stay behind `import.meta.env.DEV` dynamic import.

## Test coverage summary

| Command | Result |
|---|---|
| `npx vitest run src/features/app-shell` | green (incl. no-Tools assertion) |
| `npx vitest run && npx vite build` | Construction Verification Command |

## Deviations

- Unit-of-work named a dedicated `_authenticated` layout; shipping keeps per-route AppShell wrap to avoid a large route-tree refactor with no FR gain.
