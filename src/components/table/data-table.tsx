'use no memo'

/**
 * DataTable composer — the main entry for the shared table kit.
 *
 * Prefer importing from `@/components/table`, not this file path.
 *
 * ## What lives here
 *
 * 1. Option resolution (sorting / striped / padding / numbering)
 * 2. Column assembly (prepend numbering, apply sortable whitelist)
 * 3. React state + `useReactTable`
 * 4. Layout: toolbar → bordered grid → pagination
 *
 * Presentational pieces and option helpers live in sibling files
 * (see the folder map on `index.ts`).
 *
 * ## `"use no memo"`
 *
 * React Compiler + TanStack Table are incompatible — `useReactTable()` returns
 * a stable `table` object that mutates in place, so memoized children never see
 * pagination / visibility / filter updates.
 *
 * @see https://github.com/facebook/react/issues/33057
 */

import * as React from 'react'
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type PaginationState,
  type SortingState,
  type Updater,
  type VisibilityState,
} from '@tanstack/react-table'

import { DEFAULT_PAGE_SIZE } from '@/components/table/constants'
import {
  createNumberColumn,
  resolveNumberingOptions,
} from '@/components/table/create-number-column'
import { DataTablePagination } from '@/components/table/data-table-pagination'
import { DataTableToolbar } from '@/components/table/data-table-toolbar'
import {
  applySortableColumns,
  resolveSortingOptions,
} from '@/components/table/sorting'
import {
  getStripedRowClassName,
  resolveStripedOptions,
} from '@/components/table/striped'
import { resolvePaddingOptions, paddingToStyle } from '@/components/table/padding'
import type {
  DataTableNumberingOptions,
  DataTablePaddingOptions,
  DataTablePaddingValue,
  DataTableSortingOptions,
  DataTableStripedOptions,
} from '@/components/table/types'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * Resolve TanStack updater values (value | (old) => next) into a concrete next state.
 * Required whenever we wrap on[State]Change instead of passing setState directly.
 */
function functionalUpdate<T>(updater: Updater<T>, previous: T): T {
  return typeof updater === 'function'
    ? (updater as (old: T) => T)(previous)
    : updater
}

/**
 * Reusable TanStack Table shell.
 *
 * Customizations use Ant Design–style option objects:
 * - `numbering={{ title: 'No.' }}`
 * - `sorting={{ mode: 'server', columns: ['name'], sorting, onSortingChange }}`
 *
 * @example Client sort (current page data)
 * <DataTable
 *   columns={columns}
 *   data={rows}
 *   sorting={{ mode: 'client', columns: ['name', 'students'] }}
 * />
 *
 * @example Server sort (API) — TanStack manualSorting
 * const [sorting, setSorting] = useState<SortingState>([])
 * // fetch(`/api/classrooms?${new URLSearchParams(sortingStateToApiParams(sorting))}`)
 * <DataTable
 *   data={apiPage}
 *   sorting={{
 *     mode: 'server',
 *     columns: ['name', 'students'],
 *     sorting,
 *     onSortingChange: setSorting,
 *   }}
 * />
 */
interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  /** Column id bound to the toolbar search input. */
  filterColumnId?: string
  /** Placeholder text for the toolbar search input. */
  filterPlaceholder?: string
  /** Initial rows-per-page. Default: 10. */
  initialPageSize?: number
  /** Options for the rows-per-page select. */
  pageSizeOptions?: readonly number[]
  /** Show “N of M selected” vs “Showing X–Y of Z”. Default: auto from selection. */
  showSelectionCount?: boolean
  /** Hide the toolbar entirely (filter + view). */
  hideToolbar?: boolean
  /** Extra classes on the outer wrapper. */
  className?: string
  /** Optional slot rendered inside the toolbar (left of View). */
  toolbarChildren?: React.ReactNode
  /**
   * Leading row-number column (Ant Design–style option bag).
   * - `true` → show with default header "#"
   * - `{ title, mode, enabled }` → customize header label / numbering mode
   */
  numbering?: boolean | DataTableNumberingOptions
  /**
   * Sorting controls (Ant Design–style option bag).
   * - `false` → disable sorting entirely
   * - `true` / omitted → client-side sort, all non-utility columns
   * - object → `mode: 'client' | 'server'`, sortable `columns` whitelist,
   *   controlled `sorting` / `onSortingChange` for API wiring
   */
  sorting?: boolean | DataTableSortingOptions
  /**
   * Zebra / staggered row backgrounds (Ant Design–style option bag).
   * - `true` → odd rows plain, even rows soft gray
   * - `{ oddClassName, evenClassName }` → custom pair
   */
  striped?: boolean | DataTableStripedOptions
  /**
   * Cell padding in pixels (from the parent — actionable numbers, not presets).
   * - `16` → 16px all sides
   * - `{ x: 16, y: 12 }` → horizontal / vertical
   * - `{ cell: { x, y }, header: { x, y } }` → body vs header
   */
  padding?: DataTablePaddingValue | DataTablePaddingOptions
}

