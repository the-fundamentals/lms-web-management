## Color tokens

Source of truth in code: `src/styles.css` (`:root` / `.dark`). Stack is shadcn radix-nova + CSS variables (OKLCH). Do not invent one-off hex/oklch values in components when a token below covers the role.

### Brand direction

- **Accent family**: teal / cyan (`hue ~223` in light, `~224` in dark).
- **Sidebar brand tint**: `#007595` (`--sidebar-tint`).
- **Neutrals**: near-achromatic surfaces and text (shadcn `neutral` base).
- Soft fills and charts are derived from `--primary` via `color-mix`, not separate brand colors.

### Semantic roles → CSS variables

| Role | CSS variable(s) | Light | Dark | Use |
| --- | --- | --- | --- | --- |
| `color-bg-surface` | `--background` | `oklch(1 0 0)` | `oklch(0.145 0 0)` | Page / app background |
| `color-bg-elevated` | `--card`, `--popover` | `oklch(1 0 0)` | `oklch(0.205 0 0)` | Cards, dialogs, menus |
| `color-bg-subtle` | `--muted`, `--accent`, `--secondary` | muted/accent `oklch(0.97 0 0)`; secondary `oklch(0.967 0.001 286.375)` | muted/accent `oklch(0.269 0 0)`; secondary `oklch(0.274 0.006 286.033)` | Grouped / quiet surfaces |
| `color-fg-default` | `--foreground` (+ card/popover fg) | `oklch(0.145 0 0)` | `oklch(0.985 0 0)` | Primary text |
| `color-fg-muted` | `--muted-foreground` | `oklch(0.556 0 0)` | `oklch(0.708 0 0)` | Secondary text, metadata |
| `color-accent-primary` | `--primary` | `oklch(0.52 0.105 223.128)` | `oklch(0.45 0.085 224.283)` | Primary actions, key highlights |
| `color-accent-primary-fg` | `--primary-foreground` | `oklch(0.984 0.019 200.873)` | same | Text/icons on primary |
| `color-accent-primary-hover` | `--primary-hover` | mix primary 82% + foreground | mix primary 88% + white | Hover on primary controls |
| `color-accent-primary-soft` | `--primary-soft` | mix primary 14% + background | mix primary 22% + background | Soft primary fills / washes |
| `color-accent-primary-softer` | `--primary-softer` | mix primary 7% + background | mix primary 12% + background | Auth / onboarding washes |
| `color-border-subtle` | `--border`, `--input` | `oklch(0.922 0 0)` | border `oklch(1 0 0 / 10%)`; input `oklch(1 0 0 / 15%)` | Borders, dividers, inputs |
| `color-border-focus` | `--ring` | `oklch(0.708 0 0)` | `oklch(0.556 0 0)` | Focus rings |
| `color-border-critical` | `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Errors, destructive actions |

### Sidebar (chrome)

| Token | CSS variable | Notes |
| --- | --- | --- |
| Brand tint | `--sidebar-tint` | `#007595` (light + dark) |
| Sidebar start | `--sidebar` | Neutral wash from foreground/background |
| Sidebar end | `--sidebar-end` | Tint mixed into `--sidebar` (gradient end) |
| Sidebar text | `--sidebar-foreground` | Tinted toward brand in light; default fg in dark |
| Sidebar active | `--sidebar-primary`, `--sidebar-accent` | = `--sidebar-tint` |
| Sidebar border / ring | `--sidebar-border`, `--sidebar-ring` | Tint-mixed border; ring = tint |

Gradient wash lives on `[data-slot='sidebar-inner']` in `src/styles.css`.

### Charts

`--chart-1` … `--chart-5` are mixes of `--primary` with white / foreground. Prefer these over new chart hues.

### Temporary domain colors (not yet tokens)

Calendar / session type split in `src/styles.css` is marked TEMP:

- Schedule (generated): purple-ish `oklch(~0.55 0.12 280)`
- Ad-hoc: amber `oklch(~0.72 0.14 55)`

Promote to named tokens only after the redesign palette for session kinds is decided.

### Usage rules

1. Prefer Tailwind semantic classes (`bg-background`, `text-muted-foreground`, `bg-primary`, etc.) mapped in `@theme inline`.
2. Soft brand surfaces: `bg-primary-soft` / `bg-primary-softer` (or the CSS vars), not raw `color-mix` unless extending an existing pattern.
3. Do not add purple/indigo brand themes or random gradients outside documented washes (sidebar, auth/onboarding).
