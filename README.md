# LMS Web Management

Management console for The Fundamentals LMS — TanStack Router (React 19) + Bun + Vite 8. Client-side SPA; no SSR.

## Getting started

```bash
bun install
cp .env.example .env   # fill in Cognito OIDC values
bun --bun run dev      # http://localhost:3000
```

## Scripts

| Script | Purpose |
|--------|---------|
| `bun --bun run dev` | Dev server (port 3000) |
| `bun --bun run build` | Production static build |
| `bun --bun run preview` | Preview production build |
| `bun --bun run lint` | ESLint (enforced quality gate) |
| `bun --bun run generate-routes` | Regenerate `src/routeTree.gen.ts` |
| `bun --bun run test` | Vitest (no test files yet) |

## Project layout

```text
index.html         # SPA shell
src/
  main.tsx         # Client entry (RouterProvider + QueryClientProvider)
  router.tsx       # Router instance
  routes/          # File-based routes (thin wiring)
  features/        # Product domains (auth today; more as pages grow)
  components/
    ui/            # shadcn primitives
    table/         # Shared DataTable kit — import from @/components/table
    layout/        # App shell (sidebar, nav)
    brand/         # Brand marks
  lib/             # Shared utilities (e.g. cn)
  hooks/           # Cross-feature hooks
```

- Import app code with `@/` only (maps to `src/`).
- Prefer feature barrels (`@/features/auth`) and the table barrel (`@/components/table`) over deep paths.

## Auth

Cognito OIDC via `oidc-client-ts`. Config is loaded from `VITE_COGNITO_*` env vars (see `.env.example`). Login UI lives under `src/features/auth/`.

## Routing

TanStack Router file-based routes in `src/routes/`. Do not edit `src/routeTree.gen.ts` by hand — run `generate-routes` or start the dev server.

Deploy as a static SPA: configure your host/CDN to rewrite unknown paths to `index.html` so client-side routes work on direct navigation.

## Styling

Tailwind CSS v4 + shadcn/ui (radix-nova). Theme tokens live in `src/styles.css`. Add shadcn components with:

```bash
bunx --bun shadcn@latest add <name>
```

## Learn more

- [TanStack Router](https://tanstack.com/router)
- [Vite](https://vite.dev)