export function DataTable<TData, TValue>({
  columns,
  data,
  filterColumnId,
  filterPlaceholder,
  initialPageSize = DEFAULT_PAGE_SIZE,
  pageSizeOptions,
  showSelectionCount,
  hideToolbar = false,
  className,
  toolbarChildren,
  numbering,
  sorting: sortingProp,
  striped: stripedProp,
  padding: paddingProp,
}: DataTableProps<TData, TValue>) {
  // --- 1. Normalize option bags ---------------------------------------------
  const sortingConfig = resolveSortingOptions(sortingProp)
  const stripedConfig = resolveStripedOptions(stripedProp)
  const paddingConfig = resolvePaddingOptions(paddingProp)

  // --- 2. Build columns (numbering + sortable whitelist) --------------------
  const tableColumns = React.useMemo<ColumnDef<TData, TValue>[]>(() => {
    const numberingConfig = resolveNumberingOptions(numbering)
    const resolvedSorting = resolveSortingOptions(sortingProp)
    const withNumbering = numberingConfig
      ? ([
          createNumberColumn<TData>(numberingConfig) as ColumnDef<TData, TValue>,
          ...columns,
        ] as ColumnDef<TData, TValue>[])
      : columns

    return applySortableColumns(withNumbering, resolvedSorting)
  }, [columns, numbering, sortingProp])

  // --- 3. Table UI state (also passed to children as props for Compiler) ----
  const [internalSorting, setInternalSorting] = React.useState<SortingState>(
    sortingConfig.initialSorting,
  )
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: initialPageSize,
  })

  const sorting = sortingConfig.isControlled
    ? (sortingConfig.sorting ?? [])
    : internalSorting

  const isServerSorting = sortingConfig.mode === 'server'
  const sortingEnabled = sortingConfig.enabled

  // --- 4. TanStack table instance -------------------------------------------
  const table = useReactTable({
    data,
    columns: tableColumns,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination,
    },
    onSortingChange: (updater) => {
      const next = functionalUpdate(updater, sorting)
      if (!sortingConfig.isControlled) {
        setInternalSorting(next)
      }
      sortingConfig.onSortingChange?.(next)
    },
    onColumnFiltersChange: (updater) => {
      setColumnFilters((previous) => functionalUpdate(updater, previous))
    },
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((previous) => functionalUpdate(updater, previous))
    },
    onRowSelectionChange: (updater) => {
      setRowSelection((previous) => functionalUpdate(updater, previous))
    },
    onPaginationChange: (updater) => {
      setPagination((previous) => functionalUpdate(updater, previous))
    },
    enableSorting: sortingEnabled,
    enableMultiSort: sortingConfig.enableMultiSort,
    // Server mode: TanStack assumes `data` is already sorted by the API.
    // @see https://tanstack.com/table/latest/docs/guide/sorting#manual-server-side-sorting
    manualSorting: isServerSorting,
    getCoreRowModel: getCoreRowModel(),
    // Only attach the client sorted row model when sorting inline.
    getSortedRowModel: isServerSorting ? undefined : getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    // Reset to page 0 when filters / data change (TanStack default).
    autoResetPageIndex: true,
  })

  const hasSelectableRows = table
    .getAllColumns()
    .some((column) => column.id === 'select')
  const resolvedShowSelectionCount =
    showSelectionCount ?? hasSelectableRows

  // --- 5. Render: toolbar → grid → pagination -------------------------------
  return (
    <div className={cn('flex w-full flex-col gap-4', className)}>
      {!hideToolbar ? (
        <DataTableToolbar
          table={table}
          filterColumnId={filterColumnId}
          filterPlaceholder={filterPlaceholder}
          columnFilters={columnFilters}
          columnVisibility={columnVisibility}
        >
          {toolbarChildren}
        </DataTableToolbar>
      ) : null}

      <div className="overflow-hidden rounded-xl border">
        <Table>
          <TableHeader className="bg-muted/50 [&_tr]:border-b-border/80 hover:bg-muted/50">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => {
                  const meta = header.column.columnDef.meta
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        // Clear ui/table defaults so parent pixel padding fully owns spacing.
                        'h-auto p-0',
                        meta?.shrink && 'w-px whitespace-nowrap',
                        meta?.headerClassName,
                      )}
                      style={{
                        ...paddingToStyle(paddingConfig.header),
                        ...(meta?.shrink
                          ? {
                              width: header.getSize(),
                              minWidth: header.column.columnDef.minSize,
                              maxWidth: header.column.columnDef.maxSize,
                            }
                          : null),
                      }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() ? 'selected' : undefined}
                  className={cn(getStripedRowClassName(row.index, stripedConfig))}
                >
                  {row.getVisibleCells().map((cell) => {
                    const meta = cell.column.columnDef.meta
                    return (
                      <TableCell
                        key={cell.id}
                        className={cn(
                          'p-0',
                          meta?.shrink && 'w-px whitespace-nowrap',
                          meta?.cellClassName,
                        )}
                        style={{
                          ...paddingToStyle(paddingConfig.cell),
                          ...(meta?.shrink
                            ? {
                                width: cell.column.getSize(),
                                minWidth: cell.column.columnDef.minSize,
                                maxWidth: cell.column.columnDef.maxSize,
                              }
                            : null),
                        }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumns.length}
                  className="h-24 text-center text-muted-foreground"
                  style={paddingToStyle(paddingConfig.cell)}
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        pagination={pagination}
        pageSizeOptions={pageSizeOptions}
        showSelectionCount={resolvedShowSelectionCount}
        filteredRowCount={table.getFilteredRowModel().rows.length}
        selectedRowCount={table.getFilteredSelectedRowModel().rows.length}
        pageCount={table.getPageCount()}
        canPreviousPage={table.getCanPreviousPage()}
        canNextPage={table.getCanNextPage()}
      />
    </div>
  )
}
