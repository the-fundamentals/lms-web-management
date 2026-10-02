## Spacing tokens

Source of truth: Tailwind CSS v4 default spacing scale (used throughout components). Base unit = **4px**. Radius lives in `src/styles.css` (`--radius` and `@theme` radius steps).

### Scale

Keep this pattern; prefer these steps over arbitrary pixel gaps.

| Token | Rem | px | Common Tailwind |
| --- | --- | --- | --- |
| `spacing-0` | `0` | 0 | `p-0`, `gap-0` |
| `spacing-0.5` | `0.125rem` | 2 | `gap-0.5`, `p-0.5` |
| `spacing-1` | `0.25rem` | 4 | `p-1`, `gap-1` |
| `spacing-1.5` | `0.375rem` | 6 | `gap-1.5`, `px-1.5` |
| `spacing-2` | `0.5rem` | 8 | `p-2`, `gap-2` |
| `spacing-2.5` | `0.625rem` | 10 | `p-2.5`, `gap-2.5` |
| `spacing-3` | `0.75rem` | 12 | `p-3`, `gap-3` |
| `spacing-4` | `1rem` | 16 | `p-4`, `gap-4` |
| `spacing-5` | `1.25rem` | 20 | `p-5`, `gap-5` |
| `spacing-6` | `1.5rem` | 24 | `p-6`, `gap-6` |
| `spacing-8` | `2rem` | 32 | `p-8`, `gap-8` |
| `spacing-10` | `2.5rem` | 40 | page / section breathing room |
| `spacing-12` | `3rem` | 48 | major layout boundaries |
| `spacing-14` | `3.5rem` | 56 | large page gutters (when needed) |

Half-steps (`0.5`, `1.5`, `2.5`) are allowed for dense controls (icons + labels, menu items). Prefer whole steps for page layout.

### Usage guidance

- **Inside controls** (icon ↔ label, label ↔ input): `spacing-1`–`spacing-2` / `1.5`.
- **Related form fields / toolbar clusters**: `spacing-3`–`spacing-4`.
- **Page section stacks**: `spacing-6` (common in feature pages, e.g. `gap-6`).
- **Page gutters / chrome padding**: `spacing-4`–`spacing-6` (e.g. classroom header `p-4`).
- **Between major regions**: `spacing-8`+.

### Radius (paired with spacing)

Base: `--radius: 0.625rem` (10px). Derived:

| Token | Formula | Typical class |
| --- | --- | --- |
| `radius-sm` | `× 0.6` | `rounded-sm` |
| `radius-md` | `× 0.8` | `rounded-md` |
| `radius-lg` | base | `rounded-lg` |
| `radius-xl` | `× 1.4` | `rounded-xl` (tables, inset panels) |
| `radius-2xl`+ | `× 1.8` … | rare; prefer xl unless surface needs more |

### Notes

1. Avoid one-off spacing that does not map to the scale above.
2. Increase space between larger conceptual groups rather than sprinkling micro-gaps.
3. Dense calendar UI may use sub-`spacing-1` margins only where FullCalendar chrome requires it; document exceptions next to the override.
