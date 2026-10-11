import { QueryClient } from "@tanstack/react-query";
import { registerSessionQueryCleanup } from "./sessionQueries";

// One client per browser runtime. No persistence of authenticated data.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
      retry: false,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
});

export const directoryKeys = {
  session: (session: number, role: string, userId: string) =>
    ["session", session, role, userId, "principal-teachers-directory"] as const,
};

export function clearSessionQueries() {
  // Cancellation is initiated synchronously before removing cached results.
  void queryClient.cancelQueries();
  queryClient.clear();
}

registerSessionQueryCleanup(clearSessionQueries);
