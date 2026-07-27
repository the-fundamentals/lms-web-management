import type { CSSProperties } from 'react'

import type {
  DataTablePaddingOptions,
  DataTablePaddingValue,
  ResolvedDataTablePadding,
} from '@/components/table/types'

const DEFAULT_PADDING_X = 16
const DEFAULT_PADDING_Y = 14

function resolveAxis(
  value: DataTablePaddingValue | undefined,
  fallbackX: number,
  fallbackY: number,
): { x: number; y: number } {
  if (value == null) {
    return { x: fallbackX, y: fallbackY }
  }

  if (typeof value === 'number') {
    return { x: value, y: value }
  }

  return {
    x: value.x ?? fallbackX,
    y: value.y ?? fallbackY,
  }
}

/**
 * Normalize numeric padding from the parent.
 *
 * @example
 * padding={16}
 * padding={{ x: 16, y: 12 }}
 * padding={{ cell: { x: 16, y: 14 }, header: { x: 16, y: 12 } }}
 */
export function resolvePaddingOptions(
  padding?: DataTablePaddingValue | DataTablePaddingOptions,
): ResolvedDataTablePadding {
  if (padding == null) {
    return {
      cell: { x: DEFAULT_PADDING_X, y: DEFAULT_PADDING_Y },
      header: { x: DEFAULT_PADDING_X, y: DEFAULT_PADDING_Y },
    }
  }

  // Top-level number or { x, y } applies to both cell + header.
  if (typeof padding === 'number' || ('x' in padding && !('cell' in padding) && !('header' in padding))) {
    const axis = resolveAxis(padding as DataTablePaddingValue, DEFAULT_PADDING_X, DEFAULT_PADDING_Y)
    return { cell: axis, header: axis }
  }

  const options = padding as DataTablePaddingOptions
  const base = resolveAxis(
    options.x != null || options.y != null
      ? { x: options.x, y: options.y }
      : undefined,
    DEFAULT_PADDING_X,
    DEFAULT_PADDING_Y,
  )

  return {
    cell: resolveAxis(options.cell, base.x, base.y),
    header: resolveAxis(options.header, base.x, base.y),
  }
}

/** Turn resolved x/y (px) into an inline style object. */
export function paddingToStyle(axis: {
  x: number
  y: number
}): CSSProperties {
  return {
    paddingLeft: axis.x,
    paddingRight: axis.x,
    paddingTop: axis.y,
    paddingBottom: axis.y,
  }
}
