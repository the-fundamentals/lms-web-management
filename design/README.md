# Design system & Cursor design rules

Design principles for this app follow **[cursor-designer](https://github.com/spencergoldade/cursor-designer)** (Spencer Goldade), adapted for **shadcn/ui + Tailwind CSS v4**.

## Profile in use: full design-ops

| Layer | Path | When it applies |
| --- | --- | --- |
| Always-on core | `.cursor/rules/core/*` | Every chat |
| Frontend (auto) | `.cursor/rules/frontend/*` | Editing `**/*.tsx` (and CSS for shadcn rule) |
| Binders (on demand) | `.cursor/rules/binders/*` | Security UX, IA at scale, research, QA, … |
| Tokens & product docs | `design/tokens`, `design/ia`, `design/content`, `design/research` | Source of truth for visuals / IA / copy |

Stack-specific rule: `.cursor/rules/frontend/shadcn-tailwind.mdc`.

## Tokens (already productized)

- `design/tokens/colors.md` → `src/styles.css`
- `design/tokens/typography.md` → Inter Variable + Tailwind text roles
- `design/tokens/spacing.md` → Tailwind scale + `--radius`

Defaults match shadcn radix-nova / neutral; brand accent is teal (see colors doc). Prefer extending those docs over one-off styles.

## Attribution

Upstream rules: © Spencer Goldade — [cursor-designer](https://github.com/spencergoldade/cursor-designer) (GPLv3). Project adaptations for The Fundamentals LMS management console.
