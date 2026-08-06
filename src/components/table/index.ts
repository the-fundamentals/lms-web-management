/**
 * Shared DataTable kit (TanStack Table + shadcn UI).
 *
 * Public API — import only from `@/components/table` (this barrel).
 * Files under this folder are internals; do not deep-import them from features/routes.
 *
 * ┌─ What to import ──────────────────────────────────────────────────────────┐
 * │ DataTable                 → drop-in table with sort / filter / pagination │
 * │ DataTableColumnHeader     → sortable headers                              │
 * │ DataTablePagination       → pagination footer (also composed by DataTable)│
 * │ DataTableToolbar          → filter + View (also composed by DataTable)    │
 * │ DataTableViewOptions      → column visibility menu                        │
 * │ createSelectColumn        → checkbox select column                        │
 * │ createNumberColumn        → leading index column                          │
 * │ sortingStateToApiParams   → map SortingState → { sortBy, sortOrder }      │
 * │ ColumnDef / SortingState  → re-exported from @tanstack/react-table        │
 * └───────────────────────────────────────────────────────────────────────────┘
 *
 * Sorting modes:
 *
 *   // Inline — sort the rows already in `data`
 *   sorting={{ mode: 'client', columns: ['name', 'students'] }}
 *
 *   // API — TanStack manualSorting; refetch when sorting changes
 *   sorting={{
 *     mode: 'server',
 *     columns: ['name'],
 *     sorting,
 *     onSortingChange: setSorting,
 *   }}
 */

export { DataTable } from '@/components/table/data-table'
export { DataTableColumnHeader } from '@/components/table/data-table-column-header'
export { DataTablePagination } from '@/components/table/data-table-pagination'
export { DataTableToolbar } from '@/components/table/data-table-toolbar'
export { DataTableViewOptions } from '@/components/table/data-table-view-options'
export { createSelectColumn } from '@/components/table/create-select-column'
export {
  createNumberColumn,
  resolveNumberingOptions,
} from '@/components/table/create-number-column'
export {
  applySortableColumns,
  resolveSortingOptions,
  sortingStateToApiParams,
  getColumnDefId,
} from '@/components/table/sorting'
export {
  resolveStripedOptions,
  getStripedRowClassName,
} from '@/components/table/striped'
export { resolvePaddingOptions, paddingToStyle } from '@/components/table/padding'
export {
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZE_OPTIONS,
  type PageSizeOption,
} from '@/components/table/constants'
export type {
  DataTableNumberingOptions,
  ResolvedDataTableNumbering,
  DataTableColumnMeta,
  DataTableSortingOptions,
  DataTableSortingMode,
  ResolvedDataTableSorting,
  DataTableStripedOptions,
  ResolvedDataTableStriped,
  DataTablePaddingOptions,
  DataTablePaddingValue,
  ResolvedDataTablePadding,
} from '@/components/table/types'

/** Re-export so feature columns can type against this module alone. */
export type {
  ColumnDef,
  SortingState,
  PaginationState,
} from '@tanstack/react-table'
