'use no memo'

import * as React from 'react'
import type {
  ColumnFiltersState,
  Table,
  VisibilityState,
} from '@tanstack/react-table'

import { DataTableViewOptions } from '@/components/table/data-table-view-options'
import { Input } from '@/components/ui/input'

/**
 * Top toolbar: optional text filter + column visibility toggle.
 *
 * Filter text lives in local React state (always visible while typing), then
 * is pushed into the column filter. `columnVisibility` is forwarded into View
 * so that menu re-renders when columns are toggled.
 */
interface DataTableToolbarProps<TData> {
  table: Table<TData>
  filterColumnId?: string
  filterPlaceholder?: string
  columnFilters: ColumnFiltersState
  columnVisibility: VisibilityState
  children?: React.ReactNode
}

export function DataTableToolbar<TData>({
  table,
  filterColumnId,
  filterPlaceholder = 'Filter...',
  columnFilters,
  columnVisibility,
  children,
}: DataTableToolbarProps<TData>) {
  const filterColumn = filterColumnId
    ? table.getColumn(filterColumnId)
    : undefined

  // Seed from controlled columnFilters (also keeps this prop “live” for the compiler).
  const tableFilterValue =
    (columnFilters.find((filter) => filter.id === filterColumnId)
      ?.value as string) ?? ''

  const [filterValue, setFilterValue] = React.useState(tableFilterValue)

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex flex-1 items-center gap-2">
        {filterColumn ? (
          <Input
            placeholder={filterPlaceholder}
            value={filterValue}
            onChange={(event) => {
              const nextValue = event.target.value
              setFilterValue(nextValue)
              filterColumn.setFilterValue(nextValue || undefined)
            }}
            className="h-8 max-w-sm text-foreground"
            aria-label={filterPlaceholder}
          />
        ) : null}
        {children}
      </div>
      <DataTableViewOptions
        table={table}
        columnVisibility={columnVisibility}
      />
    </div>
  )
}
