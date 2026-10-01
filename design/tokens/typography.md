## Typography tokens

Source of truth in code: `src/styles.css` (`@theme inline`, logo helpers) + Tailwind text utilities. Font package: `@fontsource-variable/inter`.

### Base settings

- **Font family (sans + heading)**: `'Inter Variable', sans-serif`
  - CSS: `--font-sans`, `--font-heading` (heading currently aliases sans)
  - Applied on `html` via `font-sans`
- **Base size**: `16px` (browser default; Tailwind `text-base`)
- **Default line height**: Tailwind default (~`1.5` for body utilities)
- **Logo tracking**: `-0.03em`, weight `700` (`.fundamentals-logo`)

### Roles → sizes

Map UI text to these roles instead of one-off `font-size` values.

| Role | Approx size | Weight | Tailwind / code | Use |
| --- | --- | --- | --- | --- |
| `heading-xl` | 24px (`1.5rem`) | semibold (`600`) | `text-2xl font-semibold tracking-tight` | Page titles (e.g. Schedule) |
| `heading-m` | 20–22px | semibold | `text-xl` / `text-lg font-semibold` | Section headings |
| `body` | 16px | regular (`400`) | `text-base` | Primary content |
| `body-small` | 14px (`0.875rem`) | regular | `text-sm` | Forms, tables, nav labels, most UI chrome |
| `caption` | 12px (`0.75rem`) | regular / medium | `text-xs` | Metadata, menu hints, calendar event labels |
| `caption-dense` | 11px (`0.6875rem`) | medium | calendar slot / today number | Dense timetable chrome only |

### Logo scale (brand wordmark)

| Role | Size | Class |
| --- | --- | --- |
| `logo-sm` | `1rem` | `.fundamentals-logo--sm` |
| `logo-md` | `1.35rem` | `.fundamentals-logo--md` |
| `logo-lg` | `clamp(1.75rem, 4.5vw, 2.25rem)` | `.fundamentals-logo--lg` |

Mark square uses `--primary`; text uses `--foreground`.

### Usage rules

1. Prefer `text-sm` for dense LMS chrome; reserve `text-base` for long-form / marketing surfaces.
2. One `heading-xl` per page.
3. Do not introduce a second font family unless this doc is updated first.
4. Avoid raw `font-size` in feature CSS except documented calendar density overrides.
