import { DEFAULT_PAGE_SIZE } from '@/components/table/constants'
import type {
  DataTablePaginationOptions,
  ResolvedDataTablePagination,
} from '@/components/table/types'
import type { PaginationState } from '@tanstack/react-table'

/**
 * Pagination helpers for DataTable.
 *
 * - `resolvePaginationOptions` — normalize `boolean | DataTablePaginationOptions`
 *
 * Wired from `data-table.tsx`; features usually pass a controlled bag with
 * `mode: 'server'` when the list API accepts `page` / `size`.
 */

const DEFAULT_PAGINATION: PaginationState = {
  pageIndex: 0,
  pageSize: DEFAULT_PAGE_SIZE,
}

/**
 * Normalize `pagination?: boolean | DataTablePaginationOptions`.
 *
 * - `undefined` / `true` → client pagination enabled
 * - `false` → pagination footer hidden (all rows shown)
 * - object → full Ant Design–style config
 */
export function resolvePaginationOptions(
  pagination?: boolean | DataTablePaginationOptions,
  initialPageSize: number = DEFAULT_PAGE_SIZE,
): ResolvedDataTablePagination {
  const defaultInitial: PaginationState = {
    pageIndex: 0,
    pageSize: initialPageSize,
  }

  if (pagination === false) {
    return {
      enabled: false,
      mode: 'client',
      initialPagination: defaultInitial,
      isControlled: false,
    }
  }

  if (pagination === true || pagination === undefined) {
    return {
      enabled: true,
      mode: 'client',
      initialPagination: defaultInitial,
      isControlled: false,
    }
  }

  const mode = pagination.mode ?? 'client'
  const isControlled = pagination.pagination !== undefined

  return {
    enabled: pagination.enabled !== false,
    mode,
    pagination: pagination.pagination,
    onPaginationChange: pagination.onPaginationChange,
    initialPagination: pagination.initialPagination ?? defaultInitial,
    pageCount: pagination.pageCount,
    rowCount: pagination.rowCount,
    isControlled,
  }
}

export { DEFAULT_PAGINATION }
