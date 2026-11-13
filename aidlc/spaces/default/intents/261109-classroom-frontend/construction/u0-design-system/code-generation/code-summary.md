# Code Summary: u0-design-system

## Files created/modified

Created the Vite React app in this repository (one app, no second folder):

- `vite.config.ts` points `@/` at `src/` and loads Tailwind and React.
- `index.html` and `src/main.tsx`. The entry renders nothing. There is no screen, no `src/routes/`, and no signed-in layout.
- `tsconfig.json`, `tsconfig.app.json`, and `tsconfig.node.json` with the `@/*` path.
- `components.json` uses TypeScript, CSS variables, and `src/components/ui`. Style is `new-york`. No community registry.
- `src/index.css` holds the NFR3 light and dark hex values, an 8px radius, Figtree and Newsreader, the type classes, and the 8/16/24/32px spacing note.
- `src/components/ui/button.tsx`, `alert.tsx`, and `skeleton.tsx`. `cn` lives in `src/shared/lib/cn.ts`, which is the shadcn utils alias.
- Tests: `src/components/theme.test.ts` and the three `src/components/ui/*.test.tsx` files.

`package.json` keeps `generate:api` and `typescript` at `6.0.3`, and still depends on the packages that were already there. Vitest aliases no longer send `@/components/ui/skeleton`, `alert`, or `button` to `src/shared/ui/test-doubles`. `@/` resolves to `src/` in Vite and in Vitest. No coverage threshold is set.

`.gitignore`, `AGENTS.md`, `README.md`, `mise.toml`, and `openapi.yml` were not edited.

## Key implementation decisions

Colors are the NFR3 hex values on the semantic CSS variables. Popover, input, chart, and sidebar variables reference those roles so the stylesheet does not carry a second palette. The default button size stays Tailwind `h-9`, which is 36px. Figtree and Newsreader are installed from `@fontsource`, not a CDN.

## Test coverage summary

No coverage threshold is set. This scope has no line-coverage floor.

| Command | Result |
|---|---|
| `npx vitest run src/components/theme.test.ts` | 1 file, 5 passed |
| `npx vitest run src/components/ui` | 3 files, 15 passed |
| `npx vitest run src/components` | 4 files, 20 passed |
| `npx vitest run src/shared` | 9 files, 45 passed |

The shared suite was 9 files and 45 passed before this unit, and the same after the test-double aliases were removed. Tests do not call the network or Cognito. Theme tests read `src/index.css` from disk.

## Tests not executed

None of the commands named for this unit were skipped.

## Deviations

- `npx shadcn@latest init --template vite` prompts for a component library and a preset, and it scaffolds a child folder only when `package.json` is absent. This repo already had `package.json`, so Vite and Tailwind were added here. Init then ran as `npx shadcn@latest init --template vite --css-variables --no-monorepo --yes --force --no-reinstall button`. No `--preset` and no `--base`. The `button` argument skips the preset prompt. `components.json` was written first so TypeScript, CSS variables, and `src/components/ui` were set without further prompts. The CLI rewrote the style to `new-york` and installed Radix.
- `button`, `alert`, and `skeleton` were added before the theme tests so `npx vitest run src/shared` could resolve the real modules. The theme tests were written and run before the control tests.
- Theme tests use `process.cwd()` to read the stylesheet. Vitest does not expose this file as a `file:` URL.
