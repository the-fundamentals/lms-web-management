import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  getAllClassrooms,
  getAllClassroomSessions,
  queryClassroomInvoices,
} from '@the-fundamentals/core-openapi'
import {
  getAllClassroomMembersQueryKey,
  getAllClassroomPaymentPlansQueryKey,
} from '@the-fundamentals/core-openapi/react-query'
import type {
  GetAllClassroomsData,
  GetAllClassroomSessionsData,
  Options,
  QueryClassroomInvoicesData,
} from '@the-fundamentals/core-openapi'

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

/** Invalidate classroom member list queries (e.g. after adding a member). */
export function invalidateClassroomMembersQueries(
  queryClient: QueryClient,
  classroomId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: getAllClassroomMembersQueryKey({ path: { classroomId } }),
  })
}

/** Invalidate current classroom payment plans (e.g. after set plan). */
export function invalidateClassroomPaymentPlansQueries(
  queryClient: QueryClient,
  classroomId: string,
): void {
  void queryClient.invalidateQueries({
    queryKey: getAllClassroomPaymentPlansQueryKey({ path: { classroomId } }),
  })
}

/**
 * Query options for listing classroom sessions.
 *
 * Uses the SDK {@link getAllClassroomSessions} directly (POST list endpoint)
 * rather than the generated mutation helper.
 */
export function getAllClassroomSessionsOptions(
  options: Options<GetAllClassroomSessionsData>,
) {
  return queryOptions({
    queryKey: ['getAllClassroomSessions', options] as const,
    queryFn: async ({ signal }) => {
      const { data } = await getAllClassroomSessions({
        ...options,
        signal,
        throwOnError: true,
      })
      return data
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
}

/** Invalidate classroom session list queries (e.g. after create). */
export function invalidateClassroomSessionsQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: ['getAllClassroomSessions'] })
}

/**
 * Query options for listing classroom invoices.
 *
 * Uses the SDK {@link queryClassroomInvoices} directly (POST search) rather than
 * the generated mutation-only helper.
 */
export function queryClassroomInvoicesOptions(
  options: Options<QueryClassroomInvoicesData>,
) {
  return queryOptions({
    queryKey: ['queryClassroomInvoices', options] as const,
    queryFn: async ({ signal }) => {
      const { data } = await queryClassroomInvoices({
        ...options,
        signal,
        throwOnError: true,
      })
      return data
    },
    staleTime: 15_000,
    placeholderData: keepPreviousData,
  })
}

/** Invalidate classroom invoice list queries. */
export function invalidateClassroomInvoicesQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: ['queryClassroomInvoices'] })
}
