import { useEffect, useState } from "react";
import type { TeacherProfile } from "../data/types";
import { getTeacherProfile, getSchoolYear } from "../services/teachersService";

interface UseTeacherScheduleResult {
  teacher: TeacherProfile | null;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  // true once loading has finished and no teacher was found — distinct
  // from `error`, since a missing/stale id is an expected outcome, not a
  // failed request.
  notFound: boolean;
}

export function useTeacherSchedule(teacherId: string | undefined): UseTeacherScheduleResult {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setTeacher(null);

    if (!teacherId) {
      setLoading(false);
      return;
    }

    Promise.all([getTeacherProfile(teacherId), getSchoolYear()])
      .then(([teacherResult, schoolYearResult]) => {
        if (cancelled) return;
        setTeacher(teacherResult);
        setSchoolYear(schoolYearResult);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load teacher schedule"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [teacherId]);

  return { teacher, schoolYear, loading, error, notFound: !loading && !error && !teacher };
}
