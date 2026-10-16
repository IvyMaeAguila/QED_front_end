import { useLayoutEffect, useRef, useSyncExternalStore } from "react";
import { onlineManager } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";

export interface TeacherRequestOptions {
  signal?: AbortSignal;
  onUnauthorized?: () => void;
}
export const teacherKeys = {
  all: (session: number, role: string, user: string) => ["session", session, role, user, "teacher"] as const,
};
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const onlineSnapshot = () => onlineManager.isOnline();
export const teacherOfflineMessage = "You're offline. Reconnect and try again.";

// Imported only by lazy Teacher data controllers, never their preview views.
export function useTeacherQueryScope() {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const enabled = !preview && !isLoading && user?.role === "TEACHER";
  const active = useRef(false);
  const online = useSyncExternalStore(subscribe, onlineSnapshot);
  useLayoutEffect(() => {
    active.current = true;
    onlineManager.setOnline(navigator.onLine);
    return () => { active.current = false; };
  }, [sessionScope, enabled]);
  return {
    enabled, online,
    key: teacherKeys.all(sessionScope, user?.role ?? "", String(user?.id ?? "")),
    request: (signal: AbortSignal): TeacherRequestOptions => ({ signal,
      onUnauthorized: () => { if (active.current && !signal.aborted) expireSession(sessionScope); },
    }),
    // Writes cannot be undone by unmounting. A completed401 must expire its
    // originating session even after navigation; the generation guard still
    // prevents an old write from expiring a newer login/account.
    mutationRequest: (signal: AbortSignal): TeacherRequestOptions => ({signal,
      onUnauthorized: () => { if(!signal.aborted) expireSession(sessionScope); },
    }),
    options: { enabled, staleTime: 30_000, gcTime: 5 * 60_000, retry: false as const,
      refetchOnWindowFocus: false, refetchOnReconnect: true },
  };
}
