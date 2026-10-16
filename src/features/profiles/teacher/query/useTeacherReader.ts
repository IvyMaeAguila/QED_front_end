import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { teacherOfflineMessage, useTeacherQueryScope, type TeacherRequestOptions } from "./teacherQueryScope";
import type { TeacherReader } from "./TeacherReader";

export function useTeacherReader<T>(resource: readonly unknown[], fetcher: (options: TeacherRequestOptions) => Promise<T>, message: string | ((error: unknown) => string), staleTime = 30_000, ready = true): TeacherReader<T> {
  const scope = useTeacherQueryScope();
  const query = useQuery({ ...scope.options, enabled: scope.enabled && ready, staleTime, queryKey: [...scope.key, ...resource],
    queryFn: ({ signal }) => fetcher(scope.request(signal)),
  });
  const denied = query.error instanceof Error && "status" in query.error && [401, 403].includes(Number(query.error.status));
  const errorMessage = typeof message === "function" ? message(query.error) : message;
  const data = scope.enabled && !denied ? query.data : undefined;
  const offline = !scope.online || query.isPaused;
  const { refetch } = query;
  const retry = useCallback(() => {
    if (scope.enabled && ready && scope.online && !query.isFetching && !query.isPaused) void refetch({ cancelRefetch: false });
  }, [scope.enabled, ready, scope.online, query.isFetching, query.isPaused, refetch]);
  return {
    data, offline,
    loading: !scope.enabled || !ready || (!offline && (query.isFetching || query.isPending)),
    error: !scope.enabled || !ready ? null : denied ? errorMessage : offline ? data === undefined ? teacherOfflineMessage : null : query.isFetching ? null : query.isError ? errorMessage : null,
    retry,
  };
}
