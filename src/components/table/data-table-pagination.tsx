'use no memo'

import type { PaginationState, Table } from '@tanstack/react-table'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from 'lucide-react'

import { DEFAULT_PAGE_SIZE_OPTIONS } from '@/components/table/constants'
import { Button } from '@/components/ui/button'

/**
 * Pagination footer: rows-per-page toggle + first/prev/next/last controls.
 *
 * `pagination` (and the derived flags) are passed as plain React props so this
 * component re-renders under React Compiler. Do not rely only on reading from
 * the stable `table` instance — that reference does not change between updates.
 *
 * Uses a native <select> for page size (same pattern as TanStack docs) to avoid
 * Radix Select controlled-value quirks on top of the table state issues.
 *
 * @see https://tanstack.com/table/latest/docs/guide/pagination
 */
interface DataTablePaginationProps<TData> {
  table: Table<TData>
  /** Controlled pagination slice from the parent DataTable. */
  pagination: PaginationState
  pageSizeOptions?: readonly number[]
  showSelectionCount?: boolean
  filteredRowCount: number
  selectedRowCount: number
  pageCount: number
  canPreviousPage: boolean
  canNextPage: boolean
}

export function DataTablePagination<TData>({
  table,
  pagination,
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  showSelectionCount = true,
  filteredRowCount,
  selectedRowCount,
  pageCount,
  canPreviousPage,
  canNextPage,
}: DataTablePaginationProps<TData>) {
  const { pageIndex, pageSize } = pagination

  const from = filteredRowCount === 0 ? 0 : pageIndex * pageSize + 1
  const to = Math.min((pageIndex + 1) * pageSize, filteredRowCount)
  const totalPages = Math.max(pageCount, 1)

  return (
    <div className="flex flex-col gap-4 px-2 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1 text-sm text-muted-foreground">
        {showSelectionCount ? (
          <>
            {selectedRowCount} of {filteredRowCount} row(s) selected.
          </>
        ) : (
          <>
            Showing {from}–{to} of {filteredRowCount}
          </>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6 lg:gap-8">
        <div className="flex items-center gap-2">
          <label
            htmlFor="data-table-page-size"
            className="text-sm font-medium whitespace-nowrap"
          >
            Rows per page
          </label>
          {/* Native select — matches TanStack pagination guide examples. */}
          <select
            id="data-table-page-size"
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            value={pageSize}
            onChange={(event) => {
              table.setPageSize(Number(event.target.value))
            }}
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>

        <div className="flex w-[100px] items-center justify-center text-sm font-medium">
          Page {pageIndex + 1} of {totalPages}
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.firstPage()}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to first page</span>
            <ChevronsLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.previousPage()}
            disabled={!canPreviousPage}
          >
            <span className="sr-only">Go to previous page</span>
            <ChevronLeftIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-8"
            onClick={() => table.nextPage()}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to next page</span>
            <ChevronRightIcon />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="hidden size-8 lg:flex"
            onClick={() => table.lastPage()}
            disabled={!canNextPage}
          >
            <span className="sr-only">Go to last page</span>
            <ChevronsRightIcon />
          </Button>
        </div>
      </div>
    </div>
  )
}
