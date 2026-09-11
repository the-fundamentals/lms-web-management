import { keepPreviousData, queryOptions } from '@tanstack/react-query'
import { getAllAccounts } from '@the-fundamentals/core-openapi'
import type { GetAllAccountsData, Options } from '@the-fundamentals/core-openapi'

/**
 * Query options for listing account profiles.
 *
 * Uses the SDK {@link getAllAccounts} directly (POST list endpoint).
 */
export function getAllAccountsOptions(
  options: Options<GetAllAccountsData> = { body: {} },
) {
  return queryOptions({
    queryKey: ['getAllAccounts', options] as const,
    queryFn: async ({ signal }) => {
      const { data } = await getAllAccounts({
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
