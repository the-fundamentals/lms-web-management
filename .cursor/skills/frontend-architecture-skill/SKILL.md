---
name: frontend-architecture
description: Use when structuring a frontend codebase. Covers module and folder organization, state boundaries, data-fetching layers, build configuration, and keeping a large application navigable. Trigger on "how should i structure this frontend", "our components folder is a mess", "where should data fetching live", "set up a frontend monorepo". Do not use for component-level state and hooks — see the react skill.
metadata:
  category: frontend
  version: 1.1.0
  tags: [architecture, structure, state, bundling, monorepo]
---

# Frontend Architecture

## Purpose

Structure a frontend so that a new engineer can find the code for a feature in under a minute, and so that changing one feature does not require touching five others.

## When to Use

- Starting a new frontend application.
- A codebase where features are scattered across `components/`, `utils/`, `hooks/`, and `types/`.
- Deciding where state belongs and what owns data fetching.
- Setting up a monorepo or splitting a large application.

## Capabilities

- Feature-based organization and module boundaries.
- State layering: server cache, global client state, feature state, component state.
- Data-access layer design and API client structure.
- Build configuration, code splitting, and bundle budgets.
- Monorepo structure and shared package design.

## Inputs

- The application's feature set and team structure.
- Current pain: where changes ripple, what is hard to find.
- Build tooling and deployment target.

## Outputs

- A folder structure organized by feature, not by file type.
- Explicit rules for what may import what.
- Bundle budgets enforced in CI.

## Workflow

1. **Organize by TanStack Router file route, not by kind** — A route directory under `src/routes/` holds that feature's screens and private files. `components/`, `hooks/`, and `api/` each containing a slice of every feature is the layout to avoid. TanStack Router file routes are the feature folders. A parallel `features/` tree is not used.
2. **Draw the import rules** — A route directory may import from `shared/`. A route directory may not import another route directory; if two need the same thing, it moves to `shared/`. Enforce this with a lint rule, not a convention document.
3. **Layer the state deliberately** — Server data in a query cache. Genuinely global client state (theme, session) in one store. Everything else stays local. Most "global state" is server state in disguise.
4. **Centralize the API client** — One place that knows about base URLs, auth headers, error mapping, and retries. Feature code calls typed functions, not `fetch`.
5. **Budget the bundle** — Set a size limit per route and fail the build when it is exceeded. Bundle size regresses one dependency at a time.

## Best Practices

- A `utils/` folder is where code goes to be forgotten. If a function belongs to a feature, keep it in the feature.
- Barrel files (`index.ts` re-exporting everything) defeat tree-shaking and create import cycles. Import from the source module.
- File-based routing code-splits each route. Component-level splitting rarely pays for itself.
- Do not put server data in a global store. It has staleness, refetch, and error semantics that a store does not model — you will rebuild a query library, badly.
- A shared component library inside the app is fine. Extracting it into a package before a second consumer exists is premature.
- Keep the dependency count low. Every dependency is bundle weight, a supply-chain risk, and a future migration.

## Examples

**TanStack Router defaults.** File-based routing. No custom routes directory and no virtual file routes. Generator defaults: `routesDirectory` `./src/routes`, `generatedRouteTree` `./src/routeTree.gen.ts`, `routeFileIgnorePrefix` `-`, `indexToken` `index`, `routeToken` `route`, single quotes, no semicolons, target `react`. Do not edit `routeTree.gen.ts`.

```text
src/
  main.tsx                         # createRouter and providers
  routeTree.gen.ts                 # generated from src/routes. Do not edit.
  routes/
    __root.tsx                     # root layout
    sign-in.tsx                    # public auth route
    _authenticated.tsx             # pathless signed-in layout
    _authenticated/
      classroom/
        index.tsx                  # /classroom
        -list.tsx                  # not a route. A leading "-" is the default ignore prefix.
      members/
      schedule/
      payment/
      tools/
  shared/
    ui/                            # design-system primitives
    api/                           # http client, auth, error mapping
    lib/                           # genuinely cross-cutting helpers
```

```javascript
// eslint.config.js — the boundary is enforced, not merely documented.
// Repeat the zone for each route directory.
{
  rules: {
    "import/no-restricted-paths": ["error", {
      zones: [{
        target: "./src/routes/_authenticated/classroom",
        from: [
          "./src/routes/sign-in.tsx",
          "./src/routes/_authenticated/members",
          "./src/routes/_authenticated/schedule",
          "./src/routes/_authenticated/payment",
          "./src/routes/_authenticated/tools",
        ],
        message: "A route directory must not import another. Move shared code to src/shared.",
      }],
    }],
  },
}
```

**A bundle budget that fails the build:**

```json
{
  "bundlesize": [
    { "path": "dist/assets/index-*.js", "maxSize": "180 kB", "compression": "brotli" },
    { "path": "dist/assets/checkout-*.js", "maxSize": "90 kB", "compression": "brotli" }
  ]
}
```

## Notes

- The single most effective architectural rule in a frontend codebase is "route directories may not import each other". It is trivially enforceable and prevents the coupling that makes large frontends unchangeable.
- Analyze the bundle before optimizing it. `vite-bundle-visualizer` or `source-map-explorer` will usually show one date library or one icon set accounting for a third of the payload.
- Monorepos solve a versioning problem between packages. If you have one application, a monorepo is overhead with no corresponding benefit.