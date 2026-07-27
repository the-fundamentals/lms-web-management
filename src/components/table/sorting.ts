import type { ColumnDef, SortingState } from '@tanstack/react-table'

import type {
  DataTableSortingOptions,
  ResolvedDataTableSorting,
} from '@/components/table/types'

const UTILITY_COLUMN_IDS = new Set(['numbering', 'select'])

/**
 * Normalize `sorting?: boolean | DataTableSortingOptions`.
 *
 * - `undefined` → client sorting, all (non-utility) columns sortable
 * - `false` → sorting disabled
 * - `true` → client sorting enabled
 * - object → full Ant Design–style config
 */
export function resolveSortingOptions(
  sorting?: boolean | DataTableSortingOptions,
): ResolvedDataTableSorting {
  if (sorting === false) {
    return {
      enabled: false,
      mode: 'client',
      initialSorting: [],
      enableMultiSort: false,
      isControlled: false,
    }
  }

  if (sorting === true || sorting === undefined) {
    return {
      enabled: true,
      mode: 'client',
      initialSorting: [],
      enableMultiSort: true,
      isControlled: false,
    }
  }

  const mode = sorting.mode ?? 'client'
  const isControlled = sorting.sorting !== undefined

  return {
    enabled: sorting.enabled !== false,
    mode,
    columns: sorting.columns,
    sorting: sorting.sorting,
    onSortingChange: sorting.onSortingChange,
    initialSorting: sorting.initialSorting ?? [],
    enableMultiSort:
      sorting.enableMultiSort ?? (mode === 'client' ? true : false),
    isControlled,
  }
}

/** Resolve a ColumnDef's id the same way TanStack does for accessor columns. */
export function getColumnDefId<TData, TValue>(
  column: ColumnDef<TData, TValue>,
): string | undefined {
  if (column.id) {
    return column.id
  }

  if ('accessorKey' in column && column.accessorKey != null) {
    return String(column.accessorKey)
  }

  return undefined
}

/**
 * Apply `sorting.columns` whitelist: only listed ids stay sortable.
 * Utility columns (numbering / select) are always non-sortable.
 * When `enabled` is false, every column is non-sortable.
 */
export function applySortableColumns<TData, TValue>(
  columns: ColumnDef<TData, TValue>[],
  options: Pick<ResolvedDataTableSorting, 'enabled' | 'columns'>,
): ColumnDef<TData, TValue>[] {
  const whitelist = options.columns ? new Set(options.columns) : null

  return columns.map((column) => {
    const id = getColumnDefId(column)

    if (!options.enabled || (id && UTILITY_COLUMN_IDS.has(id))) {
      return { ...column, enableSorting: false }
    }

    if (!whitelist) {
      // Keep any explicit ColumnDef.enableSorting; default remains sortable.
      return column
    }

    if (!id) {
      return { ...column, enableSorting: false }
    }

    return {
      ...column,
      enableSorting: whitelist.has(id),
    }
  })
}

/**
 * Map TanStack SortingState → common list-API query fields.
 * Uses the primary (first) sort entry — typical for server list endpoints.
 */
export function sortingStateToApiParams(sorting: SortingState): {
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
} {
  const primary = sorting[0]
  if (!primary) {
    return {}
  }

  return {
    sortBy: primary.id,
    sortOrder: primary.desc ? 'desc' : 'asc',
  }
}
