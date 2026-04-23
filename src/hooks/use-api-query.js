import { useQuery, keepPreviousData } from "@tanstack/react-query";

/**
 * Generic API query hook built on top of TanStack React Query.
 * 
 * @param {Object} config
 * @param {import('@tanstack/react-query').QueryKey | string} config.queryKey
 * @param {Function} config.apiCall
 * @param {any} [config.params]
 * @param {Object} [config.options]
 */
export function useApiQuery({ queryKey, apiCall, params, options }) {
  const normalizedKey = Array.isArray(queryKey) ? queryKey : [queryKey];

  return useQuery({
    queryKey: params !== undefined ? [...normalizedKey, params] : normalizedKey,
    queryFn: () => apiCall({ params }),
    placeholderData: keepPreviousData,
    // refetchOnWindowFocus: false,
    ...options,
  });
}

