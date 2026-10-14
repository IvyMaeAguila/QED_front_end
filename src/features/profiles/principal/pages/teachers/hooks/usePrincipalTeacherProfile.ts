import { useSyncExternalStore } from "react";
import { onlineManager, useQueries, useQuery } from "@tanstack/react-query";
import { useAuth } from "@shared/hooks/useAuth";
import { useRoutePreview } from "@shared/loading/RoutePreview";
import { QueryHttpError } from "@shared/http/QueryHttpError";
import { principalStudentKeys, principalTeacherKeys } from "@shared/query/queryClient";
import { getClassList, getRosterAcademicYear } from "../../students/services/students.service";
import { fetchPrincipalTeacherProfile } from "../services/principalTeacherProfile.service";
import type { TeacherClassRoster } from "../components/TeacherClassRosters";

const policy = { staleTime: 30_000, gcTime: 5 * 60_000 };
const subscribe = (notify: () => void) => onlineManager.subscribe(notify);
const getOnline = () => onlineManager.isOnline();
const forbidden = (error: unknown) => error instanceof QueryHttpError && error.status === 403;
const offlineError = new Error("You're offline. Reconnect to load or refresh the teacher profile.");

export function usePrincipalTeacherProfile(teacherId: string | undefined) {
  const { user, isLoading, sessionScope, expireSession } = useAuth();
  const preview = useRoutePreview();
  const online = useSyncExternalStore(subscribe, getOnline);
  const authorized = !preview && !isLoading && user?.role === "PRINCIPAL";
  const enabled = authorized && !!teacherId;
  const role = user?.role ?? "", userId = String(user?.id ?? "");
  const guarded = async <T,>(request: Promise<T>, signal: AbortSignal): Promise<T> => {
    try { return await request; }
    catch (error) {
      if (!signal.aborted && error instanceof QueryHttpError && error.status === 401) expireSession(sessionScope);
      throw error;
    }
  };
  const year = useQuery({
    ...policy, queryKey: principalStudentKeys.rosterYear(sessionScope, role, userId), enabled,
    queryFn: ({ signal }) => guarded(getRosterAcademicYear(signal), signal),
  });
  const profile = useQuery({
    ...policy, queryKey: principalTeacherKeys.profile(sessionScope, role, userId, year.data?.id ?? null, teacherId),
    enabled: enabled && !!year.data && !forbidden(year.error),
    queryFn: ({ signal }) => guarded(fetchPrincipalTeacherProfile(teacherId!, signal), signal),
  });
  const denied = forbidden(year.error) || forbidden(profile.error);
  const teacher = enabled && !denied ? profile.data : undefined;
  // Deduplication Map is view metadata, not a second server-state cache.
  const classes = new Map<number, { section: string; room: string | null }>();
  for (const advisory of teacher?.advisories ?? []) {
    const id = Number(advisory.classId);
    if (Number.isInteger(id) && id > 0 && !classes.has(id)) classes.set(id, {
      section: `${advisory.gradeLevel ?? ""} · ${advisory.section ?? ""}`, room: advisory.room,
    });
  }
  const targets = [...classes.entries()];
  const rosters = useQueries({ queries: targets.map(([id]) => ({
    ...policy,
    queryKey: principalStudentKeys.roster(sessionScope, role, userId, year.data?.id ?? null, "class", id),
    enabled: enabled && !!teacher && !!year.data && !denied,
    queryFn: ({ signal }: { signal: AbortSignal }) => guarded(getClassList(id, signal), signal),
  })) });
  const paused = year.isPaused || profile.isPaused || rosters.some(q => q.isPaused);
  const fetching = year.isFetching || profile.isFetching || rosters.some(q => q.isFetching);
  const offline = enabled && (!online || paused);
  const requestError = (!year.isFetching ? year.error : null) ?? (!profile.isFetching ? profile.error : null);
  const error = enabled ? offline ? offlineError : requestError : null;
  const rosterDenied = rosters.some(q => forbidden(q.error));
  const classRosters: TeacherClassRoster[] = !enabled || denied || rosterDenied ? [] : rosters.flatMap((q, index) => {
    if (!q.data) return [];
    const [classId, advisory] = targets[index];
    const sectionLabel = `${q.data.grade} · ${q.data.sectionInfo.section}`;
    return [{ classId, sectionLabel: sectionLabel.trim() || advisory.section || "Section not assigned",
      room: advisory.room || q.data.sectionInfo.room, students: q.data.roster }];
  });
  const canRetry = enabled && online && !paused && !fetching;
  const retryRosters = () => { if (canRetry) rosters.forEach(q => { void q.refetch(); }); };
  return {
    schedule: {
      teacher: teacher ?? null,
      schoolYear: enabled && !denied ? year.data?.label ?? "" : "",
      loading: !authorized || (enabled && online && !paused && !error && teacher === undefined && (year.isPending || profile.isPending || fetching)),
      error,
      notFound: authorized && (!teacherId || (teacher === null && (!error || offline))),
      retry: () => {
        if (!canRetry) return;
        void year.refetch();
        if (year.data && !forbidden(year.error)) void profile.refetch();
        rosters.forEach(q => { void q.refetch(); });
      },
    },
    classRosters,
    rostersLoading: enabled && online && !paused && rosters.some(q => q.isPending && q.data === undefined),
    rostersError: rosters.some(q => !!q.error || q.data === null),
    retryRosters,
    offline,
  };
}
