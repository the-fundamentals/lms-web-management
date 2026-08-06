import type { SortingState } from '@tanstack/react-table'

/**
 * Option bags and resolved configs for the DataTable kit.
 *
 * Public props accept `boolean | OptionsObject` (Ant Design–style).
 * Sibling helpers (`sorting.ts`, `striped.ts`, `padding.ts`,
 * `create-number-column.tsx`) normalize those into the `Resolved*` types
 * consumed by `data-table.tsx`.
 *
 * Contents:
 * - Sorting — `DataTableSortingOptions` / `ResolvedDataTableSorting`
 * - Numbering — `DataTableNumberingOptions` / `ResolvedDataTableNumbering`
 * - Striped rows — `DataTableStripedOptions` / `ResolvedDataTableStriped`
 * - Padding — `DataTablePaddingValue` / `DataTablePaddingOptions` / resolved
 * - Column meta — `DataTableColumnMeta` (shrink + className hooks on ColumnDef)
 */

/**
 * Sorting option bag (Ant Design–style).
 *
 * Two modes (TanStack-compatible):
 * - `client` — sort the rows already in `data` via `getSortedRowModel`
 * - `server` — `manualSorting: true`; wire `sorting` / `onSortingChange` to your API
 *
 * @example Client (inline)
 * <DataTable
 *   sorting={{
 *     mode: 'client',
 *     columns: ['name', 'students'],
 *   }}
 * />
 *
 * @example Server (API)
 * const [sorting, setSorting] = useState<SortingState>([])
 * // useQuery({ queryKey: ['classrooms', sorting], ... })
 * <DataTable
 *   data={pageFromApi}
 *   sorting={{
 *     mode: 'server',
 *     columns: ['name', 'students'],
 *     sorting,
 *     onSortingChange: setSorting,
 *     enableMultiSort: false,
 *   }}
 * />
 */
export type DataTableSortingMode = 'client' | 'server'

export type DataTableSortingOptions = {
  /**
   * - `client` — sort current `data` in memory (default)
   * - `server` — do not sort locally; assume `data` is already ordered by the API
   */
  mode?: DataTableSortingMode
  /**
   * Whitelist of column ids that show sort UI / accept sort toggles.
   * When omitted, every non-utility column stays sortable (unless the ColumnDef
   * already sets `enableSorting: false`).
   */
  columns?: string[]
  /**
   * Controlled sorting state. Prefer this with `mode: 'server'` so you can
   * put `sorting` in a query key / request params.
   */
  sorting?: SortingState
  /** Fires whenever sort changes (controlled or uncontrolled). */
  onSortingChange?: (sorting: SortingState) => void
  /** Initial sort when uncontrolled (`sorting` not passed). */
  initialSorting?: SortingState
  /**
   * Allow Shift+click multi-column sort.
   * Default: `true` for client, `false` for server (most list APIs are single-sort).
   */
  enableMultiSort?: boolean
  /**
   * When false, sorting is fully disabled (no sort UI, state ignored).
   * Default: true.
   */
  enabled?: boolean
}

/** Internal resolved sorting config after normalizing `boolean | object`. */
export type ResolvedDataTableSorting = {
  enabled: boolean
  mode: DataTableSortingMode
  columns?: string[]
  sorting?: SortingState
  onSortingChange?: (sorting: SortingState) => void
  initialSorting: SortingState
  enableMultiSort: boolean
  /** True when parent owns `sorting` state. */
  isControlled: boolean
}

/**
 * Leading row-number / index column.
 *
 * @example
 * // shorthand
 * <DataTable numbering />
 *
 * @example
 * // full options (Ant Design–style object prop)
 * <DataTable
 *   numbering={{
 *     title: 'No.',
 *     mode: 'continuous',
 *   }}
 * />
 */
export type DataTableNumberingOptions = {
  /**
   * When false, numbering is off even if the object is passed.
   * Default: true when the object (or `numbering={true}`) is provided.
   */
  enabled?: boolean
  /**
   * Header label for the number column.
   * Default: "#"
   */
  title?: string
  /**
   * - `page` — restart at 1 on every page (default)
   * - `continuous` — keep counting across pages (pageIndex * pageSize + row)
   */
  mode?: 'page' | 'continuous'
}

/** Resolved numbering config used internally after normalizing `boolean | object`. */
export type ResolvedDataTableNumbering = {
  enabled: true
  title: string
  mode: 'page' | 'continuous'
}

/**
 * Zebra / staggered row striping (Ant Design–style option bag).
 *
 * @example
 * <DataTable striped />
 *
 * @example
 * <DataTable
 *   striped={{
 *     oddClassName: 'bg-background',
 *     evenClassName: 'bg-muted/40',
 *   }}
 * />
 */
export type DataTableStripedOptions = {
  /** When false, striping is off. Default: true when the object / `true` is passed. */
  enabled?: boolean
  /**
   * Background for odd rows (1st, 3rd, … — index 0, 2, …).
   * Default: none (inherits / white).
   */
  oddClassName?: string
  /**
   * Background for even rows (2nd, 4th, … — index 1, 3, …).
   * Default: `bg-muted/40` (soft gray).
   */
  evenClassName?: string
}

/** Resolved striping config, or null when off. */
export type ResolvedDataTableStriped = {
  enabled: true
  oddClassName: string
  evenClassName: string
}

/**
 * Numeric cell padding in pixels.
 * - `16` → 16px on every side
 * - `{ x: 16, y: 12 }` → horizontal / vertical
 */
export type DataTablePaddingValue =
  | number
  | {
      x?: number
      y?: number
    }

/**
 * Padding controls from the parent (pixel values — not presets).
 *
 * @example
 * <DataTable padding={16} />
 * <DataTable padding={{ x: 16, y: 12 }} />
 * <DataTable
 *   padding={{
 *     cell: { x: 16, y: 14 },
 *     header: { x: 16, y: 12 },
 *   }}
 * />
 */
export type DataTablePaddingOptions = {
  /** Shared horizontal padding (px) when `cell` / `header` omit `x`. */
  x?: number
  /** Shared vertical padding (px) when `cell` / `header` omit `y`. */
  y?: number
  /** Body cell padding (px). */
  cell?: DataTablePaddingValue
  /** Header cell padding (px). */
  header?: DataTablePaddingValue
}

/** Resolved pixel padding applied via inline styles. */
export type ResolvedDataTablePadding = {
  cell: { x: number; y: number }
  header: { x: number; y: number }
}

/**
 * Optional per-column render hints read by DataTable when painting cells/headers.
 * Used so utility columns (numbering, select) can auto-shrink to content width.
 */
export type DataTableColumnMeta = {
  /** Extra classes on <th>. */
  headerClassName?: string
  /** Extra classes on <td>. */
  cellClassName?: string
  /**
   * When true, the column only takes as much width as its content
   * (`w-px` + nowrap trick inside a `w-full` table).
   */
  shrink?: boolean
}

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> extends DataTableColumnMeta {}
}
