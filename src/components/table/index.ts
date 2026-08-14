/**
 * Shared DataTable kit (TanStack Table + shadcn UI).
 *
 * ## How to use (features / routes)
 *
 * Import only from this barrel — never deep-import files under `components/table/`.
 *
 * ```ts
 * import {
 *   DataTable,
 *   DataTableColumnHeader,
 *   createSelectColumn,
 *   sortingStateToApiParams,
 *   type ColumnDef,
 * } from '@/components/table'
 * ```
 *
 * Minimal example:
 *
 * ```tsx
 * const columns: ColumnDef<Row>[] = [
 *   {
 *     accessorKey: 'name',
 *     header: ({ column }) => (
 *       <DataTableColumnHeader column={column} title="Name" />
 *     ),
 *   },
 * ]
 *
 * <DataTable
 *   columns={columns}
 *   data={rows}
 *   filterColumnId="name"
 *   numbering
 *   sorting={{ mode: 'client', columns: ['name'] }}
 *   striped
 * />
 * ```
 *
 * ## Public API
 *
 * | Export | Role |
 * | --- | --- |
 * | `DataTable` | Drop-in table: toolbar + grid + pagination |
 * | `DataTableColumnHeader` | Sortable header for `ColumnDef.header` |
 * | `createSelectColumn` | Optional checkbox select column |
 * | `createNumberColumn` | Leading index column (usually via `numbering` prop) |
 * | `sortingStateToApiParams` | Map TanStack `SortingState` → `{ sortBy, sortDirection }` |
 * | `ColumnDef` / `SortingState` / `PaginationState` | Re-exported TanStack types |
 * | Option types (`DataTableSortingOptions`, …) | Prop bags for `DataTable` |
 *
 * Also re-exported (advanced / internal-ish — prefer the props on `DataTable`
 * instead of calling these yourself): `DataTableToolbar`, `DataTablePagination`,
 * `DataTableViewOptions`, `resolve*` helpers, padding helpers, page-size constants.
 *
 * ## Folder map (read this when editing the kit)
 *
 * ```
 * index.ts                      ← you are here (public barrel)
 * data-table.tsx                ← composer: state + useReactTable + layout
 * data-table-toolbar.tsx        ← search filter + View menu slot
 * data-table-view-options.tsx   ← column visibility dropdown
 * data-table-pagination.tsx     ← rows-per-page + page controls
 * data-table-skeleton.tsx       ← loading skeleton body rows (shadcn Skeleton)
 * data-table-column-header.tsx  ← sortable header UI for column defs
 * create-number-column.tsx      ← numbering column factory + resolveNumberingOptions
 * create-select-column.tsx      ← row-selection checkbox column
 * sorting.ts                    ← sort option normalize + column enableSorting
 * striped.ts                    ← zebra row class helpers
 * padding.ts                    ← cell/header padding normalize → CSS
 * pagination.ts                 ← pagination option normalize (client/server)
 * filtering.ts                  ← column-filter option normalize (client/server)
 * types.ts                      ← option bags + resolved configs + column meta
 * constants.ts                  ← default page size / options
 * ```
 *
 * Composition flow:
 *
 * ```
 * DataTable
 *   ├─ resolve sorting / pagination / filtering / striped / padding / numbering
 *   ├─ build columns (optional numbering + sortable whitelist)
 *   ├─ useReactTable (sorting, filters, visibility, selection, pagination)
 *   ├─ DataTableToolbar → DataTableViewOptions
 *   ├─ <Table> header/body (flexRender + striped + padding)
 *   └─ DataTablePagination
 * ```
 *
 * ## Sorting modes
 *
 * ```ts
 * // Inline — sort the rows already in `data`
 * sorting={{ mode: 'client', columns: ['name', 'students'] }}
 *
 * // API — TanStack manualSorting; refetch when sorting changes
 * sorting={{
 *   mode: 'server',
 *   columns: ['name'],
 *   sorting,
 *   onSortingChange: setSorting,
 * }}
 *
 * // Off — no sort UI
 * sorting={false}
 * ```
 *
 * ## Pagination modes
 *
 * ```ts
 * // Inline — slice `data` in memory (default)
 * pagination
 *
 * // API — TanStack manualPagination; refetch when page / size changes
 * pagination={{
 *   mode: 'server',
 *   pagination,
 *   onPaginationChange: setPagination,
 *   pageCount,
 * }}
 * ```
 *
 * ## Filtering modes
 *
 * ```ts
 * // Inline — filter `data` in memory (default when filterColumnId is set)
 * filterColumnId="name"
 *
 * // API — TanStack manualFiltering; refetch when filters change
 * filtering={{
 *   mode: 'server',
 *   columnFilters,
 *   onColumnFiltersChange: setColumnFilters,
 * }}
 * ```
 *
 * ## React Compiler note
 *
 * Files that touch the TanStack `table` instance use `"use no memo"`.
 * `useReactTable()` returns a stable object that mutates in place; memoized
 * children would miss pagination / visibility / filter updates.
 *
 * @see https://github.com/facebook/react/issues/33057
 */

export { DataTable } from '@/components/table/data-table'
export { DataTableColumnHeader } from '@/components/table/data-table-column-header'
export { DataTablePagination } from '@/components/table/data-table-pagination'
export { DataTableSkeletonRows } from '@/components/table/data-table-skeleton'
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
export { resolvePaginationOptions } from '@/components/table/pagination'
export {
  getColumnFilterValue,
  resolveFilteringOptions,
} from '@/components/table/filtering'
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
  DataTablePaginationOptions,
  DataTablePaginationMode,
  ResolvedDataTablePagination,
  DataTableFilteringOptions,
  DataTableFilteringMode,
  ResolvedDataTableFiltering,
  DataTableStripedOptions,
  ResolvedDataTableStriped,
  DataTablePaddingOptions,
  DataTablePaddingValue,
  ResolvedDataTablePadding,
} from '@/components/table/types'

/** Re-export so feature columns can type against this module alone. */
export type {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  PaginationState,
} from '@tanstack/react-table'
