import { useEffect, useState } from "react";
import type { TeacherSummary } from "../data/types";
import { getTeachers, getSchoolYear } from "../services/teachersService";

interface UseTeachersDirectoryResult {
  teachers: TeacherSummary[];
  schoolYear: string;
  loading: boolean;
  error: Error | null;
}

export function useTeachersDirectory(): UseTeachersDirectoryResult {
  const [teachers, setTeachers] = useState<TeacherSummary[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getTeachers(), getSchoolYear()])
      .then(([teachersResult, schoolYearResult]) => {
        if (cancelled) return;
        setTeachers(teachersResult);
        setSchoolYear(schoolYearResult);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load teachers"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { teachers, schoolYear, loading, error };
}
