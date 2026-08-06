# AGENTS.md

## Cursor Cloud specific instructions

This is a single-package **client-side SPA** (React 19) using **TanStack Router**, **Bun** as the package manager, and **Vite 8** as the bundler. There is no co-located API service in this repo — the LMS backend is deployed separately; this app calls it from the browser.

### Running / building / testing

- Run scripts with Bun as documented in `README.md`, e.g. `bun --bun run dev` (dev server on port 3000), `bun --bun run build`, `bun --bun run test`.
- Lint is the enforced quality gate: `bun --bun run lint` (ESLint via `@tanstack/eslint-config`).
- `bun --bun run check` (`prettier --check .`) is NOT a reliable gate: it fails on pre-existing repo files (e.g. `package.json`, `README.md`, `tsconfig.json`), so a failure there does not indicate a regression.
- `bun --bun run test` runs Vitest; there are currently no test files, so it exits non-zero with "No test files found" — that is expected, not a failure of setup.

### Routing

- File-based routing. Route files live in `src/routes/`; `src/routeTree.gen.ts` is auto-generated — do not edit it by hand.
- The dev server regenerates the route tree automatically. When adding routes outside the dev server (e.g. before a standalone `build`/typecheck), run `bun --bun run generate-routes`.
- Client entry is `src/main.tsx`; `index.html` is the SPA shell.

### Styling / shadcn/ui

- Tailwind CSS **v4** (via `@tailwindcss/vite`). There is intentionally **no `tailwind.config.js`**; `components.json` has an empty `tailwind.config`.
- shadcn/ui is configured in `components.json` (radix-nova preset, `@/*` alias → `src/*`). Add components with `bunx --bun shadcn@latest add <name>`.
- Use the `@/` import alias for all app code (`src/`). Do not introduce a second alias.
- Prefer barrels for features (`@/features/auth`) and shared kits (`@/components/table`) over deep imports.- `src/styles.css` imports `shadcn/tailwind.css`, so the `shadcn` npm package is a required build dependency (do not remove it from `dependencies`).
- The shadcn CLI init flow is interactive (`@clack` prompts) and requires a real TTY; piping stdin does not work. It is already initialized, so re-init is not needed.

### TanStack Query

- `@tanstack/react-query` is wired in `src/main.tsx` via `QueryClientProvider`. The `queryClient` is also on router context (`createRootRouteWithContext` in `src/router.tsx`), so components can use `useQuery` directly.
