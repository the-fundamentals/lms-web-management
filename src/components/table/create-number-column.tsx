import type { ColumnDef, RowData } from '@tanstack/react-table'

import type {
  DataTableNumberingOptions,
  ResolvedDataTableNumbering,
} from '@/components/table/types'

const DEFAULT_NUMBERING_TITLE = '#'

/** Horizontal padding baked into the numbering column (px-4 on both sides). */
const NUMBERING_HORIZONTAL_PADDING_PX = 32

/** Approximate monospace/tabular digit width used for size estimation. */
const TABULAR_CHAR_WIDTH_PX = 8

/**
 * Normalize `numbering?: boolean | DataTableNumberingOptions` into a concrete
 * config, or `null` when numbering is off.
 */
export function resolveNumberingOptions(
  numbering?: boolean | DataTableNumberingOptions,
): ResolvedDataTableNumbering | null {
  if (!numbering) {
    return null
  }

  if (numbering === true) {
    return {
      enabled: true,
      title: DEFAULT_NUMBERING_TITLE,
      mode: 'page',
    }
  }

  if (numbering.enabled === false) {
    return null
  }

  return {
    enabled: true,
    title: numbering.title ?? DEFAULT_NUMBERING_TITLE,
    mode: numbering.mode ?? 'page',
  }
}

/**
 * Auto size for the numbering column: wide enough for the header title and a
 * realistic max index (e.g. continuous 3–4 digit), nothing more.
 */
export function estimateNumberColumnSize(
  options: ResolvedDataTableNumbering,
): number {
  const titleWidth =
    options.title.length * TABULAR_CHAR_WIDTH_PX +
    NUMBERING_HORIZONTAL_PADDING_PX
  // Continuous mode may show larger indices (page * size + n); leave room.
  const digitSlots = options.mode === 'continuous' ? 4 : 3
  const numberWidth =
    digitSlots * TABULAR_CHAR_WIDTH_PX + NUMBERING_HORIZONTAL_PADDING_PX

  return Math.max(titleWidth, numberWidth)
}

/**
 * Build the leading index column.
 *
 * IMPORTANT: Do not use `row.index` for display numbers — in TanStack Table that
 * is the original data index and does not move with sorting/filtering.
 * Use position in the active row model instead:
 * - `page` → index in `getRowModel()` (current page, visual order)
 * - `continuous` → index in `getPrePaginationRowModel()` (sorted/filtered, all pages)
 *
 * Width is auto-shrunk to content via `meta.shrink` + a computed `size`.
 */
export function createNumberColumn<TData extends RowData>(
  options: ResolvedDataTableNumbering,
): ColumnDef<TData, unknown> {
  const size = estimateNumberColumnSize(options)

  return {
    id: 'numbering',
    header: () => (
      <span className="block w-full text-center text-muted-foreground">
        {options.title}
      </span>
    ),
    cell: ({ row, table }) => {
      const displayNumber =
        options.mode === 'continuous'
          ? // Position in the full sorted/filtered list (before pagination).
            table
              .getPrePaginationRowModel()
              .rows.findIndex((candidate) => candidate.id === row.id) + 1
          : // Position among rows currently rendered on this page.
            table
              .getRowModel()
              .rows.findIndex((candidate) => candidate.id === row.id) + 1

      // findIndex returns -1 if missing; fall back to a blank rather than "0".
      const safeNumber = displayNumber > 0 ? displayNumber : '—'

      return (
        <span className="block w-full text-center tabular-nums text-muted-foreground">
          {safeNumber}
        </span>
      )
    },
    enableSorting: false,
    enableHiding: false,
    size,
    minSize: size,
    maxSize: size,
    meta: {
      // `w-px` + nowrap: classic HTML table trick — column collapses to content
      // inside a `width: 100%` table instead of absorbing free space.
      shrink: true,
      headerClassName: 'w-px whitespace-nowrap text-center',
      cellClassName: 'w-px whitespace-nowrap text-center',
    },
  }
}
