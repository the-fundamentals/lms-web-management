'use no memo'

import type { Table, VisibilityState } from '@tanstack/react-table'
import { CheckIcon, Settings2Icon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

/**
 * Column visibility menu (“View”).
 *
 * Uses plain DropdownMenuItem + a check icon instead of CheckboxItem, and
 * reads visibility from the `columnVisibility` React prop (not only from the
 * stable `table` instance) so ticks and hide/show stay in sync under React Compiler.
 */
export function DataTableViewOptions<TData>({
  table,
  columnVisibility,
}: {
  table: Table<TData>
  /** Controlled visibility map from the parent DataTable. */
  columnVisibility: VisibilityState
}) {
  const hideableColumns = table
    .getAllColumns()
    .filter(
      (column) =>
        typeof column.accessorFn !== 'undefined' && column.getCanHide(),
    )

  const hasHiddenColumns = hideableColumns.some(
    (column) => columnVisibility[column.id] === false,
  )

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="ml-auto h-8">
          <Settings2Icon />
          View
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {hideableColumns.map((column) => {
          // Explicit React state: missing key / true => visible; false => hidden.
          const isVisible = columnVisibility[column.id] !== false

          return (
            <DropdownMenuItem
              key={column.id}
              className="capitalize"
              // Keep menu open while toggling multiple columns.
              onSelect={(event) => {
                event.preventDefault()
                column.toggleVisibility(!isVisible)
              }}
            >
              <CheckIcon
                className={cn(
                  'size-4',
                  isVisible ? 'opacity-100' : 'opacity-0',
                )}
              />
              {column.id}
            </DropdownMenuItem>
          )
        })}
        {hasHiddenColumns ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onSelect={(event) => {
                event.preventDefault()
                table.resetColumnVisibility()
              }}
            >
              Show all columns
            </DropdownMenuItem>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
