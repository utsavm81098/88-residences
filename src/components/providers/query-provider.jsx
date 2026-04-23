import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { DEFAULT_STALE_TIME } from "@/utils/constant";

/**
 * Global Query Provider for TanStack React Query.
 * Manages the QueryClient instance and provides it to the component tree.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children
 */
export function QueryProvider({ children }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: DEFAULT_STALE_TIME,
            refetchOnWindowFocus: true,
            retry: 3,
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
