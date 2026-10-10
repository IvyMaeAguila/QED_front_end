import { useState } from "react";
import { useRouteEffect as useEffect } from "@shared/loading/RoutePreview";
import type { GradeLevelSummary } from "../data/types";
import { getGradeLevels, getSchoolYear } from "../services/students.service";

interface UsePrincipalStudentsOverviewResult {
  gradeLevels: GradeLevelSummary[];
  totalStudents: number;
  schoolYear: string;
  loading: boolean;
  error: Error | null;
  retry: () => void;
}

export function usePrincipalStudentsOverview(): UsePrincipalStudentsOverviewResult {
  const [gradeLevels, setGradeLevels] = useState<GradeLevelSummary[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const [attempt, setAttempt] = useState(0);
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
  }, [attempt]);

  const totalStudents = gradeLevels.reduce((sum, g) => sum + g.totalStudents, 0);

  return { gradeLevels, totalStudents, schoolYear, loading, error, retry: () => setAttempt(value => value + 1) };
}

