import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Data stays "fresh" for 30s, so tab-hopping doesn't refetch constantly.
      staleTime: 30_000,
      retry: 1,
    },
  },
});
