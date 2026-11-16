# Build Instructions

## Prerequisites

- Node.js matching the project toolchain (`mise.toml` / local install)
- npm dependencies from the repo root
- Copy `.env.example` → `.env` and set:
  - `VITE_COGNITO_AUTHORITY`
  - `VITE_COGNITO_CLIENT_ID`
  - `VITE_API_BASE_URL`
  - `VITE_PUBLIC_ASSET_BASE_URL` (optional; public asset CDN for banner/avatar keys)

Missing Cognito env is handled at runtime with an error screen; build does not require filled values.

## Dependency installation

```bash
npm ci
```

Or `npm install` when lockfile drift is intentional.

## Generated API client

`src/generated/` is gitignored. Regenerate when OpenAPI changes:

```bash
npm run generate:api
```

Build and Vitest expect that client to exist (or be mocked in tests).

## Build

```bash
npx vite build
```

Equivalent: `npm run build`.

## Build verification

- Exit code `0`
- `dist/` contains hashed assets and `index.html`
- No TypeScript/Vite errors in stdout/stderr

## Local preview (optional)

```bash
npm run preview
```

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Cannot find module '@/generated/...'` | Client not generated | `npm run generate:api` |
| Cognito error screen on load | Empty `.env` Cognito vars | Fill `.env` from `.env.example` |
| Vitest alias/`@/` resolve fail | Wrong cwd | Run from repo root |
| Lockfile / peer warnings | Node or npm mismatch | Align with `mise.toml` / CI Node |
