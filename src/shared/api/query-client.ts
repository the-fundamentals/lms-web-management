import { QueryClient } from "@tanstack/react-query";

// No default query function. A path string is not a request. Generated hooks pass their own function and return only the body, so the Request that carries Authorization never enters the cache. List endpoints such as classrooms are POST, and a GET of the query key cannot call them.
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
