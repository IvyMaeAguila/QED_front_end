import { useEffect, useState } from "react";
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
}

export function useTeacherSchedule(teacherId: string | undefined): UseTeacherScheduleResult {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(() =>
    teacherId ? getCachedTeacherProfile(teacherId) ?? null : null
  );
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(() =>
    teacherId ? !getCachedTeacherProfile(teacherId) : false
  );
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!teacherId) {
      setLoading(false);
      setTeacher(null);
      return;
    }

    const cached = getCachedTeacherProfile(teacherId);

    if (cached) {
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
  }, [teacherId]);

  return { teacher, schoolYear, loading, error, notFound: !loading && !error && !teacher };
}