import { useEffect, useState } from "react";
import type { GradeLevelSummary } from "../data/types";
import { getGradeLevels, getSchoolYear } from "../services/students.service";

interface UsePrincipalStudentsOverviewResult {
  gradeLevels: GradeLevelSummary[];
  totalStudents: number;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
}

export function usePrincipalStudentsOverview(): UsePrincipalStudentsOverviewResult {
  const [gradeLevels, setGradeLevels] = useState<GradeLevelSummary[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    Promise.all([getGradeLevels(), getSchoolYear()])
      .then(([gradeLevelsResult, schoolYearResult]) => {
        if (cancelled) return;
        setGradeLevels(gradeLevelsResult);
        setSchoolYear(schoolYearResult);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error("Failed to load students overview"));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const totalStudents = gradeLevels.reduce((sum, g) => sum + g.totalStudents, 0);

  return { gradeLevels, totalStudents, schoolYear, loading, error };
}
