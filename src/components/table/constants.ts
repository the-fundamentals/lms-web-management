/**
 * Shared pagination defaults for DataTable.
 *
 * Common page-size choices (10 / 20 / 25 / 50) match what users see in
 * GitHub, Linear, Notion, and shadcn’s data-table guide.
 */
export const DEFAULT_PAGE_SIZE = 10

/** Options shown in the “Rows per page” select. */
export const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 25, 30, 40, 50] as const

export type PageSizeOption = (typeof DEFAULT_PAGE_SIZE_OPTIONS)[number]
