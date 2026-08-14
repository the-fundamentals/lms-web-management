import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import { getAllClassrooms } from '@the-fundamentals/core-openapi'
import type { GetAllClassroomsData, Options } from '@the-fundamentals/core-openapi'

/**
 * Query options for listing classrooms.
 *
 * Uses the SDK {@link getAllClassrooms} directly (POST list endpoint) rather than
 * the generated mutation helper.
 */
export function getAllClassroomsOptions(
  options: Options<GetAllClassroomsData> = { body: {} },
) {
  return queryOptions({
    queryKey: ['getAllClassrooms', options] as const,
    queryFn: async ({ signal }) => {
      const { data } = await getAllClassrooms({
        ...options,
        signal,
        throwOnError: true,
      })
      return data
    },
    staleTime: 30_000,
    // Keep the previous page visible while page / filter / size refetch.
    placeholderData: keepPreviousData,
  })
}

/** Cached classrooms list via {@link getAllClassroomsOptions}. */
export function useClassrooms(
  options: Options<GetAllClassroomsData> = { body: {} },
) {
  return useQuery(getAllClassroomsOptions(options))
}

/** Invalidate getAllClassrooms queries (e.g. after create). */
export function invalidateClassroomsQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['getAllClassrooms'] })
}
