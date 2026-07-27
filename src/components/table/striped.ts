import type {
  DataTableStripedOptions,
  ResolvedDataTableStriped,
} from '@/components/table/types'

const DEFAULT_ODD_CLASS = ''
const DEFAULT_EVEN_CLASS = 'bg-muted/40'

/**
 * Normalize `striped?: boolean | DataTableStripedOptions`.
 * Returns null when zebra striping is off.
 */
export function resolveStripedOptions(
  striped?: boolean | DataTableStripedOptions,
): ResolvedDataTableStriped | null {
  if (!striped) {
    return null
  }

  if (striped === true) {
    return {
      enabled: true,
      oddClassName: DEFAULT_ODD_CLASS,
      evenClassName: DEFAULT_EVEN_CLASS,
    }
  }

  if (striped.enabled === false) {
    return null
  }

  return {
    enabled: true,
    oddClassName: striped.oddClassName ?? DEFAULT_ODD_CLASS,
    evenClassName: striped.evenClassName ?? DEFAULT_EVEN_CLASS,
  }
}

/** Pick the odd/even class for a body row index (0-based). */
export function getStripedRowClassName(
  rowIndex: number,
  striped: ResolvedDataTableStriped | null,
): string | undefined {
  if (!striped) {
    return undefined
  }

  return rowIndex % 2 === 0 ? striped.oddClassName : striped.evenClassName
}
