import { Link, createFileRoute } from '@tanstack/react-router'
import { PlusIcon } from 'lucide-react'
import * as React from 'react'

import {
  DEFAULT_PAGE_SIZE,
  DataTable,
  getColumnFilterValue,
  sortingStateToApiParams,
} from '@/components/table'
import type {
  ColumnFiltersState,
  PaginationState,
  SortingState,
} from '@/components/table'
import { Button } from '@/components/ui/button'
import { classroomColumns } from '@/features/classrooms/classroom-columns'
import { useClassrooms } from '@/features/classrooms/classrooms-query'

export const Route = createFileRoute('/dashboard/classrooms/list')({
  component: AllClassroomsPage,
})

const NAME_FILTER_DEBOUNCE_MS = 300

const SORTABLE_COLUMNS = ['name', 'createdDate', 'lastModifiedDate'] as const

function AllClassroomsPage() {
  const [pagination, setPagination] = React.useState<PaginationState>({
    pageIndex: 0,
    pageSize: DEFAULT_PAGE_SIZE,
  })
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    [],
  )
  const [sorting, setSorting] = React.useState<SortingState>([])

  const nameFilter = getColumnFilterValue(columnFilters, 'name').trim()
  const [debouncedNameFilter, setDebouncedNameFilter] =
    React.useState(nameFilter)

  React.useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedNameFilter(nameFilter)
    }, NAME_FILTER_DEBOUNCE_MS)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [nameFilter])

  const sortParams = sortingStateToApiParams(sorting)

  const { data = [], error, isPending, isError, refetch, isFetching } =
    useClassrooms({
      body: {
        page: pagination.pageIndex,
        size: pagination.pageSize,
        ...sortParams,
        ...(debouncedNameFilter
          ? {
              filters: [
                {
                  field: 'name',
                  operator: 'like',
                  value: debouncedNameFilter,
                },
              ],
            }
          : {}),
      },
    })

  const hasMore = data.length >= pagination.pageSize
  const pageCount = hasMore
    ? pagination.pageIndex + 2
    : Math.max(pagination.pageIndex + 1, 1)

  const resetToFirstPage = () => {
    setPagination((previous) =>
      previous.pageIndex === 0 ? previous : { ...previous, pageIndex: 0 },
    )
  }

  const showError = isError && data.length === 0 && !isFetching

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            All Classrooms
          </h1>
          <p className="text-muted-foreground">
            Browse and manage every classroom in the platform.
          </p>
        </div>
        <Button asChild className="rounded-md">
          <Link to="/dashboard/classrooms/new">
            <PlusIcon className="size-4" aria-hidden />
            Create classroom
          </Link>
        </Button>
      </div>

      {showError ? (
        <div className="flex min-h-48 flex-col items-center justify-center gap-3">
          <p className="text-sm text-destructive" role="alert">
            {error instanceof Error
              ? error.message
              : 'Could not load classrooms.'}
          </p>
          <Button
            type="button"
            variant="outline"
            className="rounded-md"
            disabled={isFetching}
            onClick={() => void refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <DataTable
          columns={classroomColumns}
          data={data}
          loading={isPending || isFetching}
          skeletonRowCount={pagination.pageSize}
          filterColumnId="name"
          filterPlaceholder="Filter classrooms..."
          padding={{
            cell: { x: 16, y: 14 },
            header: { x: 16, y: 12 },
          }}
          numbering={{
            enabled: true,
            mode: 'page' as const,
            title: 'No.',
          }}
          sorting={{
            mode: 'server',
            columns: [...SORTABLE_COLUMNS],
            sorting,
            onSortingChange: (next) => {
              setSorting(next)
              resetToFirstPage()
            },
            enableMultiSort: false,
          }}
          filtering={{
            mode: 'server',
            columnFilters,
            onColumnFiltersChange: (next) => {
              setColumnFilters(next)
              resetToFirstPage()
            },
          }}
          pagination={{
            mode: 'server',
            pagination,
            onPaginationChange: (next) => {
              setPagination((previous) =>
                next.pageSize !== previous.pageSize
                  ? { pageIndex: 0, pageSize: next.pageSize }
                  : next,
              )
            },
            pageCount,
          }}
          striped={true}
        />
      )}
    </div>
  )
}
