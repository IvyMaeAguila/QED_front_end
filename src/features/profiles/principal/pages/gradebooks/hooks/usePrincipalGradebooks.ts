import { useEffect, useState } from "react";
import type { GradeLevelSummary } from "../data/types";
import {
  fetchActiveGradingPeriodId,
  fetchGradeLevelSummaries,
  fetchSchoolYear,
  getCachedGradeLevelSummaries,
} from "../services/gradebooks.service";

interface UsePrincipalGradebooksResult {
  gradeLevels: GradeLevelSummary[];
  schoolYear: string;
  gradingPeriodId: number | null;
  loading: boolean;
  error: string | null;
}

export function usePrincipalGradebooks() {
  const [gradeLevels, setGradeLevels] = useState<GradeLevelSummary[]>([]);
  const [schoolYear, setSchoolYear] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    Promise.all([
      fetchGradeLevelSummaries(),
      fetchSchoolYear(controller.signal),
    ])
      .then(([levels, year]) => {
        if (controller.signal.aborted) return;
        setGradeLevels(levels);
        setSchoolYear(year);
      })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(err instanceof Error ? err.message : "Something went wrong.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  return { gradeLevels, schoolYear, loading, error };
}