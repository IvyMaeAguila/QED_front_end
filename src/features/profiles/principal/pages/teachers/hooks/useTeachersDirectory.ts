import { useEffect, useState } from "react";
import type { TeacherSummary } from "../data/types";
import {
  getTeachers,
  getSchoolYear,
  getCachedTeachersList,
} from "../services/teachers.service";

interface UseTeachersDirectoryResult {
  teachers: TeacherSummary[];
  schoolYear: string;
  loading: boolean;
  error: Error | null;
}

export function useTeachersDirectory(): UseTeachersDirectoryResult {
  // Lazy init gamit ang cache, kung meron
  const [teachers, setTeachers] = useState<TeacherSummary[]>(
    () => getCachedTeachersList() ?? []
  );
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(() => getCachedTeachersList() === null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    const cached = getCachedTeachersList();

    if (cached) {
      // May cache na — i-set agad, walang loading flash
      setTeachers(cached);
      setLoading(false);
      setError(null);
    } else {
      setLoading(true);
      setError(null);
    }

    Promise.all([getTeachers(), getSchoolYear()])
      .then(([teachersResult, schoolYearResult]) => {
        if (cancelled) return;
        setTeachers(teachersResult);
        setSchoolYear(schoolYearResult);
        setLoading(false);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load teachers"));
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { teachers, schoolYear, loading, error };
}