import { keepPreviousData, queryOptions, useQuery } from '@tanstack/react-query'
import type { QueryClient } from '@tanstack/react-query'
import {
  getAllClassroomMembers,
  getAllClassroomSessions,
  getAllClassrooms,
  getClassroomMemberAttendances,
} from '@the-fundamentals/core-openapi'
import type {
  GetAllClassroomMembersData,
  GetAllClassroomSessionsData,
  GetAllClassroomsData,
  GetClassroomMemberAttendancesData,
  Options,
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

/**
 * Query options for listing members of a classroom.
 *
 * Uses the SDK {@link getAllClassroomMembers} directly (POST list endpoint).
 */
export function getAllClassroomMembersOptions(
  options: Options<GetAllClassroomMembersData>,
) {
  return queryOptions({
    queryKey: ['getAllClassroomMembers', options] as const,
    queryFn: async ({ signal }) => {
      const { data } = await getAllClassroomMembers({
        ...options,
        signal,
        throwOnError: true,
      })
      return data
    },
    staleTime: 30_000,
  })
}

/** Invalidate getAllClassrooms queries (e.g. after create). */
export function invalidateClassroomsQueries(queryClient: QueryClient): void {
  void queryClient.invalidateQueries({ queryKey: ['getAllClassrooms'] })
}

/** Invalidate classroom member list queries (e.g. after adding a member). */
export function invalidateClassroomMembersQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: ['getAllClassroomMembers'] })
}

/**
 * Query options for listing sessions of a classroom.
 *
 * Uses the SDK {@link getAllClassroomSessions} directly (POST list endpoint).
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
    staleTime: 30_000,
  })
}

/** Invalidate classroom session list queries (e.g. after creating a session). */
export function invalidateClassroomSessionsQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({ queryKey: ['getAllClassroomSessions'] })
}

/**
 * Query options for listing a classroom member's attendance history.
 *
 * Uses the SDK {@link getClassroomMemberAttendances} directly (POST list endpoint).
 */
export function getClassroomMemberAttendancesOptions(
  options: Options<GetClassroomMemberAttendancesData>,
) {
  return queryOptions({
    queryKey: ['getClassroomMemberAttendances', options] as const,
    queryFn: async ({ signal }) => {
      const { data } = await getClassroomMemberAttendances({
        ...options,
        signal,
        throwOnError: true,
      })
      return data
    },
    staleTime: 30_000,
  })
}

/** Invalidate a classroom member's attendance history queries (e.g. after taking attendance). */
export function invalidateClassroomMemberAttendancesQueries(
  queryClient: QueryClient,
): void {
  void queryClient.invalidateQueries({
    queryKey: ['getClassroomMemberAttendances'],
  })
}
