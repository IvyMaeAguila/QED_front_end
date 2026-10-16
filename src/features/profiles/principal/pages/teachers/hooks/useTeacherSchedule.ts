import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { TeacherProfile } from "../data/types";
import {
  getTeacherProfile,
  getSchoolYear,
  getCachedTeacherProfile,
} from "../services/teachers.service";

interface UseTeacherScheduleResult {
  teacher: TeacherProfile | null;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  notFound: boolean;
  retry: () => void;
}

export function useTeacherSchedule(teacherId: string | undefined, enabled = true): UseTeacherScheduleResult {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() =>
    teacherId ? getCachedTeacherProfile(teacherId) ?? null : null
  );
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(() =>
    !enabled || (teacherId ? !getCachedTeacherProfile(teacherId) : false)
  );
  const [error, setError] = useState<Error | null>(null);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    if (!enabled) return;

    if (!teacherId) {
      setLoading(false);
      setTeacher(null);
      return;
    }

    const cached = getCachedTeacherProfile(teacherId);

    if (cached && attempt === 0) {
      setTeacher(cached);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
      setTeacher(null);
    }

    Promise.all([getTeacherProfile(teacherId), getSchoolYear()])
      .then(([teacherResult, schoolYearResult]) => {
        if (cancelled) return;
        setTeacher(teacherResult);
        setSchoolYear(schoolYearResult);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load teacher schedule"));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teacherId, attempt, enabled]);

  return { teacher, schoolYear, loading: !enabled || loading, error, retry: () => setAttempt(value => value + 1), notFound: !loading && !error && !teacher };
}
