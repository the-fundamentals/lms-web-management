# Code Summary: u6-payment

## Files created/modified

Money lives under `src/features/payment/`. Classroom Settings lives under `src/features/classroom/` (rename + URL link to pricing — no payment import).

- `payment/lib/vnd.ts`, `payment-api.ts` — VND/Free; plan + invoice SDK wrappers; never `generateClassroomInvoices`.
- `invoice-list.tsx` — Money home: pricing summary card + gear + invoice list.
- `pricing-summary-card.tsx` — classroom default readout; gear → `/settings/pricing`.
- `money-pricing.tsx` — edit classroom default + student overrides (Settings route).
- `invoice-create.tsx` / `invoice-detail.tsx` — adhoc create + lifecycle; Back → invoices.
- Routes: `money/` → invoices; `money/invoices/`; `settings`; `settings/pricing`.
- `classroom-layout.tsx` — Money → invoices; **Settings** tab; Overview without rename.
- `classroom-settings.tsx` — rename + Pricing → `/settings/pricing`.
- `eslint.config.js` — payment zones; `routeTree.gen.ts` regenerated.

## Key implementation decisions

- Money intent = invoices; pricing edit lives under Settings (`/settings/pricing`).
- Settings uses left-nav + pane shell (General / Pricing); classroom never imports `@/features/payment`.
- Student missing plan → Free display; never copy classroom base in UI (FR5.4).

## Test coverage summary

| Command | Result |
|---|---|
| `npx vitest run src/features/payment` | green (unit + integration) |
| `npx vitest run && npx vite build` | Construction Verification Command |

## Deviations

- Earlier plan estimated higher test counts; shipped focused suite covering FR paths.
- Money UX revised twice from checkpoint feedback (pages → invoices-first + Settings hub).
