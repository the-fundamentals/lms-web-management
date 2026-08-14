import { DEFAULT_PAGE_SIZE } from '@/components/table/constants'
import { paddingToStyle } from '@/components/table/padding'
import { getStripedRowClassName } from '@/components/table/striped'
import type {
  ResolvedDataTablePadding,
  ResolvedDataTableStriped,
} from '@/components/table/types'
import { Skeleton } from '@/components/ui/skeleton'
import { TableCell, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

/**
 * Skeleton body rows for DataTable loading state (shadcn `Skeleton`).
 *
 * Prefer driving this via `DataTable`’s `loading` prop rather than rendering
 * these rows yourself.
 */

const SKELETON_WIDTH_CLASSES = [
  'w-[72%]',
  'w-[56%]',
  'w-[64%]',
  'w-[48%]',
  'w-[80%]',
  'w-[40%]',
] as const

function skeletonWidthClass(columnIndex: number): string {
  return (
    SKELETON_WIDTH_CLASSES[columnIndex % SKELETON_WIDTH_CLASSES.length] ??
    'w-[60%]'
  )
}

export type DataTableSkeletonRowsProps = {
  columnCount: number
  /** How many placeholder rows to render. Default: {@link DEFAULT_PAGE_SIZE}. */
  rowCount?: number
  cellPadding: ResolvedDataTablePadding['cell']
  stripedConfig: ResolvedDataTableStriped | null
}

/** Pulse placeholder rows that match the table’s column / padding / stripe layout. */
export function DataTableSkeletonRows({
  columnCount,
  rowCount = DEFAULT_PAGE_SIZE,
  cellPadding,
  stripedConfig,
}: DataTableSkeletonRowsProps) {
  const safeColumnCount = Math.max(columnCount, 1)
  const safeRowCount = Math.max(rowCount, 1)

  return (
    <>
      {Array.from({ length: safeRowCount }, (_, rowIndex) => (
        <TableRow
          key={`skeleton-row-${rowIndex}`}
          className={cn(
            'hover:bg-transparent',
            getStripedRowClassName(rowIndex, stripedConfig),
          )}
          aria-hidden
        >
          {Array.from({ length: safeColumnCount }, (__, columnIndex) => (
            <TableCell
              key={`skeleton-cell-${rowIndex}-${columnIndex}`}
              className="p-0"
              style={paddingToStyle(cellPadding)}
            >
              <Skeleton
                className={cn('h-4 max-w-full', skeletonWidthClass(columnIndex))}
              />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}
