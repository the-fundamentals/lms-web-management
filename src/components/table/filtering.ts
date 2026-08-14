import type { ColumnFiltersState } from '@tanstack/react-table'

import type {
  DataTableFilteringOptions,
  ResolvedDataTableFiltering,
} from '@/components/table/types'

/**
 * Filtering helpers for DataTable.
 *
 * - `resolveFilteringOptions` — normalize `boolean | DataTableFilteringOptions`
 * - `getColumnFilterValue` — read a string filter by column id
 *
 * Wired from `data-table.tsx`; features usually pass a controlled bag with
 * `mode: 'server'` when the list API accepts a `filters` array.
 */

/**
 * Normalize `filtering?: boolean | DataTableFilteringOptions`.
 *
 * - `undefined` / `true` → client filtering enabled
 * - `false` → filtering disabled
 * - object → full Ant Design–style config
 */
export function resolveFilteringOptions(
  filtering?: boolean | DataTableFilteringOptions,
): ResolvedDataTableFiltering {
  if (filtering === false) {
    return {
      enabled: false,
      mode: 'client',
      initialColumnFilters: [],
      isControlled: false,
    }
  }

  if (filtering === true || filtering === undefined) {
    return {
      enabled: true,
      mode: 'client',
      initialColumnFilters: [],
      isControlled: false,
    }
  }

  const mode = filtering.mode ?? 'client'
  const isControlled = filtering.columnFilters !== undefined

  return {
    enabled: filtering.enabled !== false,
    mode,
    columnFilters: filtering.columnFilters,
    onColumnFiltersChange: filtering.onColumnFiltersChange,
    initialColumnFilters: filtering.initialColumnFilters ?? [],
    isControlled,
  }
}

/** Read a toolbar/column filter value as a string (empty when unset). */
export function getColumnFilterValue(
  filters: ColumnFiltersState,
  columnId: string,
): string {
  const value = filters.find((filter) => filter.id === columnId)?.value
  return typeof value === 'string' ? value : ''
}
